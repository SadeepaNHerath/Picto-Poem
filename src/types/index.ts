/**
 * Central export file for all type definitions
 * This file exports all types used throughout the application
 */

// Poem related types
export interface Poem {
  title: string;
  content: string;
  imagePrompt?: string;
}

// Song related types
export interface Song {
  title: string;
  audioUrl: string;
  lyrics: string;
  duration?: number;
}

// API response types
export interface GeneratePoemResponse {
  poem: Poem;
  success: boolean;
  error?: string;
}

export interface GenerateSongResponse {
  song: Song;
  success: boolean;
  error?: string;
}

// Generic API types
export interface ApiResponse<T> {
  data?: T;
  success: boolean;
  error?: string;
}

// Image processing types
export interface ImageData {
  url: string;
  alt?: string;
  dataUrl?: string;
}
