'use server';

import { z } from 'zod';

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

const POEM_MODELS = [
  'gemini-3.1-flash-lite',
  'gemini-3-flash-preview',
  'gemini-flash-latest',
];
const REQUEST_TIMEOUT_MS = 12_000;

function parseDataUri(dataUri: string): { mimeType: string; data: string } {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    throw new Error('Invalid image data. Please upload the image again.');
  }
  return { mimeType: match[1], data: match[2] };
}

function buildPrompt(styleDescription?: string): string {
  const style = styleDescription?.trim()
    ? `\nWrite it in this style: ${styleDescription.trim()}`
    : '';
  return `You are a poet. Write an original poem inspired by this image.
Capture mood, colors, and story. 8-14 lines. Include a short title on the first line.${style}

Return only the title and poem text. No extra commentary.`;
}

async function generateWithModel(
  model: string,
  apiKey: string,
  mimeType: string,
  data: string,
  prompt: string
): Promise<string> {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inline_data: { mime_type: mimeType, data } },
              { text: prompt },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    }
  );

  const raw = await response.text();
  let parsed: {
    error?: { message?: string; status?: string };
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  } = {};
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Poem service returned an invalid response (${response.status}).`);
  }

  if (!response.ok) {
    const message = parsed.error?.message || `HTTP ${response.status}`;
    throw new Error(message);
  }

  const text = parsed.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || '')
    .join('')
    .trim();
  if (!text) {
    throw new Error('The model did not return a poem. Try another image.');
  }
  return text;
}

export async function generatePoemFromImage(
  input: GeneratePoemFromImageInput
): Promise<GeneratePoemFromImageOutput> {
  const parsedInput = GeneratePoemFromImageInputSchema.safeParse(input);
  if (!parsedInput.success) {
    throw new Error('Invalid input. Please upload an image and try again.');
  }

  const apiKey = process.env.GOOGLE_GENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Poem generation is not configured. Missing GOOGLE_GENAI_API_KEY.');
  }

  const { mimeType, data } = parseDataUri(parsedInput.data.photoDataUri);
  const prompt = buildPrompt(parsedInput.data.styleDescription);

  let lastError = 'Poem generation failed.';
  for (const model of POEM_MODELS) {
    try {
      const poem = await generateWithModel(model, apiKey, mimeType, data, prompt);
      return GeneratePoemFromImageOutputSchema.parse({ poem });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastError = message;
      console.error(`Poem model ${model} failed:`, message);
    }
  }

  if (/high demand|unavailable|503|overloaded|timeout|TimeoutError/i.test(lastError)) {
    throw new Error('The poem service is busy. Please try again in a few seconds.');
  }
  throw new Error(lastError);
}
