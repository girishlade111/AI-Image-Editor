/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // fabric.js v5 type declarations have known namespace resolution issues
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
