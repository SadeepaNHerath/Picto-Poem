
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
// Made fields optional to be more robust against API changes.
const TopMediaiSuccessResponseSchema = z.object({
    code: z.literal(200).describe('Success status code from the API.'),
    msg: z.string().optional().nullable().describe('Optional success message from the API.'), // Allow null
    task_id: z.string().optional().nullable().describe('Optional task identifier from the API.'), // Allow null
    // Make data optional and its content optional/nullable
    data: z.object({
        oss_url: z.string().url('Invalid song URL received from API.').optional().nullable().describe('The URL pointing to the generated song.'), // Allow null/optional URL
        // Allow any other unexpected fields within data
    }).passthrough().optional().nullable().describe('Object containing the result data, potentially including the song URL.'),
    // Allow any other unexpected top-level fields
}).passthrough().describe('Schema for a successful API response.');


// Schema for error responses (allowing for more flexibility)
const TopMediaiErrorResponseSchema = z.object({
    code: z.number().refine(code => code !== 200, 'Error code should not be 200.').describe('Error status code from the API (non-200).'),
    msg: z.string().optional().nullable().describe('Optional error message from the API.'), // Allow null
    task_id: z.string().optional().nullable().describe('Optional task identifier from the API.'), // Allow null
    data: z.any().optional().nullable().describe('Optional data field, which might contain error details or be null/absent.'),
    // Allow any other unexpected top-level fields
}).passthrough().describe('Schema for an error API response.');


// Combined schema to parse either success or error
// Removed the z.record(z.any()).transform fallback which caused the specific error message.
// Now, if neither schema matches, Zod's default parsing errors will be reported.
const TopMediaiApiResponseSchema = z.union([
    TopMediaiSuccessResponseSchema,
    TopMediaiErrorResponseSchema
]).describe('Union schema representing either a successful or error response from the TopMediai API.');


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
 * @throws An error string if the API key is missing, the API request fails, or the response is invalid/doesn't contain a song URL.
 */
export async function generateSongFromPoem(input: GenerateSongFromPoemInput): Promise<GenerateSongFromPoemOutput> {
  // Validate input using Zod schema
  const validationResult = GenerateSongFromPoemInputSchema.safeParse(input);
  if (!validationResult.success) {
    const firstError = validationResult.error.flatten().fieldErrors.poem?.[0] || 'Check input fields.';
    console.error('Invalid input for generateSongFromPoem:', validationResult.error.flatten());
    throw new Error(`Invalid input: ${firstError}`);
  }

  const validatedInput = validationResult.data;

  // Retrieve API key from environment variables
  const apiKey = process.env.TOPMEDIAI_API_KEY;
  if (!apiKey) {
    console.error('TOPMEDIAI_API_KEY environment variable is not set.');
    // Throw a user-friendly error, avoid exposing specifics about missing keys
    throw new Error('Song generation service is currently unavailable due to a configuration issue.');
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

  let response;
  try {
    console.log(`Calling TopMediai API at ${apiUrl} with title: ${validatedInput.title}`);
    response = await fetch(apiUrl, options);

    // Check for network errors (status codes >= 400)
    if (!response.ok) {
      let errorBody = 'Could not read error response body.';
      try {
          // Try to parse as JSON first, fallback to text
          const errorJson = await response.json();
          errorBody = JSON.stringify(errorJson);
      } catch (e) {
          try {
            errorBody = await response.text();
          } catch (e2) {
            console.warn('Failed to read error response body as text:', e2);
          }
      }
      console.error(`TopMediai API Error Response (Status ${response.status}):`, errorBody);
      // Provide a generic error to the client
      throw new Error(`Music generation service failed (Status: ${response.status}). Please try again later.`);
    }

    // Check Content-Type before attempting to parse JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
        let responseBody = await response.text(); // Get text for logging
        console.error(`TopMediai API returned non-JSON response (Content-Type: ${contentType}). Body:`, responseBody);
        throw new Error('Received an unexpected response format from the music generation service.');
    }


    // Attempt to parse the successful response body
    const result = await response.json();
    console.log('Raw TopMediai API Response:', result); // Log the raw response

    // Validate the API response structure using Zod
    const parsedResult = TopMediaiApiResponseSchema.safeParse(result);

    if (!parsedResult.success) {
        // Log the raw response data and Zod errors when parsing fails for easier debugging
        console.error('Failed to parse TopMediai API response. Raw response:', result, 'Zod errors:', parsedResult.error.flatten());
        // Construct a more informative error message from Zod issues
        const zodErrorMessages = parsedResult.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ');
        throw new Error(`Received an invalid response structure from the music generation service. Details: ${zodErrorMessages}`);
    }

    const apiData = parsedResult.data; // Data is now potentially success or error structure

    // Type guard to check if it's a success response (code === 200)
    if ('code' in apiData && apiData.code === 200) {
        // It matched the success schema (or was flexible enough)
        const successData = apiData as z.infer<typeof TopMediaiSuccessResponseSchema>;

        // Check specifically for the song URL presence within the potentially optional data object
        if (successData.data?.oss_url) {
            console.log(`Successfully generated song URL: ${successData.data.oss_url}`);
            return { songUrl: successData.data.oss_url };
        } else {
            // Success code 200, but no URL found
            console.error('TopMediai API success response (code 200) missing song URL:', successData);
            throw new Error('Music generation service response did not contain the expected song URL, despite indicating success.');
        }
    } else {
        // It matched the error schema or was inferred as an error due to non-200 code
        console.error('TopMediai API returned an error structure or non-200 code:', apiData);
        // Use the API's message if available, otherwise provide a generic one based on code
        const errorMessage = ('msg' in apiData && apiData.msg) || `API error code ${apiData.code || 'unknown'}`;
        throw new Error(`Music generation failed: ${errorMessage}`);
    }

  } catch (error) {
    console.error('Error during song generation process:', error);

    // Ensure only simple string messages are thrown back to the client
    if (error instanceof Error) {
        // Use the message from errors thrown within the try block, or a generic one
        throw new Error(error.message || 'An unknown error occurred while generating the song.');
    } else {
        // Handle cases where the caught object isn't an Error instance
        throw new Error('An unexpected error occurred during song generation.');
    }
  }
}

// Note: This file doesn't define a Genkit flow/prompt as it directly calls an external API.
// It acts as a server action callable from the client-side React component.

