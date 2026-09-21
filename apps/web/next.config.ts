import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname, "../../"),
  },
  logging: {
    incomingRequests: false,
  },
};

export default nextConfig;
