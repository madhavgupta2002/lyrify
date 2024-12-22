import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    },
    responseLimit: false
  }
};

export default nextConfig;
