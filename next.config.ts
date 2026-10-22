import type { NextConfig } from "next";

// vinext reads this file. Keep it free of images.remotePatterns.
// The CSP only forbids framing, plugins and <base> rewrites: script-src and img-src stay unset
// because vinext hydrates with inline scripts and designs show https: and data: images.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'none'; object-src 'none'; base-uri 'self'" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
