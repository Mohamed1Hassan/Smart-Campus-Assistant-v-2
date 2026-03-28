import type { NextConfig } from "next";
import { join } from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: join(process.cwd(), ".."),
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === "production",
  },
};






export default nextConfig;
