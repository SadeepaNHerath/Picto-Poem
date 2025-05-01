'use server';
/**
 * @fileOverview An AI agent that generates a song based on poem lyrics using TopMediai API.
 *
 * - generateSongFromPoem - A function that handles the song generation process.
 * - GenerateSongFromPoemInput - The input type for the generateSongFromPoem function.
 * - GenerateSongFromPoemOutput - The return type for the generateSongFromPoem function.
 */

import { z } from 'genkit';

const GenerateSongFromPoemInputSchema = z.object({
  poem: z.string().describe('The lyrics for the song, based on the generated poem.'),
  title: z.string().optional().default('Poem Song').describe('The title of the song.'),
  prompt: z.string().optional().default('Song based on poem lyrics').describe('A prompt to guide the music style.'),
});
export type GenerateSongFromPoemInput = z.infer<typeof GenerateSongFromPoemInputSchema>;

// Assuming the API returns a structure containing the URL
const TopMediaiApiResponseSchema = z.object({
    code: z.number(),
    msg: z.string(),
    task_id: z.string().optional(), // Include task_id if it's sometimes present
    data: z.object({
        oss_url: z.string().url().describe('The URL of the generated song audio file.'),
    }).optional(), // Make data optional as it might be missing on error or initial response
});

const GenerateSongFromPoemOutputSchema = z.object({
  songUrl: z.string().url().describe('The URL of the generated song.'),
});
export type GenerateSongFromPoemOutput = z.infer<typeof GenerateSongFromPoemOutputSchema>;


export async function generateSongFromPoem(input: GenerateSongFromPoemInput): Promise<GenerateSongFromPoemOutput> {
  const apiKey = process.env.TOPMEDIAI_API_KEY;

  if (!apiKey) {
    throw new Error('TOPMEDIAI_API_KEY environment variable is not set.');
  }

  const options = {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        // Assuming the API key should be passed in a header. Adjust if needed based on TopMediai documentation.
        'x-api-key': apiKey,
     },
    body: JSON.stringify({
      is_auto: 1, // Using defaults from user example
      prompt: input.prompt,
      lyrics: input.poem,
      title: input.title,
      instrumental: 0, // Using defaults from user example
    }),
  };

  try {
    const response = await fetch('https://api.topmediai.com/v1/music', options);

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('TopMediai API Error Response:', errorBody);
      throw new Error(`TopMediai API request failed with status ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    const parsedResult = TopMediaiApiResponseSchema.safeParse(result);

    if (!parsedResult.success) {
        console.error('Failed to parse TopMediai API response:', parsedResult.error);
        console.error('Raw API Response:', result);
        throw new Error('Invalid response structure received from TopMediai API.');
    }

    // Check API-specific error codes or messages
    if (parsedResult.data.code !== 200) {
        console.error('TopMediai API returned an error:', parsedResult.data);
        throw new Error(`TopMediai API error (${parsedResult.data.code}): ${parsedResult.data.msg}`);
    }


    if (!parsedResult.data.data?.oss_url) {
         console.error('TopMediai API response missing song URL:', parsedResult.data);
         throw new Error('TopMediai API response did not contain the song URL.');
    }

    return { songUrl: parsedResult.data.data.oss_url };

  } catch (error) {
    console.error('Error calling TopMediai API:', error);
    if (error instanceof Error) {
        throw new Error(`Failed to generate song: ${error.message}`);
    } else {
        throw new Error('An unknown error occurred while generating the song.');
    }
  }
}

// Note: This file doesn't define a Genkit flow/prompt as it directly calls an external API.
// It acts as a server action callable from the client.
```