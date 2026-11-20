# Contributing to Sentinel – Cybersecurity Health Monitor

Thank you for your interest in contributing to Sentinel!

## Code of Conduct

We are committed to providing a friendly, safe, and welcoming environment for all contributors. Passive and ethical cybersecurity research principles apply to all contributions.

## Responsible Development Guidelines

1. **Non-Invasive Auditing Only**: Sentinel strictly performs passive, non-destructive health checks. We reject pull requests that introduce invasive port scanners, brute force modules, exploit payloads, or fuzzers.
2. **SSRF Guard Preservation**: Any network-fetching code must route through or respect the `validateAndResolveTarget` SSRF Guard. Never bypass RFC 1918 or cloud metadata protections.
3. **Zero Paid APIs**: Sentinel must run completely free of charge. Do not integrate external paid APIs or proprietary SDKs.
4. **Vercel Serverless Compatibility**: Do not introduce long-running background daemon processes or heavy binaries (e.g. headless Chrome) that exceed Vercel's execution and package size limits.

## Pull Request Process

1. Fork the repository and create your branch from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. Ensure all TypeScript types compile without errors:
   ```bash
   npx tsc --noEmit
   ```
3. Run and verify all automated tests:
   ```bash
   npm test
   ```
4. Open a Pull Request with a clear description of changes.

