'use server';
import { analyzeSentiment, type AnalyzeSentimentInput, type AnalyzeSentimentOutput } from '@/ai/flows/sentiment-analysis';
import { z } from 'zod';

const AnalyzeSentimentInputSchema = z.object({
  text: z.string().min(10, "Text must be at least 10 characters long."),
});

export async function analyzeNewsSentimentAction(input: AnalyzeSentimentInput): Promise<AnalyzeSentimentOutput | { error: string }> {
  const validatedInput = AnalyzeSentimentInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const result = await analyzeSentiment(validatedInput.data);
    return result;
  } catch (error) {
    console.error("Error in sentiment analysis action:", error);
    return { error: "Failed to analyze sentiment. Please try again." };
  }
}
