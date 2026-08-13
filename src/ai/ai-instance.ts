import { gemini, googleAI } from '@genkit-ai/googleai';
import { genkit } from 'genkit';

// Genkit 1.6.2 only auto-registers older Gemini IDs. Register a current
// Flash model that this API key can actually call.
const POEM_MODEL = 'gemini-3-flash-preview';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GOOGLE_GENAI_API_KEY,
      models: [POEM_MODEL],
    }),
  ],
  model: gemini(POEM_MODEL),
});
