import path from 'path';

// استخدم import.meta.url بدلاً من __dirname للحصول على المسار بشكل صحيح
const __dirname = path.dirname(new URL(import.meta.url).pathname);

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
      '@': path.resolve(__dirname),  // ربط @ مع الجذر
    };

    // تأكد من أن Webpack يتعامل مع المسارات بشكل صحيح
    return config;
  },
}

export default nextConfig;
