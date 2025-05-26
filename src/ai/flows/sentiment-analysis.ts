
'use server';
/**
 * @fileOverview A Sentiment Analysis flow that determines the sentiment of a given text.
 *
 * - analyzeSentiment - A function that performs sentiment analysis.
 * - AnalyzeSentimentInputSchema - The input type for the analyzeSentiment function.
 * - AnalyzeSentimentOutputSchema - The return type for the analyzeSentiment function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define Zod Schemas for input and output
export const AnalyzeSentimentInputSchema = z.object({
  text: z.string().min(10, {message: "Text must be at least 10 characters long."}).describe('The news headline, article snippet, or any text to analyze for sentiment.'),
  context: z.string().optional().describe('Optional context about the text, e.g., source, market sector if news.'),
});
export type AnalyzeSentimentInput = z.infer<typeof AnalyzeSentimentInputSchema>;

export const AnalyzeSentimentOutputSchema = z.object({
  sentiment: z.enum(['positive', 'negative', 'neutral']).describe('The overall sentiment of the text.'),
  score: z.number().min(-1).max(1).describe('A numerical score representing the sentiment (-1 for very negative, 1 for very positive, 0 for neutral).'),
  reason: z.string().optional().describe('A brief explanation for the determined sentiment.'),
  keywords: z.array(z.object({ word: z.string(), sentiment: z.enum(['positive', 'negative', 'neutral']) })).optional().describe('Key words or phrases identified and their individual sentiment.'),
});
export type AnalyzeSentimentOutput = z.infer<typeof AnalyzeSentimentOutputSchema>;

// Define the AI Prompt
const sentimentAnalysisPrompt = ai.definePrompt({
  name: 'sentimentAnalysisPrompt',
  input: { schema: AnalyzeSentimentInputSchema },
  output: { schema: AnalyzeSentimentOutputSchema },
  prompt: `Analyze the sentiment of the following text.
{{#if context}}Context: {{{context}}}{{/if}}
Text to analyze: "{{{text}}}"

Determine if the sentiment is positive, negative, or neutral.
Provide a sentiment score between -1.0 (very negative) and 1.0 (very positive).
Briefly explain the reason for your sentiment analysis.
Identify up to 5 key words or short phrases from the text and their individual sentiment contribution (positive, negative, or neutral).
`,
});

// Define the AI Flow
const analyzeSentimentFlow = ai.defineFlow(
  {
    name: 'analyzeSentimentFlow',
    inputSchema: AnalyzeSentimentInputSchema,
    outputSchema: AnalyzeSentimentOutputSchema,
  },
  async (input) => {
    const { output } = await sentimentAnalysisPrompt(input);

    // Fallback if the model doesn't provide a structured output as expected
     if (!output) {
        return {
            sentiment: "neutral",
            score: 0,
            reason: "Could not determine sentiment from the provided text. The model might have had an issue.",
        }
    }
    return output;
  }
);

// Exported wrapper function
export async function analyzeSentiment(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput> {
  return analyzeSentimentFlow(input);
}
