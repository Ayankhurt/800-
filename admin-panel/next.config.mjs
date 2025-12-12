/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Exclude route groups and other non-route folders
  pageExtensions: ['tsx', 'ts', 'jsx', 'js'],
};

export default nextConfig;

