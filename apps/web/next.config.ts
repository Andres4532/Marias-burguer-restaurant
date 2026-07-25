import path from 'path';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname, '..', '..'),
  async rewrites() {
    const backend = process.env.API_BACKEND_URL?.replace(/\/$/, '');
    if (!backend) return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: `${backend}/:path*`,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'http',
        hostname: '127.0.0.1',
      },
    ],
  },
};

export default nextConfig;
