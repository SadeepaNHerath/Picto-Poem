/**
 * AI Utilities
 * Helper functions for AI-related operations
 */

import type { Poem, ImageData } from '@/types';

/**
 * Formats an image for AI processing
 * Converts image data to the format required by the AI services
 */
export function formatImageForAI(imageData: ImageData): { mimeType: string; data: string } {
  // Extract base64 data from dataUrl
  const dataUrl = imageData.dataUrl || '';
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  
  if (!matches || matches.length !== 3) {
    throw new Error('Invalid image data URL');
  }
  
  return {
    mimeType: matches[1],
    data: matches[2]
  };
}

/**
 * Formats a poem for lyrics generation
 * Prepares the poem text for use in song generation prompts
 */
export function formatPoemForLyrics(poem: Poem): string {
  // Remove line breaks and replace with placeholders
  const processedContent = poem.content
    .replace(/\n\n/g, '[VERSE_BREAK]') // Mark paragraph breaks
    .replace(/\n/g, '[LINE_BREAK]');   // Mark line breaks
  
  return processedContent;
}

/**
 * Extracts JSON from AI response
 * Safely parses JSON from potentially unstructured AI text output
 */
export function extractJsonFromResponse(response: string): any {
  try {
    // Find JSON-like structure in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const jsonString = jsonMatch[0];
      return JSON.parse(jsonString);
    }
    
    // If no JSON object is found, try to create a structured response from the text
    return {
      content: response.trim()
    };
  } catch (error) {
    console.error('Failed to extract JSON from response:', error);
    return null;
  }
}