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
  // Compress output
  compress: true,
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
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig);
