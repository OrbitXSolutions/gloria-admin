import type { NextConfig } from "next";
import { SupabasePaths } from "./lib/constants/supabase-storage";

const nextConfig: NextConfig = {
  /* config options here */
  allowedDevOrigins: ["127.0.0.1", "*"],

  images: {
    remotePatterns: [
      new URL(`${SupabasePaths.IMAGES}/**`),
      new URL(`https://lh3.googleusercontent.com/**`),
      new URL(`https://avatars.githubusercontent.com/**`),
    ],
  },
};


export default nextConfig;
