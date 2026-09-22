/** @type {import('next').NextConfig} */
const API_URL = process.env.API_URL ?? 'http://localhost:3001';

const nextConfig = {
  reactStrictMode: true,
  env: {
    API_URL,
    NEXT_PUBLIC_API_URL: API_URL,
  },
  // Proxy panggilan /api/* (mis. tautan unduhan CSV) ke server NestJS.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/api/:path*` }];
  },
};

export default nextConfig;
