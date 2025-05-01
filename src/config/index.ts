/**
 * Application Configuration
 * Centralized location for application configuration settings
 */

// Environment configuration
export const env = {
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
};

// API configuration
export const apiConfig = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  googleApiKey: process.env.GOOGLE_GENAI_API_KEY,
  topMediaiApiKey: process.env.TOPMEDIAI_API_KEY,
  timeout: 60000, // 60 seconds
};

// Theme configuration
export const themeConfig = {
  defaultTheme: 'light' as const,
  storageKey: 'picto-poem-theme',
};

// Image processing configuration
export const imageConfig = {
  maxSize: 5 * 1024 * 1024, // 5MB
  acceptedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  defaultWidth: 800,
  defaultHeight: 600,
  quality: 0.8,
};

// AI model configuration
export const aiConfig = {
  poemModel: {
    name: 'gemini-1.5-pro',
    temperature: 0.7,
    maxOutputTokens: 1024,
  },
  songModel: {
    provider: 'topmediai',
    genre: 'ambient',
    duration: 30, // seconds
  },
};
