import { describe, expect, it } from "vitest";
import nextConfig from "../../next.config";

describe("security headers in next.config", () => {
  it("sends nosniff, a referrer policy and a CSP that forbids framing on every path", async () => {
    expect(nextConfig.headers).toBeTypeOf("function");
    const rules = await nextConfig.headers!();
    const rule = rules.find((r) => r.source === "/:path*");
    expect(rule).toBeDefined();

    const headers = Object.fromEntries(rule!.headers.map((h) => [h.key.toLowerCase(), h.value]));
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");

    const csp = headers["content-security-policy"];
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("base-uri 'self'");
  });
});
