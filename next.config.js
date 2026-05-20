const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ignore the akash-llm-gateway directory during build
  webpack: (config, { isServer }) => {
    config.watchOptions = {
      ...config.watchOptions,
      ignored: [
        ...(Array.isArray(config.watchOptions?.ignored) ? config.watchOptions.ignored : []),
        '**/akash-llm-gateway/**'
      ]
    };
    return config;
  },
  // Enable image optimization
  images: {
    domains: ['chat.akash.network'],
    formats: ['image/avif', 'image/webp'],
  },
  // Improve performance with strict mode
  reactStrictMode: true,
  // Improve SEO with trailing slashes
  trailingSlash: true,
  skipTrailingSlashRedirect: true,
  // Compress output
  compress: true,
  // Handle Auth0 compatibility with Next.js 15
  experimental: {
    dynamicIO: false,
  },
  // Add proper MIME types for improved security and performance
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          ...(process.env.NODE_ENV === 'production' ? [{
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          }] : []),
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
