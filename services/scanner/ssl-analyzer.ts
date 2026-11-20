import tls from "tls";
import { SSLCertificateInfo, Finding } from "@/types/scanner";

export async function analyzeSSLCertificate(domain: string, timeoutMs = 7000): Promise<{
  sslDetails: SSLCertificateInfo;
  findings: Finding[];
}> {
  const findings: Finding[] = [];

  return new Promise((resolve) => {
    let resolved = false;

    const finalize = (details: SSLCertificateInfo, customFindings: Finding[]) => {
      if (!resolved) {
        resolved = true;
        resolve({ sslDetails: details, findings: customFindings });
      }
    };

    const timer = setTimeout(() => {
      finalize(
        {
          valid: false,
          issuer: {},
          subject: {},
          validFrom: "",
          validTo: "",
          daysRemaining: 0,
          isExpired: true,
          expiresSoon: false,
          protocol: "Unknown",
          authorized: false,
          authorizationError: "Connection timed out during TLS handshake",
        },
        [
          {
            id: "ssl-timeout",
            category: "ssl",
            checkName: "TLS Handshake",
            title: "TLS Connection Timed Out",
            status: "fail",
            severity: "critical",
            scoreImpact: -25,
            description: "The target host did not respond to TLS handshake within the configured timeout.",
            recommendation: "Ensure port 443 is open and configured with a responsive TLS listener.",
          },
        ]
      );
    }, timeoutMs);

    try {
      const socket = tls.connect(
        {
          host: domain,
          port: 443,
          servername: domain, // SNI is crucial for modern multi-tenant HTTPS
          rejectUnauthorized: false, // We inspect cert ourselves to report detailed authorization errors
        },
        () => {
          clearTimeout(timer);

          const cert = socket.getPeerCertificate(true);
          const authorized = socket.authorized;
          const authError = socket.authorizationError ? String(socket.authorizationError) : null;
          const protocol = socket.getProtocol() || "Unknown";
          const cipher = socket.getCipher();

          socket.end();

          if (!cert || Object.keys(cert).length === 0) {
            finalize(
              {
                valid: false,
                issuer: {},
                subject: {},
                validFrom: "",
                validTo: "",
                daysRemaining: 0,
                isExpired: true,
                expiresSoon: false,
                protocol,
                authorized: false,
                authorizationError: "No peer certificate returned",
              },
              [
                {
                  id: "ssl-nocert",
                  category: "ssl",
                  checkName: "Peer Certificate",
                  title: "No SSL Certificate Found",
                  status: "fail",
                  severity: "critical",
                  scoreImpact: -25,
                  description: "The remote server did not present a peer TLS certificate.",
                  recommendation: "Deploy a trusted TLS certificate via Let's Encrypt or your certificate authority.",
                },
              ]
            );
            return;
          }

          // Parse certificate details
          const validToDate = new Date(cert.valid_to);
          const validFromDate = new Date(cert.valid_from);
          const now = new Date();
          const msRemaining = validToDate.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.floor(msRemaining / (1000 * 60 * 60 * 24)));
          const isExpired = msRemaining <= 0;
          const expiresSoon = !isExpired && daysRemaining < 30;

          // Parse SAN
          let altNames: string[] = [];
          if (cert.subjectaltname) {
            altNames = cert.subjectaltname
              .split(",")
              .map((s) => s.trim().replace(/^DNS:/, ""));
          }

          // Helper to extract string from string | string[] | undefined
          const formatCertField = (field: string | string[] | undefined): string | undefined => {
            if (!field) return undefined;
            return Array.isArray(field) ? field[0] : field;
          };

          const details: SSLCertificateInfo = {
            valid: authorized && !isExpired,
            issuer: {
              commonName: formatCertField(cert.issuer?.CN),
              organization: formatCertField(cert.issuer?.O),
              country: formatCertField(cert.issuer?.C),
            },
            subject: {
              commonName: formatCertField(cert.subject?.CN),
              altNames,
            },
            validFrom: validFromDate.toISOString(),
            validTo: validToDate.toISOString(),
            daysRemaining,
            isExpired,
            expiresSoon,
            protocol,
            cipherSuite: cipher ? `${cipher.name} (${cipher.version})` : undefined,
            authorized,
            authorizationError: authError,
          };

          // Generate findings & score impacts
          if (!authorized) {
            findings.push({
              id: "ssl-untrusted",
              category: "ssl",
              checkName: "Trust Chain",
              title: "Untrusted or Self-Signed TLS Certificate",
              status: "fail",
              severity: "critical",
              scoreImpact: -20,
              description: `Certificate validation failed: ${authError || "Untrusted certificate authority"}`,
              recommendation: "Replace self-signed or broken certificates with an authenticated CA-signed certificate.",
              rawDetails: { authError },
            });
          } else {
            findings.push({
              id: "ssl-trust-ok",
              category: "ssl",
              checkName: "Trust Chain",
              title: "Trusted Certificate Authority Chain",
              status: "pass",
              severity: "safe",
              scoreImpact: 0,
              description: `Certificate signed by a recognized CA: ${cert.issuer?.O || cert.issuer?.CN || "Valid Authority"}.`,
              recommendation: "Maintain automatic renewal hooks to avoid certificate lapse.",
            });
          }

          if (isExpired) {
            findings.push({
              id: "ssl-expired",
              category: "ssl",
              checkName: "Expiration",
              title: "TLS Certificate Has Expired",
              status: "fail",
              severity: "critical",
              scoreImpact: -25,
              description: `Certificate expired on ${validToDate.toLocaleDateString()}. Browsers will block access with security warnings.`,
              recommendation: "Immediately renew the certificate through Certbot, Cloudflare, or your CA.",
            });
          } else if (expiresSoon) {
            findings.push({
              id: "ssl-expires-soon",
              category: "ssl",
              checkName: "Expiration Warning",
              title: `TLS Certificate Expires in ${daysRemaining} Days`,
              status: "warning",
              severity: "medium",
              scoreImpact: -5,
              description: `Certificate expires on ${validToDate.toLocaleDateString()}. Action required within 30 days.`,
              recommendation: "Trigger certificate renewal process to prevent unexpected outage.",
            });
          } else {
            findings.push({
              id: "ssl-validity-ok",
              category: "ssl",
              checkName: "Expiration",
              title: `TLS Certificate Valid (${daysRemaining} Days Remaining)`,
              status: "pass",
              severity: "safe",
              scoreImpact: 0,
              description: `Certificate is valid until ${validToDate.toLocaleDateString()}.`,
              recommendation: "Keep monitoring expiration alerts.",
            });
          }

          // Modern Protocol check
          if (protocol === "TLSv1.3") {
            findings.push({
              id: "ssl-proto-13",
              category: "ssl",
              checkName: "TLS Protocol",
              title: "Modern TLS 1.3 Negotiated",
              status: "pass",
              severity: "safe",
              scoreImpact: 0,
              description: "Server negotiated TLSv1.3, providing optimal cryptographic safety and low latency handshake.",
              recommendation: "Continue enforcing TLS 1.3 as primary cipher negotiation.",
            });
          } else if (protocol === "TLSv1.2") {
            findings.push({
              id: "ssl-proto-12",
              category: "ssl",
              checkName: "TLS Protocol",
              title: "TLS 1.2 Negotiated",
              status: "pass",
              severity: "info",
              scoreImpact: 0,
              description: "Server supports TLSv1.2. Consider enabling TLS 1.3 for enhanced security and 0-RTT speed.",
              recommendation: "Enable TLS 1.3 on your web server or reverse proxy.",
            });
          } else if (protocol.includes("1.0") || protocol.includes("1.1") || protocol.includes("SSL")) {
            findings.push({
              id: "ssl-proto-legacy",
              category: "ssl",
              checkName: "Deprecated Protocol",
              title: `Legacy Insecure Protocol (${protocol})`,
              status: "fail",
              severity: "critical",
              scoreImpact: -15,
              description: "Deprecated cryptographic protocol detected. Vulnerable to POODLE, BEAST, and downgrades.",
              recommendation: "Disable TLS 1.0 and TLS 1.1 immediately across web servers.",
            });
          }

          finalize(details, findings);
        }
      );

      socket.on("error", (err) => {
        clearTimeout(timer);
        finalize(
          {
            valid: false,
            issuer: {},
            subject: {},
            validFrom: "",
            validTo: "",
            daysRemaining: 0,
            isExpired: false,
            expiresSoon: false,
            protocol: "Failed",
            authorized: false,
            authorizationError: err.message,
          },
          [
            {
              id: "ssl-error",
              category: "ssl",
              checkName: "TLS Connection",
              title: "Failed to Establish TLS Connection",
              status: "fail",
              severity: "high",
              scoreImpact: -20,
              description: `TLS handshake error: ${err.message}`,
              recommendation: "Verify web server TLS configuration and firewall port 443 rules.",
            },
          ]
        );
      });
    } catch (err: unknown) {
      clearTimeout(timer);
      const msg = err instanceof Error ? err.message : "Handshake exception";
      finalize(
        {
          valid: false,
          issuer: {},
          subject: {},
          validFrom: "",
          validTo: "",
          daysRemaining: 0,
          isExpired: false,
          expiresSoon: false,
          protocol: "Error",
          authorized: false,
          authorizationError: msg,
        },
        [
          {
            id: "ssl-exception",
            category: "ssl",
            checkName: "TLS Exception",
            title: "TLS Socket Error",
            status: "fail",
            severity: "high",
            scoreImpact: -20,
            description: msg,
            recommendation: "Check domain certificate installation.",
          },
        ]
      );
    }
  });
}
