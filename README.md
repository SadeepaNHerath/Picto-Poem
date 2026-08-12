# PictoPoem

Turn an image into a poem (Gemini) and a song with vocals (ACE-Step).

## Local setup

```bash
npm install
cp .env.example .env
```

Fill in `.env`:

- `GOOGLE_GENAI_API_KEY` — [Google AI Studio](https://aistudio.google.com/app/apikey) (free tier)
- `HF_TOKEN` — [Hugging Face token](https://huggingface.co/settings/tokens) (free Read token)

```bash
npm run dev
```

Open http://localhost:9002

## Deploy on Vercel (Hobby / free)

1. Import the GitHub repo in [Vercel](https://vercel.com).
2. Add the same two environment variables for Production (and Preview if you want).
3. Deploy.

Song generation uses a public GPU queue and Vercel Hobby caps functions at 60 seconds, so a song can time out if the Space is busy. Try again if that happens.
