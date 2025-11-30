// next.config.js
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin(
  './i18n/requests.ts',
);

/** @type {import('next').NextConfig} */
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
  allowedDevOrigins: [
    'localhost:3000', // Your local dev origin
    '.*\\.ngrok-free\\.app', // Regex to allow all ngrok-free subdomains
    "https://snooty-sherwood-ophicleidean.ngrok-free.dev",
    "'https://<new>.ngrok-free.dev'",
  ],
  target: 'server',
};

export default withNextIntl(nextConfig);

