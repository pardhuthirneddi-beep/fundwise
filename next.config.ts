import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  distDir: process.env.FUNDWISE_BUILD === "1" ? ".next-build" : ".next",
  trailingSlash: false,
  images: { unoptimized: true },
  devIndicators: false,
  ...(process.env.NODE_ENV === "production" ? {} : {
    async rewrites() {
      return [{ source: "/api/:path*", destination: "http://127.0.0.1:8000/api/:path*" }];
    },
  }),
};

export default nextConfig;
