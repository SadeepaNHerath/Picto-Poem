
'use server';
/**
 * @fileOverview An AI agent that generates a song based on poem lyrics using TopMediai API.
 *
 * - generateSongFromPoem - A function that handles the song generation process.
 * - GenerateSongFromPoemInput - The input type for the generateSongFromPoem function.
 * - GenerateSongFromPoemOutput - The return type for the generateSongFromPoem function.
 */

import { z } from 'genkit';

// Input schema for generating a song from a poem
const GenerateSongFromPoemInputSchema = z.object({
  poem: z.string().min(1, 'Poem content cannot be empty.').describe('The lyrics for the song, based on the generated poem.'),
  title: z.string().optional().default('Poem Song').describe('The title of the song.'),
  prompt: z.string().optional().default('Song based on poem lyrics').describe('A prompt to guide the music style (e.g., genre, mood).'),
});
export type GenerateSongFromPoemInput = z.infer<typeof GenerateSongFromPoemInputSchema>;

// Schema to validate the structure of a successful TopMediai API response
// Note: Based on observed successful responses. May need adjustment if the API changes.
const TopMediaiSuccessResponseSchema = z.object({
    code: z.literal(200), // Expecting 200 for success
    msg: z.string(),
    task_id: z.string().optional(), // task_id seems optional in success response
    data: z.object({
        oss_url: z.string().url('Invalid song URL received from API.'), // Validate URL format
    }),
});

// Schema for error responses (assuming a common structure)
const TopMediaiErrorResponseSchema = z.object({
    code: z.number().refine(code => code !== 200, 'Error code should not be 200.'),
    msg: z.string().describe('Error message from the API.'),
    task_id: z.string().optional(),
    data: z.any().optional(), // Data might be absent or structured differently in errors
});

// Combined schema to parse either success or error
const TopMediaiApiResponseSchema = z.union([
    TopMediaiSuccessResponseSchema,
    TopMediaiErrorResponseSchema,
]);


// Output schema for the song generation function
const GenerateSongFromPoemOutputSchema = z.object({
  songUrl: z.string().url().describe('The URL of the generated song.'),
});
export type GenerateSongFromPoemOutput = z.infer<typeof GenerateSongFromPoemOutputSchema>;


/**
 * Generates a song from poem lyrics using the TopMediai API.
 * This function acts as a server action callable from the client.
 * @param input - The input containing the poem, title, and style prompt.
 * @returns A promise resolving to an object containing the song URL.
 * @throws An error if the API key is missing, the API request fails, or the response is invalid.
 */
export async function generateSongFromPoem(input: GenerateSongFromPoemInput): Promise<GenerateSongFromPoemOutput> {
  // Validate input using Zod schema
  const validationResult = GenerateSongFromPoemInputSchema.safeParse(input);
  if (!validationResult.success) {
    console.error('Invalid input for generateSongFromPoem:', validationResult.error.flatten());
    throw new Error(`Invalid input: ${validationResult.error.flatten().fieldErrors.poem?.[0] || 'Check input fields.'}`);
  }

  const validatedInput = validationResult.data;

  // Retrieve API key from environment variables
  const apiKey = process.env.TOPMEDIAI_API_KEY;
  if (!apiKey) {
    console.error('TOPMEDIAI_API_KEY environment variable is not set.');
    throw new Error('Server configuration error: Missing API key for song generation.');
  }

  const apiUrl = 'https://api.topmediai.com/v1/music';
  const options: RequestInit = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // Assuming the API key should be passed in a custom header 'x-api-key'.
        // Verify this with TopMediai documentation if issues arise.
        'x-api-key': apiKey,
     },
    body: JSON.stringify({
      is_auto: 1, // Use default of 1 as per example
      prompt: validatedInput.prompt,
      lyrics: validatedInput.poem,
      title: validatedInput.title,
      instrumental: 0, // Use default of 0 as per example
    }),
  };

  try {
    console.log(`Calling TopMediai API at ${apiUrl} with title: ${validatedInput.title}`);
    const response = await fetch(apiUrl, options);

    if (!response.ok) {
      // Attempt to read error body for more context
      let errorBody = 'Could not read error response body.';
      try {
          errorBody = await response.text();
      } catch (e) {
          console.warn('Failed to read error response body:', e);
      }
      console.error(`TopMediai API Error Response (Status ${response.status}):`, errorBody);
      throw new Error(`Music generation service failed with status ${response.status}.`);
    }

    const result = await response.json();

    // Validate the API response structure
    const parsedResult = TopMediaiApiResponseSchema.safeParse(result);

    if (!parsedResult.success) {
        console.error('Failed to parse TopMediai API response:', parsedResult.error.flatten());
        console.error('Raw API Response:', result);
        throw new Error('Received an unexpected response structure from the music generation service.');
    }

    const apiData = parsedResult.data;

    // Check if the response indicates an API-level error (non-200 code)
    if (apiData.code !== 200) {
        console.error('TopMediai API returned an error:', apiData);
        // Provide a more user-friendly error message if possible
        const errorMessage = apiData.msg || `API error code ${apiData.code}`;
        throw new Error(`Music generation failed: ${errorMessage}`);
    }

    // At this point, we expect a successful response structure
    // Type assertion is safe here due to Zod validation and code check
    const successData = apiData as z.infer<typeof TopMediaiSuccessResponseSchema>;

    // Final check for the song URL presence (should be guaranteed by schema, but good practice)
    if (!successData.data?.oss_url) {
         console.error('TopMediai API success response missing song URL:', successData);
         throw new Error('Music generation service response did not contain the expected song URL.');
    }

    console.log(`Successfully generated song URL: ${successData.data.oss_url}`);
    return { songUrl: successData.data.oss_url };

  } catch (error) {
    console.error('Error during song generation:', error);
    // Rethrow specific errors or a generic one
    if (error instanceof Error) {
        // Avoid leaking sensitive details like API key errors directly to client if possible
        if (error.message.includes('Missing API key')) {
             throw new Error('Song generation is currently unavailable due to a configuration issue.');
        }
        throw new Error(`Failed to generate song: ${error.message}`);
    } else {
        throw new Error('An unknown error occurred while generating the song.');
    }
  }
}

// Note: This file doesn't define a Genkit flow/prompt as it directly calls an external API.
// It acts as a server action callable from the client-side React component.

