import {genkit, type GenkitOptions} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Model configuration with fallbacks
const PRIMARY_MODEL = 'googleai/gemini-2.0-flash';
const FALLBACK_MODELS = [
  'googleai/gemini-1.5-flash',
  'googleai/gemini-1.5-pro',
];

// Timeout and retry configuration
const API_TIMEOUT = 30000; // 30 seconds

// Error interface for proper typing
interface AIError extends Error {
  message: string;
  name: string;
  stack?: string;
}

/**
 * Configure the Genkit instance with improved error handling
 */
export const ai = genkit({
  promptDir: './prompts',
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      // Remove the options object since it's not supported in the type definition
    }),
  ],
  model: PRIMARY_MODEL,
  // Remove onError since it's not supported in the GenkitOptions type
});

/**
 * Custom error handling function for Genkit errors
 */
export function handleGenkitError(error: AIError): void {
  console.error('Genkit error:', error.message);
  
  // Log more detailed diagnostics for service errors
  if (error.message?.includes('Service Unavailable')) {
    console.error('Google AI service is currently unavailable or overloaded');
  } else if (error.message?.includes('timeout')) {
    console.error('Request to Google AI service timed out');
  }
}

/**
 * Try alternative models when primary model fails
 * Note: Implementation will depend on the actual SDK's capabilities
 */
export async function tryWithFallbackModels<T>(operation: (model: string) => Promise<T>): Promise<T> {
  try {
    return await operation(PRIMARY_MODEL);
  } catch (error) {
    // Type guard to ensure error is properly typed
    const aiError = error as AIError;
    
    if (aiError.message?.includes('Service Unavailable') || 
        aiError.message?.includes('overloaded') || 
        aiError.message?.includes('timeout')) {
      
      // Try fallback models in sequence
      for (const fallbackModel of FALLBACK_MODELS) {
        try {
          console.log(`Attempting with fallback model: ${fallbackModel}`);
          return await operation(fallbackModel);
        } catch (error) {
          // Properly type the fallback error
          const fallbackErr = error as AIError;
          console.error(`Fallback model ${fallbackModel} also failed:`, fallbackErr.message);
        }
      }
    }
    
    // Re-throw the original error if all fallbacks fail
    throw error;
  }
}
