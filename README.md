# PictoPoem

This is a Next.js application built with Firebase Studio that allows users to generate poems from images and then convert those poems into songs using AI.

## Features

- Upload an image or use a sample image.
- Optionally provide a style description (e.g., Haiku, joyful) to influence the poem and song generation.
- Generate a poem based on the image content and style description using Google's Gemini model via Genkit.
- Generate a song from the generated poem using the TopMediai API.
- Play the generated song directly in the browser.

## Getting Started

1.  **Clone the repository.**
2.  **Install dependencies:**
    ```bash
    npm install
    ```
3.  **Set up Environment Variables:**
    Create a `.env` file in the root directory and add your API keys:

    ```env
    # Genkit Google AI API Key (Server-side recommended)
    # If using Gemini for poem generation, uncomment and add your key
    # GOOGLE_GENAI_API_KEY=YOUR_GOOGLE_API_KEY

    # TopMediai API Key (Required for song generation)
    TOPMEDIAI_API_KEY=YOUR_TOPMEDIAI_API_KEY
    ```

    *   Get a Google AI API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   Get a TopMediai API key from [TopMediai](https://topmediai.com/).

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    This will start the Next.js application, typically on `http://localhost:9002`.

5.  **(Optional) Run the Genkit development server (for inspecting flows):**
    In a separate terminal, run:
    ```bash
    npm run genkit:dev
    # or for watching changes
    # npm run genkit:watch
    ```
    This allows you to interact with and test the Genkit flows defined in the application, usually via a local web UI.

6.  **Open your browser** to `http://localhost:9002` (or the port specified in your terminal).

## Project Structure

-   `src/app/`: Contains the main application pages and layout (Next.js App Router).
-   `src/components/`: Reusable React components.
    -   `features/`: Application-specific feature components.
    -   `ui/`: Reusable UI components from shadcn/ui.
-   `src/ai/`: Contains AI-related logic.
    -   `config/`: AI-specific configuration settings and prompt templates.
    -   `services/`: AI service implementations for poem and song generation.
    -   `utils/`: Helper functions for AI operations.
    -   `flows/`: Defines the Genkit flows for AI processing.
-   `src/types/`: TypeScript type definitions.
-   `src/constants/`: Application constants and magic values.
-   `src/services/`: API service interfaces and implementations.
-   `src/config/`: Application configuration settings.
-   `src/hooks/`: Custom React hooks.
-   `src/lib/`: Utility functions.
-   `src/__tests__/`: Test files (for future testing implementations).
-   `public/`: Static assets.

## Technologies Used

-   [Next.js](https://nextjs.org/) (App Router)
-   [React](https://reactjs.org/)
-   [TypeScript](https://www.typescriptlang.org/)
-   [Tailwind CSS](https://tailwindcss.com/)
-   [shadcn/ui](https://ui.shadcn.com/)
-   [Genkit](https://firebase.google.com/docs/genkit) (with Google AI plugin)
-   [TopMediai API](https://topmediai.com/)
-   [Lucide React](https://lucide.dev/) (Icons)
