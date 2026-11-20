import dns from "dns/promises";
import { DNSSecurityInfo, Finding } from "@/types/scanner";

export async function analyzeDNSSecurity(domain: string): Promise<{
  dnsDetails: DNSSecurityInfo;
  findings: Finding[];
}> {
  const findings: Finding[] = [];

  let resolvedIps: string[] = [];
  let hasIpv6 = false;
  let hasMx = false;
  let nameservers: string[] = [];
  const caaRecords: string[] = [];

  // 1. Resolve A / AAAA
  try {
    const aRecords = await dns.resolve4(domain).catch(() => []);
    const aaaaRecords = await dns.resolve6(domain).catch(() => []);
    resolvedIps = [...aRecords, ...aaaaRecords];
    hasIpv6 = aaaaRecords.length > 0;
  } catch {
    // Handled gracefully
  }

  // 2. Resolve NS
  try {
    nameservers = await dns.resolveNs(domain).catch(() => []);
  } catch {
    // Optional
  }

  // 3. Resolve MX
  try {
    const mx = await dns.resolveMx(domain).catch(() => []);
    hasMx = mx.length > 0;
  } catch {
    // Optional
  }

  // Build hierarchy for domain traversal (RFC 6844 CAA, RFC 7489 DMARC, RFC 7208 SPF)
  const domainParts = domain.split(".");
  const domainsToCheck: string[] = [domain];
  const parts = [...domainParts];
  while (parts.length > 2) {
    parts.shift();
    domainsToCheck.push(parts.join("."));
  }

  // 4. Resolve CAA (with RFC 6844 tree traversal)
  try {
    for (const d of domainsToCheck) {
      const caa = await dns.resolveCaa(d).catch(() => []);
      for (const record of caa) {
        if (record.issue) caaRecords.push(`issue: ${record.issue}`);
        if (record.issuewild) caaRecords.push(`issuewild: ${record.issuewild}`);
        if (record.iodef) caaRecords.push(`iodef: ${record.iodef}`);
      }
      if (caaRecords.length > 0) break;
    }
  } catch {
    // CAA not configured
  }

  // 5. SPF Record Analysis (with parent domain inheritance)
  let spfRecord: string | null = null;
  let spfStatus: "pass" | "fail" | "warning" = "fail";
  let spfQualifier = "~all";
  let spfInheritedFrom: string | null = null;

  for (const d of domainsToCheck) {
    try {
      const txtRecords = await dns.resolveTxt(d).catch(() => []);
      for (const chunkGroup of txtRecords) {
        const fullTxt = chunkGroup.join("");
        if (fullTxt.toLowerCase().startsWith("v=spf1")) {
          spfRecord = fullTxt;
          if (d !== domain) {
            spfInheritedFrom = d;
          }
          break;
        }
      }
      if (spfRecord) break;
    } catch {
      // No TXT records
    }
  }

  if (spfRecord) {
    if (spfRecord.includes("-all")) {
      spfStatus = "pass";
      spfQualifier = "-all (Hard Fail)";
      findings.push({
        id: "dns-spf-pass",
        category: "dns",
        checkName: "SPF Record",
        title: spfInheritedFrom
          ? `Strict SPF Active (Inherited from ${spfInheritedFrom} -all)`
          : "Strict SPF Record Active (-all)",
        status: "pass",
        severity: "safe",
        scoreImpact: 0,
        description: spfInheritedFrom
          ? `Sender Policy Framework is strictly enforced via apex domain (${spfInheritedFrom}) with hard fail (-all). Subdomain does not designate external mail senders.`
          : "Sender Policy Framework strictly authorizes designated mail servers and blocks unauthorized senders with hard fail (-all).",
        recommendation: "Maintain designated SPF IP blocks as mail infrastructure evolves.",
        rawDetails: { spf: spfRecord, inheritedFrom: spfInheritedFrom },
      });
    } else if (spfRecord.includes("~all")) {
      spfStatus = "pass";
      spfQualifier = "~all (Soft Fail)";
      findings.push({
        id: "dns-spf-soft",
        category: "dns",
        checkName: "SPF Record",
        title: spfInheritedFrom
          ? `SPF Active (Inherited from ${spfInheritedFrom} ~all)`
          : "SPF Record Active (~all)",
        status: "pass",
        severity: "info",
        scoreImpact: 0,
        description: spfInheritedFrom
          ? `SPF policy enforced via apex domain (${spfInheritedFrom}) with soft fail (~all). Acceptable when combined with strict DMARC.`
          : "SPF record configured with soft fail (~all). Acceptable when combined with strict DMARC.",
        recommendation: "Consider moving towards strict '-all' once all legitimate email sources are confirmed.",
        rawDetails: { spf: spfRecord, inheritedFrom: spfInheritedFrom },
      });
    } else if (spfRecord.includes("+all")) {
      spfStatus = "warning";
      spfQualifier = "+all (Permissive)";
      findings.push({
        id: "dns-spf-permissive",
        category: "dns",
        checkName: "SPF Record Misconfiguration",
        title: "Dangerous SPF Record with +all",
        status: "fail",
        severity: "critical",
        scoreImpact: -12,
        description: "SPF record includes '+all', allowing ANY server on the internet to send mail as your domain.",
        recommendation: "Change '+all' to '-all' or '~all' immediately.",
        rawDetails: { spf: spfRecord },
      });
    } else {
      spfStatus = "pass";
      findings.push({
        id: "dns-spf-ok",
        category: "dns",
        checkName: "SPF Record",
        title: "SPF Record Present",
        status: "pass",
        severity: "safe",
        scoreImpact: 0,
        description: `SPF record identified: ${spfRecord}`,
        recommendation: "Verify all sending servers are included.",
        rawDetails: { spf: spfRecord },
      });
    }
  } else {
    findings.push({
      id: "dns-spf-missing",
      category: "dns",
      checkName: "SPF Record",
      title: "Missing SPF (Sender Policy Framework) Record",
      status: "fail",
      severity: "high",
      scoreImpact: -10,
      description: "No SPF record found in DNS TXT entries. Attackers can forge emails from your domain with impunity.",
      recommendation: "Publish a TXT record at your apex domain with 'v=spf1 include:_spf.example.com ~all'.",
    });
  }

  // 6. DMARC Record Analysis (_dmarc.<domain>) with RFC 7489 Organizational Domain fallback
  let dmarcRecord: string | null = null;
  let dmarcPolicy: "reject" | "quarantine" | "none" | "unknown" = "unknown";
  let dmarcStatus: "pass" | "fail" | "warning" = "fail";
  let dmarcInheritedFrom: string | null = null;

  for (const d of domainsToCheck) {
    try {
      const dmarcHost = `_dmarc.${d}`;
      const dmarcTxt = await dns.resolveTxt(dmarcHost).catch(() => []);
      for (const chunkGroup of dmarcTxt) {
        const fullTxt = chunkGroup.join("");
        if (fullTxt.toLowerCase().startsWith("v=dmarc1")) {
          dmarcRecord = fullTxt;
          if (d !== domain) {
            dmarcInheritedFrom = d;
          }
          break;
        }
      }
      if (dmarcRecord) break;
    } catch {
      // Continue to next domain in hierarchy
    }
  }

  if (dmarcRecord) {
    const policyMatch = dmarcRecord.match(/p=(reject|quarantine|none)/i);
    const spMatch = dmarcRecord.match(/sp=(reject|quarantine|none)/i);
    if (policyMatch) {
      dmarcPolicy = policyMatch[1].toLowerCase() as "reject" | "quarantine" | "none";
    }
    // Subdomain policy tag (sp=) takes precedence for subdomains per RFC 7489
    const effectivePolicy = (dmarcInheritedFrom && spMatch)
      ? (spMatch[1].toLowerCase() as "reject" | "quarantine" | "none")
      : dmarcPolicy;

    if (effectivePolicy === "reject") {
      dmarcStatus = "pass";
      findings.push({
        id: "dns-dmarc-reject",
        category: "dns",
        checkName: "DMARC Policy",
        title: dmarcInheritedFrom
          ? `Robust DMARC Subdomain Policy Enforced (sp=reject via ${dmarcInheritedFrom})`
          : "Robust DMARC Enforcement (p=reject)",
        status: "pass",
        severity: "safe",
        scoreImpact: 0,
        description: dmarcInheritedFrom
          ? `Subdomain email spoofing is strictly rejected by apex domain (${dmarcInheritedFrom}) DMARC policy (RFC 7489 Section 6.6.3).`
          : "DMARC policy set to 'reject'. Unauthorized spoofed emails are rejected at recipient mail gateways.",
        recommendation: "Monitor DMARC aggregate reports (rua) for delivery health.",
        rawDetails: { dmarc: dmarcRecord, effectivePolicy, inheritedFrom: dmarcInheritedFrom },
      });
    } else if (effectivePolicy === "quarantine") {
      dmarcStatus = "pass";
      findings.push({
        id: "dns-dmarc-quarantine",
        category: "dns",
        checkName: "DMARC Policy",
        title: dmarcInheritedFrom
          ? `DMARC Quarantine Policy Active (sp=quarantine via ${dmarcInheritedFrom})`
          : "DMARC Quarantine Policy Active (p=quarantine)",
        status: "pass",
        severity: "info",
        scoreImpact: 0,
        description: "DMARC policy instructs receivers to route suspicious emails to spam/quarantine.",
        recommendation: "Progressively move towards 'p=reject' once legitimate traffic aligns with SPF/DKIM.",
        rawDetails: { dmarc: dmarcRecord, effectivePolicy, inheritedFrom: dmarcInheritedFrom },
      });
    } else {
      dmarcStatus = "warning";
      findings.push({
        id: "dns-dmarc-none",
        category: "dns",
        checkName: "DMARC Policy",
        title: "Permissive DMARC Policy (p=none)",
        status: "warning",
        severity: "medium",
        scoreImpact: -4,
        description: "DMARC is in monitoring mode only (p=none). Spoofed messages are still delivered to recipient inboxes.",
        recommendation: "Upgrade DMARC policy from 'p=none' to 'p=quarantine' or 'p=reject'.",
        rawDetails: { dmarc: dmarcRecord },
      });
    }
  } else {
    findings.push({
      id: "dns-dmarc-missing",
      category: "dns",
      checkName: "DMARC Record",
      title: "Missing DMARC Protection Record",
      status: "fail",
      severity: "high",
      scoreImpact: -10,
      description: "No _dmarc TXT record detected. Essential defense against domain impersonation and BEC fraud.",
      recommendation: "Add TXT record for '_dmarc.yourdomain.com' with 'v=DMARC1; p=reject; rua=mailto:dmarc@yourdomain.com'.",
    });
  }

  // 7. CAA Records Check
  if (caaRecords.length > 0) {
    findings.push({
      id: "dns-caa-present",
      category: "dns",
      checkName: "CAA Records",
      title: "Certificate Authority Authorization (CAA) Configured",
      status: "pass",
      severity: "safe",
      scoreImpact: 0,
      description: `CAA records restrict which certificate authorities are permitted to issue certs: ${caaRecords.join(", ")}.`,
      recommendation: "Maintain list of authorized CAs.",
      rawDetails: { caa: caaRecords },
    });
  } else {
    findings.push({
      id: "dns-caa-missing",
      category: "dns",
      checkName: "CAA Records",
      title: "No CAA Records Configured",
      status: "warning",
      severity: "low",
      scoreImpact: -1,
      description: "Any public CA can technically issue a certificate for this domain if verification is met.",
      recommendation: "Add DNS CAA records specifying allowed CAs (e.g. '0 issue letsencrypt.org').",
    });
  }

  // 8. DNSSEC Cryptographic Validation (via Cloudflare DoH with Authenticated Data flag check)
  const dnssecResult = await verifyDNSSECWithDoH(domain);
  if (dnssecResult.enabled) {
    findings.push({
      id: "dns-dnssec-verified",
      category: "dns",
      checkName: "DNSSEC Validation",
      title: "DNSSEC Cryptographically Signed & Verified",
      status: "pass",
      severity: "safe",
      scoreImpact: 0,
      description: "DNS records are signed with valid cryptographic RRSIG/DS keys, protecting against DNS spoofing and cache poisoning.",
      recommendation: "Maintain key rollover schedule with domain registrar.",
      rawDetails: { details: dnssecResult.details },
    });
  } else {
    findings.push({
      id: "dns-dnssec-missing",
      category: "dns",
      checkName: "DNSSEC Validation",
      title: "DNSSEC Not Enabled or Unsigned",
      status: "info",
      severity: "low",
      scoreImpact: -2,
      description: "DNSSEC cryptographic validation is not active. DNS responses could theoretically be manipulated by on-path resolvers.",
      recommendation: "Enable DNSSEC through your DNS provider (e.g. Cloudflare, Route53) and registrar.",
      rawDetails: { details: dnssecResult.details },
    });
  }

  // IPv6 check
  if (hasIpv6) {
    findings.push({
      id: "dns-ipv6-ok",
      category: "dns",
      checkName: "IPv6 Readiness",
      title: "IPv6 (AAAA) Records Configured",
      status: "pass",
      severity: "safe",
      scoreImpact: 0,
      description: "Domain provides dual-stack IPv4 and IPv6 connectivity.",
      recommendation: "Ensure firewall rules are symmetrically applied across IPv4 and IPv6.",
    });
  }

  return {
    dnsDetails: {
      resolvedIps,
      hasIpv6,
      hasMx,
      spf: {
        present: Boolean(spfRecord),
        rawRecord: spfRecord,
        status: spfStatus,
        qualifier: spfQualifier,
      },
      dmarc: {
        present: Boolean(dmarcRecord),
        rawRecord: dmarcRecord,
        policy: dmarcPolicy,
        status: dmarcStatus,
      },
      dnssec: dnssecResult,
      caa: {
        present: caaRecords.length > 0,
        records: caaRecords,
      },
      nameservers,
    },
    findings,
  };
}

/**
 * Checks DNSSEC via Public DNS-over-HTTPS (DoH) API query asking for Authenticated Data (AD) flag.
 * Does not make assumptions: only marks verified when AD=true or DS record exists.
 */
async function verifyDNSSECWithDoH(domain: string): Promise<{
  enabled: boolean;
  status: "verified" | "not_configured" | "indeterminate";
  details: string;
}> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=A&do=true`, {
      headers: { Accept: "application/dns-json" },
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      const data = (await res.json()) as { AD?: boolean; Answer?: Array<{ type: number }> };
      if (data.AD === true) {
        return {
          enabled: true,
          status: "verified",
          details: "DNSSEC cryptographic validation succeeded (Authenticated Data flag set by recursive resolver).",
        };
      }
    }

    // Check if DS (Delegation Signer) record exists
    try {
      const dsRes = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(domain)}&type=DS`, {
        headers: { Accept: "application/dns-json" },
      });
      if (dsRes.ok) {
        const dsData = (await dsRes.json()) as { Answer?: unknown[] };
        if (dsData.Answer && dsData.Answer.length > 0) {
          return {
            enabled: true,
            status: "verified",
            details: "DS (Delegation Signer) record found at parent zone.",
          };
        }
      }
    } catch {
      // Fall through
    }

    return {
      enabled: false,
      status: "not_configured",
      details: "No active DNSSEC cryptographic validation signature detected.",
    };
  } catch {
    return {
      enabled: false,
      status: "indeterminate",
      details: "DNSSEC verification could not be validated independently.",
    };
  }
}

