
'use server';
import { analyzeSentiment, type AnalyzeSentimentInput, type AnalyzeSentimentOutput } from '@/ai/flows/sentiment-analysis';

export async function analyzeNewsSentimentAction(
  input: AnalyzeSentimentInput
): Promise<AnalyzeSentimentOutput | { error: string }> {
  
  try {
    // Call the Genkit flow. Input validation will be handled by the flow itself.
    // The AnalyzeSentimentInputSchema (used in the flow) includes:
    // text: z.string().min(10, {message: "Text must be at least 10 characters long."})
    const result = await analyzeSentiment(input);
    return result;
  } catch (error: any) {
    console.error("Error in sentiment analysis action:", error);
    // Provide a generic error message to the client, or specific if available from Genkit
    return { error: error.message || "Failed to analyze sentiment due to an unexpected error." };
  }
}
