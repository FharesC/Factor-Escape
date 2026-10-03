/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['ioredis', 'ws'],
  images: {
    unoptimized: true,
  },
}

export default nextConfig
