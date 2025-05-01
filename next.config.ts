import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
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
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  // Make environment variables available to the client-side code
  // WARNING: Do not expose sensitive keys here! TOPMEDIAI_API_KEY is used server-side.
  // GOOGLE_GENAI_API_KEY is potentially used client-side by Genkit, handle with care.
  env: {
    // Only include variables intended for client-side use if necessary.
    // TOPMEDIAI_API_KEY should remain server-side only.
    // GOOGLE_GENAI_API_KEY might be needed by Genkit depending on setup.
    // If GOOGLE_GENAI_API_KEY is only used in server actions/flows, it doesn't need to be here.
    // Example: GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
  },
  // Ensure server actions are enabled
  serverActions: true,
};

export default nextConfig;
```