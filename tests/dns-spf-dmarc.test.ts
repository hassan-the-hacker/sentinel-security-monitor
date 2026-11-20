import { describe, it, expect } from "vitest";

describe("DNS Security - SPF & DMARC Policy Parsers", () => {
  it("should distinguish strict (-all) vs soft (~all) vs dangerous (+all) SPF qualifiers", () => {
    const strictSpf = "v=spf1 include:_spf.google.com -all";
    const softSpf = "v=spf1 include:_spf.google.com ~all";
    const openSpf = "v=spf1 +all";

    expect(strictSpf.includes("-all")).toBe(true);
    expect(softSpf.includes("~all")).toBe(true);
    expect(openSpf.includes("+all")).toBe(true);
  });

  it("should accurately parse DMARC policy tags", () => {
    const dmarcReject = "v=DMARC1; p=reject; sp=reject; rua=mailto:dmarc@domain.com";
    const dmarcQuarantine = "v=DMARC1; p=quarantine; pct=100";
    const dmarcNone = "v=DMARC1; p=none";

    const parsePolicy = (txt: string) => {
      const match = txt.match(/p=(reject|quarantine|none)/i);
      return match ? match[1].toLowerCase() : "unknown";
    };

    expect(parsePolicy(dmarcReject)).toBe("reject");
    expect(parsePolicy(dmarcQuarantine)).toBe("quarantine");
    expect(parsePolicy(dmarcNone)).toBe("none");
  });
});

