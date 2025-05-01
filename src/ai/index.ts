/**
 * AI Module
 * Centralized exports for all AI-related functionality
 */

// Export services
export { generatePoemFromImage } from './services/poem-service';
export { generateSongFromPoem } from './services/song-service';

// Export configuration
export { geminiConfig, topMediaiConfig, promptTemplates } from './config/ai-config';

// Re-export Genkit instance
export { ai as genkit } from './ai-instance';