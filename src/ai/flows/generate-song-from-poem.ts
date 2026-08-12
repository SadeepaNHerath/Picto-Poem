'use server';

import { generateAceStepSong, mapAceStepError } from '@/ai/services/ace-step';
import { z } from 'genkit';

const GenerateSongFromPoemInputSchema = z.object({
  poem: z.string().min(1, 'Poem content cannot be empty.'),
  title: z.string().optional().default('Poem Song'),
  prompt: z.string().optional().default('Song based on poem lyrics'),
});
export type GenerateSongFromPoemInput = z.infer<typeof GenerateSongFromPoemInputSchema>;

const GenerateSongFromPoemOutputSchema = z.object({
  songUrl: z.string().min(1),
});
export type GenerateSongFromPoemOutput = z.infer<typeof GenerateSongFromPoemOutputSchema>;

/**
 * Generates a sung song from poem lyrics using ACE-Step.
 * Returns a data URI so it works on Vercel serverless (no shared disk).
 */
export async function generateSongFromPoem(
  input: GenerateSongFromPoemInput
): Promise<GenerateSongFromPoemOutput> {
  const validationResult = GenerateSongFromPoemInputSchema.safeParse(input);
  if (!validationResult.success) {
    const firstError =
      validationResult.error.flatten().fieldErrors.poem?.[0] || 'Check input fields.';
    throw new Error(`Invalid input: ${firstError}`);
  }

  try {
    const audio = await generateAceStepSong({
      poem: validationResult.data.poem,
      prompt: validationResult.data.prompt,
    });
    const mimeType = audio.mimeType.split(';')[0] || 'audio/mpeg';
    const songUrl = `data:${mimeType};base64,${audio.data.toString('base64')}`;
    return GenerateSongFromPoemOutputSchema.parse({ songUrl });
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Invalid input:')) {
      throw error;
    }
    throw mapAceStepError(error);
  }
}
