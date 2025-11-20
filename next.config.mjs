/** @type {import('next').NextConfig} */
import path from 'path';

const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    swcPlugins: [],
  },
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),  // إضافة هذا السطر لربط @ مع الجذر
    };
    return config;
  },
}

export default nextConfig;
