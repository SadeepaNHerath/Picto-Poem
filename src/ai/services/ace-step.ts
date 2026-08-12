import { Client } from '@gradio/client';

const ACE_STEP_SPACE = 'ACE-Step/ACE-Step';
const GENERATE_ENDPOINT = '/__call__';
const SONG_DURATION_SECONDS = 20;
const INFER_STEPS = 15;
const REQUEST_TIMEOUT_MS = 50_000;

type GradioFile = {
  url?: string;
  path?: string;
  orig_name?: string;
  mime_type?: string;
  mimeType?: string;
};

function formatLyrics(poem: string): string {
  const trimmed = poem.trim();
  if (/\[(verse|chorus|bridge|intro|outro)/i.test(trimmed)) {
    return trimmed;
  }

  const lines = trimmed.split('\n').map((line) => line.trim()).filter(Boolean);
  const midpoint = Math.max(1, Math.ceil(lines.length / 2));
  const verse = lines.slice(0, midpoint).join('\n');
  const chorus = lines.slice(midpoint).join('\n') || verse;

  return `[verse]\n${verse}\n\n[chorus]\n${chorus}`;
}

function styleToTags(style: string | undefined): string {
  const cleaned = style?.trim();
  const base = 'pop, vocal, melody, gentle, poetic, clear female vocals';
  if (!cleaned) {
    return base;
  }
  return `${cleaned}, vocal, melody, clear vocals`;
}

function extractFileUrl(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === 'string' && /^https?:\/\//.test(value)) {
    return value;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const nested = extractFileUrl(item);
      if (nested) return nested;
    }
    return null;
  }
  if (typeof value === 'object') {
    const file = value as GradioFile;
    if (file.url && /^https?:\/\//.test(file.url)) {
      return file.url;
    }
  }
  return null;
}

function userFacingError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'The free song queue timed out. Wait a minute and try again.';
  }
  if (lower.includes('login') || lower.includes('token') || lower.includes('credential') || lower.includes('unauthorized')) {
    return 'The free song service needs a Hugging Face token. Add HF_TOKEN in Vercel environment variables (or .env locally).';
  }
  if (lower.includes('queue') || lower.includes('gpu') || lower.includes('busy') || lower.includes('503') || lower.includes('429')) {
    return 'The free Hugging Face music queue is busy. Wait a minute and try again.';
  }
  if (lower.includes('sleep') || lower.includes('building') || lower.includes('runtime error')) {
    return 'The free music Space is starting up. Wait about a minute and try again.';
  }
  return 'Free song generation failed. The public ACE-Step queue may be busy — try again shortly.';
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error('timeout')), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/**
 * Generate a sung clip from lyrics via the public ACE-Step Hugging Face Space.
 */
export async function generateAceStepSong(input: {
  poem: string;
  prompt?: string;
}): Promise<{ data: Buffer; mimeType: string }> {
  const token = process.env.HF_TOKEN;
  const hfToken = token?.startsWith('hf_') ? (token as `hf_${string}`) : undefined;
  const client = await withTimeout(
    Client.connect(ACE_STEP_SPACE, hfToken ? { token: hfToken } : {}),
    30_000
  );

  const result = await withTimeout(
    client.predict(GENERATE_ENDPOINT, [
      SONG_DURATION_SECONDS,
      styleToTags(input.prompt),
      formatLyrics(input.poem),
      INFER_STEPS,
      15.0,
      'euler',
      'apg',
      10.0,
      null,
      0.5,
      0.0,
      3.0,
      true,
      false,
      true,
      null,
      0.0,
      0.0,
      false,
      0.5,
      null,
      'none',
    ]),
    REQUEST_TIMEOUT_MS
  );

  const data = Array.isArray(result.data) ? result.data : [result.data];
  const fileUrl = extractFileUrl(data[0]) ?? extractFileUrl(data);
  if (!fileUrl) {
    console.error('ACE-Step response missing audio:', JSON.stringify(result.data)?.slice(0, 1500));
    throw new Error('The free music service did not return audio. Try again in a minute.');
  }

  const audioResponse = await fetch(fileUrl, {
    headers: hfToken ? { Authorization: `Bearer ${hfToken}` } : undefined,
  });
  if (!audioResponse.ok) {
    throw new Error(`Could not download the generated song (status ${audioResponse.status}).`);
  }

  const mimeType = audioResponse.headers.get('content-type') || 'audio/wav';
  const buffer = Buffer.from(await audioResponse.arrayBuffer());
  if (buffer.length < 1000) {
    throw new Error('The free music service returned an empty file. Try again.');
  }

  return { data: buffer, mimeType };
}

export function mapAceStepError(error: unknown): Error {
  console.error('ACE-Step generation error:', error);
  return new Error(userFacingError(error));
}
