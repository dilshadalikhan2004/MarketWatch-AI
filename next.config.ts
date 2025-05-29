
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/dashboard',
        permanent: true, // Use true for permanent redirect, false for temporary
      },
    ];
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i2.ytimg.com', // Added for YouTube thumbnails
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'newsapi.org', // Added for potential news images directly from NewsAPI.org
        port: '',
        pathname: '/**',
      },
      { // More generic pattern for common image CDNs, adjust as needed
        protocol: 'https',
        hostname: '**', // This is very permissive. Consider more specific hostnames.
      },
    ],
  },
};

export default nextConfig;
