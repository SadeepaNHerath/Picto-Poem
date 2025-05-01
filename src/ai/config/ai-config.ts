/**
 * AI Configuration
 * Configuration settings for AI models and services
 */

// Gemini model configuration for poem generation
export const geminiConfig = {
  modelName: 'gemini-1.5-pro',
  temperature: 0.7,
  maxOutputTokens: 1024,
  topK: 40,
  topP: 0.95,
};

// TopMediai configuration for song generation
export const topMediaiConfig = {
  genre: 'ambient',
  defaultDuration: 30, // seconds
  voiceType: 'natural',
  audioQuality: 'high',
};

// Prompt templates
export const promptTemplates = {
  poemGeneration: `
    You are a professional poet with a talent for ekphrastic poetry (poetry inspired by visual art).
    Create a beautiful, evocative poem based on the image I'm about to share.
    The poem should:
    - Capture the mood, colors, and story suggested by the image
    - Use vivid imagery and sensory details
    - Have a coherent theme and emotional resonance
    - Be 10-15 lines in length
    - Include a title for the poem
    
    Format your response as:
    {
      "title": "The Title of the Poem",
      "content": "The full text of the poem..."
    }
  `,
  
  songGeneration: `
    Convert the following poem into lyrics for a song:
    
    POEM_TEXT: {{poemText}}
    
    Adapt the poem into song lyrics that:
    - Maintain the core theme and imagery
    - Have a structure suitable for a song (verses, chorus)
    - Preserve the most powerful lines
    - Work well with an ambient/meditative musical style
    
    Format your response as song lyrics only, without any explanations.
  `,
};