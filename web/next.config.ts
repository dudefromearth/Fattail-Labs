import type { NextConfig } from "next";

// Browser API calls go through this same-origin proxy so the session cookie
// flows without CORS. Next's own route handlers (e.g. /api/revalidate) resolve
// first; everything else under /api/* forwards to the Labs API. Server-side
// build fetches keep using NEXT_PUBLIC_LABS_API_URL directly.
const nextConfig: NextConfig = {
  async rewrites() {
    const api = process.env.NEXT_PUBLIC_LABS_API_URL;
    if (!api) throw new Error("NEXT_PUBLIC_LABS_API_URL is not set");
    return [{ source: "/api/:path*", destination: `${api}/api/:path*` }];
  },
};

export default nextConfig;
