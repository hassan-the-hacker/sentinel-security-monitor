# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

The Sentinel team takes the security of this software seriously.

If you believe you have discovered a vulnerability in Sentinel (including SSRF bypasses, unintended network probing, or injection flaws):

1. **Do not** open a public issue or discuss the vulnerability in public forums.
2. Email your findings with a detailed Proof of Concept (PoC) to the repository maintainer.
3. We will acknowledge receipt of your vulnerability report within 48 hours and work with you on a responsible remediation patch before public disclosure.

## Security Controls Implemented in Sentinel

- **SSRF Hardening**: Pre-flight DNS resolution blocks all RFC 1918 private subnets, carrier-grade NAT, cloud metadata IPs (`169.254.169.254`), and loopback interfaces.
- **Redirect Validation**: Every redirect hop is independently parsed and resolved through the SSRF Guard before following.
- **Strict Input Sanitization**: Target inputs are validated against strict FQDN syntax and protocols are limited to `http` and `https`.
- **Row Level Security (RLS)**: User-specific scan records and findings are protected at the database engine level via PostgreSQL RLS policies in Supabase.

