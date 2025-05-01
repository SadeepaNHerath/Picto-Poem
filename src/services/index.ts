/**
 * API Services
 * Centralized location for all API calls and service functions
 */

import { API_ENDPOINTS } from '@/constants';
import type { ApiResponse, Poem, Song, ImageData, GeneratePoemResponse, GenerateSongResponse } from '@/types';

/**
 * Base API service for handling common request patterns
 */
export const apiService = {
  /**
   * Generic POST request with JSON body
   */
  async post<T, R>(endpoint: string, data: T): Promise<ApiResponse<R>> {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      const result = await response.json();
      
      return {
        data: result,
        success: response.ok,
        error: !response.ok ? 'An error occurred during the request' : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  },
};

/**
 * Poem-related API services
 */
export const poemService = {
  /**
   * Generate a poem from an image
   */
  generatePoemFromImage: async (imageData: ImageData): Promise<GeneratePoemResponse> => {
    try {
      const response = await apiService.post<{ image: ImageData }, Poem>(
        API_ENDPOINTS.POEM_GENERATION, 
        { image: imageData }
      );
      
      if (!response.success || !response.data) {
        return { 
          success: false, 
          error: response.error || 'Failed to generate poem',
          poem: { title: '', content: '' }
        };
      }
      
      return {
        success: true,
        poem: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate poem',
        poem: { title: '', content: '' }
      };
    }
  },
};

/**
 * Song-related API services
 */
export const songService = {
  /**
   * Generate a song from poem lyrics
   */
  generateSongFromPoem: async (poem: Poem): Promise<GenerateSongResponse> => {
    try {
      const response = await apiService.post<{ poem: Poem }, Song>(
        API_ENDPOINTS.SONG_GENERATION,
        { poem }
      );
      
      if (!response.success || !response.data) {
        return { 
          success: false, 
          error: response.error || 'Failed to generate song',
          song: { title: '', lyrics: '', audioUrl: '' }
        };
      }
      
      return {
        success: true,
        song: response.data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate song',
        song: { title: '', lyrics: '', audioUrl: '' }
      };
    }
  },
};
