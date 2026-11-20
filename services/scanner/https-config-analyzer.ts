import http from "http";
import { URL } from "url";
import { HTTPSConfigurationInfo, Finding } from "@/types/scanner";
import { validateAndResolveTarget } from "./ssrf-guard";

export async function analyzeHTTPSConfiguration(
  domain: string,
  timeoutMs = 6000
): Promise<{
  httpsConfigDetails: HTTPSConfigurationInfo;
  findings: Finding[];
}> {
  const findings: Finding[] = [];
  const httpUrl = `http://${domain}/`;

  // Pre-validate domain against SSRF
  try {
    await validateAndResolveTarget(domain);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "SSRF validation failed";
    return {
      httpsConfigDetails: {
        supportsHttps: false,
        httpPortOpen: false,
        httpRedirectsToHttps: false,
        finalDestinationUrl: httpUrl,
        isInsecureDestination: true,
        hstsEnforced: false,
        hstsPreloadEligible: false,
      },
      findings: [
        {
          id: "https-ssrf-block",
          category: "https",
          checkName: "SSRF Check",
          title: "Target Blocked by SSRF Guard",
          status: "fail",
          severity: "critical",
          scoreImpact: -20,
          description: msg,
          recommendation: "Ensure domain is public and reachable.",
        },
      ],
    };
  }

  return new Promise((resolve) => {
    let resolved = false;

    const finalize = (details: HTTPSConfigurationInfo, customFindings: Finding[]) => {
      if (!resolved) {
        resolved = true;
        resolve({ httpsConfigDetails: details, findings: customFindings });
      }
    };

    const timer = setTimeout(() => {
      finalize(
        {
          supportsHttps: true, // Default to true if port 80 is closed (many modern hosts close port 80 entirely)
          httpPortOpen: false,
          httpRedirectsToHttps: false,
          finalDestinationUrl: `https://${domain}`,
          isInsecureDestination: false,
          hstsEnforced: false,
          hstsPreloadEligible: false,
        },
        [
          {
            id: "https-port80-timeout",
            category: "https",
            checkName: "HTTP Port 80 Listener",
            title: "Port 80 (HTTP) Unreachable or Filtered",
            status: "info",
            severity: "info",
            scoreImpact: 0,
            description: "Target host dropped or closed plaintext HTTP port 80 connections.",
            recommendation: "If intentionally HTTPS-only, ensure all users are forced to HTTPS via DNS HSTS preload.",
          },
        ]
      );
    }, timeoutMs);

    const req = http.request(
      httpUrl,
      {
        method: "HEAD",
        timeout: timeoutMs,
        headers: {
          "User-Agent": "Sentinel-Security-Auditor/1.0 (+https://sentinel.sec/bot)",
        },
      },
      (res) => {
        clearTimeout(timer);
        const statusCode = res.statusCode || 200;
        const location = res.headers.location;

        req.destroy();

        const isRedirect = [301, 302, 307, 308].includes(statusCode);
        let redirectsToHttps = false;
        let finalUrl = httpUrl;
        let isInsecure = true;

        if (isRedirect && location) {
          try {
            const parsedLocation = new URL(location, httpUrl);
            finalUrl = parsedLocation.toString();
            redirectsToHttps = parsedLocation.protocol === "https:";
            isInsecure = parsedLocation.protocol !== "https:";
          } catch {
            // invalid URL
          }
        }

        if (redirectsToHttps) {
          if (statusCode === 301 || statusCode === 308) {
            findings.push({
              id: "https-redir-301",
              category: "https",
              checkName: "HTTP to HTTPS Redirection",
              title: `Automatic HTTPS Redirect (${statusCode} Permanent)`,
              status: "pass",
              severity: "safe",
              scoreImpact: 0,
              description: `Plaintext HTTP requests are permanently redirected to encrypted HTTPS (${finalUrl}).`,
              recommendation: "Maintain 301/308 permanent redirect configuration.",
              rawDetails: { statusCode, location: finalUrl },
            });
          } else {
            findings.push({
              id: "https-redir-temp",
              category: "https",
              checkName: "HTTP to HTTPS Redirection",
              title: `Temporary HTTPS Redirect (${statusCode} Found)`,
              status: "warning",
              severity: "low",
              scoreImpact: -2,
              description: `HTTP redirects to HTTPS via temporary status ${statusCode}. Search engines and clients will re-request HTTP.`,
              recommendation: "Change temporary 302 redirect to permanent 301 or 308 redirect.",
              rawDetails: { statusCode, location: finalUrl },
            });
          }
        } else if (isRedirect) {
          findings.push({
            id: "https-redir-insecure",
            category: "https",
            checkName: "HTTP Redirection",
            title: "HTTP Redirects to Insecure Destination",
            status: "fail",
            severity: "critical",
            scoreImpact: -15,
            description: `HTTP redirects to another unencrypted endpoint: ${finalUrl}`,
            recommendation: "Ensure all HTTP traffic redirects directly to https:// scheme.",
            rawDetails: { statusCode, location: finalUrl },
          });
        } else {
          // Plain HTTP serves 200 OK without redirect!
          findings.push({
            id: "https-no-redir",
            category: "https",
            checkName: "Plaintext HTTP Exposure",
            title: "Website Serves Unencrypted HTTP Traffic (No Redirect)",
            status: "fail",
            severity: "critical",
            scoreImpact: -20,
            description: "Target web server responds with 200 OK on plaintext port 80. Attackers on open Wi-Fi can snoop and inject cookies/traffic.",
            recommendation: "Enforce strict redirect: return 301 https://$host$request_uri in web server configuration.",
            rawDetails: { statusCode },
          });
        }

        finalize(
          {
            supportsHttps: true,
            httpPortOpen: true,
            httpRedirectsToHttps: redirectsToHttps,
            redirectStatusCode: statusCode,
            finalDestinationUrl: finalUrl,
            isInsecureDestination: isInsecure,
            hstsEnforced: false,
            hstsPreloadEligible: false,
          },
          findings
        );
      }
    );

    req.on("timeout", () => {
      req.destroy();
      clearTimeout(timer);
      finalize(
        {
          supportsHttps: true,
          httpPortOpen: false,
          httpRedirectsToHttps: false,
          finalDestinationUrl: `https://${domain}`,
          isInsecureDestination: false,
          hstsEnforced: false,
          hstsPreloadEligible: false,
        },
        [
          {
            id: "https-timeout",
            category: "https",
            checkName: "HTTP Port 80",
            title: "HTTP Port 80 Closed or Filtered",
            status: "info",
            severity: "safe",
            scoreImpact: 0,
            description: "No plaintext HTTP listener detected on port 80 (HTTPS-only configuration).",
            recommendation: "No action required if all clients access HTTPS directly.",
          },
        ]
      );
    });

    req.on("error", () => {
      clearTimeout(timer);
      finalize(
        {
          supportsHttps: true,
          httpPortOpen: false,
          httpRedirectsToHttps: false,
          finalDestinationUrl: `https://${domain}`,
          isInsecureDestination: false,
          hstsEnforced: false,
          hstsPreloadEligible: false,
        },
        [
          {
            id: "https-port80-conn-refused",
            category: "https",
            checkName: "Port 80 Connectivity",
            title: "Port 80 Connection Closed",
            status: "info",
            severity: "safe",
            scoreImpact: 0,
            description: "Port 80 refused plaintext connections (direct HTTPS enforced).",
            recommendation: "Verify all modern browsers resolve to HTTPS correctly.",
          },
        ]
      );
    });

    req.end();
  });
}

