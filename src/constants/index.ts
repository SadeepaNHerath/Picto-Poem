/**
 * Application constants
 * Centralized location for all constants used throughout the application
 */

// API Endpoints and Configuration
export const API_ENDPOINTS = {
  POEM_GENERATION: '/api/generate-poem',
  SONG_GENERATION: '/api/generate-song',
};

// Application Settings
export const APP_SETTINGS = {
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  SUPPORTED_IMAGE_FORMATS: ['image/jpeg', 'image/png', 'image/webp'],
  DEFAULT_POEM_STYLE: 'free verse',
  DEFAULT_SONG_GENRE: 'ambient',
};

// UI Constants
export const UI_CONSTANTS = {
  MOBILE_BREAKPOINT: 768,
  MIN_POEM_LENGTH: 50,
  MAX_POEM_LENGTH: 1000,
  TOAST_DURATION: 5000,
};

// Routes
export const ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  GALLERY: '/gallery',
};

// Feature Flags
export const FEATURES = {
  ENABLE_SONG_GENERATION: true,
  ENABLE_POEM_SHARING: true,
  ENABLE_DARK_MODE: true,
};
