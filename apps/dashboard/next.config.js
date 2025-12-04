/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@openpulse/ui", "@openpulse/trpc", "@openpulse/db"],
};

module.exports = nextConfig;

