import type { NextConfig } from "next";

const isExport = process.env.NEXT_BUILD_MODE === "export";

const nextConfig: NextConfig = {
  ...(isExport ? { output: "export", trailingSlash: true } : {}),
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["playwright-core"],
};

export default nextConfig;
