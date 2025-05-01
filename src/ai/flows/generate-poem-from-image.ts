'use server';
/**
 * @fileOverview An AI agent that generates a poem based on an image.
 *
 * - generatePoemFromImage - A function that handles the poem generation process.
 * - GeneratePoemFromImageInput - The input type for the generatePoemFromImage function.
 * - GeneratePoemFromImageOutput - The return type for the generatePoemFromImage function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';
import { extractJsonFromResponse } from '../utils/ai-utils';

// Constants for retry mechanism
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const GeneratePoemFromImageInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  styleDescription: z.string().optional().describe('Optional description of the desired poem style.'),
});
export type GeneratePoemFromImageInput = z.infer<typeof GeneratePoemFromImageInputSchema>;

const GeneratePoemFromImageOutputSchema = z.object({
  poem: z.string().describe('The generated poem.'),
});
export type GeneratePoemFromImageOutput = z.infer<typeof GeneratePoemFromImageOutputSchema>;

// Fallback poem templates based on common image categories
const fallbackPoemTemplates = [
  {
    title: "Unseen Beauty",
    content: "In pixels and light,\nA story unfolds gently,\nBeauty discovered.\n\nWhat the eyes perceive,\nThe heart interprets deeply,\nMoments captured still."
  },
  {
    title: "Digital Whispers",
    content: "Frozen in this frame\nColors speak what words cannot\nSilent eloquence.\n\nTime stands still for us\nIn this captured memory\nForever present."
  },
  {
    title: "Beyond the Frame",
    content: "What lies within view\nIs merely a fragment of\nUnfolding stories.\n\nThe image speaks soft\nOf moments that came before\nAnd those yet to come."
  }
];

/**
 * Utility function to wait for a specified delay
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Attempts to generate a poem with exponential backoff retry logic
 */
async function attemptWithRetry<T>(fn: () => Promise<T>, retries = MAX_RETRIES, backoffDelay = INITIAL_RETRY_DELAY): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    if (error.message?.includes('503 Service Unavailable') && retries > 0) {
      console.log(`AI service overloaded. Retrying in ${backoffDelay}ms... (${retries} retries left)`);
      await delay(backoffDelay);
      return attemptWithRetry(fn, retries - 1, backoffDelay * 2);
    }
    throw error;
  }
}

/**
 * Selects a fallback poem based on optional style description
 */
function getFallbackPoem(styleDescription?: string): string {
  // Simple selection logic - can be enhanced to match style description better
  const index = styleDescription ? 
    Math.abs(styleDescription.length % fallbackPoemTemplates.length) :
    Math.floor(Math.random() * fallbackPoemTemplates.length);
  
  const template = fallbackPoemTemplates[index];
  return `${template.title}\n\n${template.content}\n\n(Note: This is a fallback poem due to AI service unavailability)`;
}

export async function generatePoemFromImage(input: GeneratePoemFromImageInput): Promise<GeneratePoemFromImageOutput> {
  try {
    return await attemptWithRetry(() => generatePoemFromImageFlow(input));
  } catch (error) {
    console.error('Failed to generate poem after retries:', error);
    
    // Provide a fallback poem when the AI service is unavailable
    return {
      poem: getFallbackPoem(input.styleDescription)
    };
  }
}

const generatePoemPrompt = ai.definePrompt({
  name: 'generatePoemPrompt',
  input: {
    schema: z.object({
      photoDataUri: z
        .string()
        .describe(
          "A photo, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
        ),
      styleDescription: z.string().optional().describe('Optional description of the desired poem style.'),
    }),
  },
  output: {
    schema: z.object({
      poem: z.string().describe('The generated poem.'),
    }),
  },
  prompt: `You are a poet skilled at creating poems inspired by images.  Analyze the visual elements, mood, and overall aesthetic of the image provided. Create a poem that reflects these aspects. The poem should evoke the same feelings as the image.

{{#if styleDescription}}
Consider the following style description: {{{styleDescription}}}
{{/if}}

Image: {{media url=photoDataUri}}

Poem:`, // The media helper here ensures the image data is passed correctly
});

const generatePoemFromImageFlow = ai.defineFlow<
  typeof GeneratePoemFromImageInputSchema,
  typeof GeneratePoemFromImageOutputSchema
>({
  name: 'generatePoemFromImageFlow',
  inputSchema: GeneratePoemFromImageInputSchema,
  outputSchema: GeneratePoemFromImageOutputSchema,
},
async input => {
  try {
    const {output} = await generatePoemPrompt(input);
    return output!;
  } catch (error: any) {
    // Enhanced error logging for debugging
    console.error(`AI model error: ${error.message || 'Unknown error'}`);
    
    // Re-throw the error to be handled by the retry mechanism
    throw error;
  }
});
