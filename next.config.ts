import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  // Recommended Strict Mode for highlighting potential problems
  reactStrictMode: true,

  // TypeScript configuration
  typescript: {
    // Set to false ONLY if you're encountering unresolvable type issues during build.
    // It's strongly recommended to resolve type errors instead.
    // ignoreBuildErrors: true,
  },

  // ESLint configuration
  eslint: {
    // Set to false ONLY if you want to skip ESLint checks during build.
    // It's strongly recommended to enforce linting rules.
    // ignoreDuringBuilds: true,
  },

  // Image optimization configuration
  images: {
    // Allow images from picsum.photos (used for sample image)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        // No port needed
        // No specific pathname needed, allow all paths under this host
      },
       // Add other domains here if needed, e.g., for user profile pictures
       // {
       //   protocol: 'https',
       //   hostname: 'example.com',
       // },
    ],
  },

  // Ensure server actions are enabled (required for Genkit flows/server functions)
  serverActions: {
    // Optional: Increase body size limit if handling large file uploads (e.g., images)
    // bodySizeLimit: '4mb', // Example: Set to 4MB
  },

  // Environment variables:
  // By default, Next.js exposes variables prefixed with NEXT_PUBLIC_ to the client.
  // Server-only variables (like API keys) should NOT be prefixed and will only be
  // available in server-side code (Server Components, API routes, Server Actions).
  // No need to explicitly list them here unless you intend to expose a server-side
  // variable to the client (which should be done with caution).
  // env: {
    // Example: Exposing a non-sensitive variable to the client
    // NEXT_PUBLIC_ANALYTICS_ID: process.env.ANALYTICS_ID,
  // },

};

export default nextConfig;
