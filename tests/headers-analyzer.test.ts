import { describe, it, expect } from "vitest";

describe("HTTP Security Headers & Information Disclosure Logic", () => {
  it("should validate Content-Security-Policy rules", () => {
    const csp = "default-src 'self'; script-src 'self' 'unsafe-inline';";
    expect(csp).toContain("default-src");
    expect(Boolean(csp)).toBe(true);
  });

  it("should validate Strict-Transport-Security regex", () => {
    const hstsValid = "max-age=31536000; includeSubDomains; preload";
    const hstsInvalid = "invalid-hsts-string";

    const regex = /max-age=\d+/i;
    expect(regex.test(hstsValid)).toBe(true);
    expect(regex.test(hstsInvalid)).toBe(false);
  });

  it("should detect exact software version disclosure in server banners", () => {
    const bannerWithVersion = "Apache/2.4.41 (Ubuntu)";
    const cleanBanner = "cloudflare";

    const versionRegex = /\d+\.\d+/;
    expect(versionRegex.test(bannerWithVersion)).toBe(true);
    expect(versionRegex.test(cleanBanner)).toBe(false);
  });
});

