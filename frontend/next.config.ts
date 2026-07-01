import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['aicop-uat.floweradvisor.co.id', 'localhost:9443', 'aicop-uat.floweradvisor.co.id:9443'],
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination: `${process.env.INTERNAL_API_URL || 'http://api-service:8000'}/api/:path*`,
            },
            {
                source: '/storage/:path*',
                destination: `${process.env.INTERNAL_API_URL || 'http://api-service:8000'}/storage/:path*`,
            },
        ];
    },
};

export default nextConfig;
