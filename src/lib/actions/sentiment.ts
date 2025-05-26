
'use server';
import { analyzeSentiment, type AnalyzeSentimentInput, AnalyzeSentimentInputSchema, type AnalyzeSentimentOutput } from '@/ai/flows/sentiment-analysis';

export async function analyzeNewsSentimentAction(
  input: AnalyzeSentimentInput
): Promise<AnalyzeSentimentOutput | { error: string }> {
  
  const validatedInput = AnalyzeSentimentInputSchema.safeParse(input);

  if (!validatedInput.success) {
    // Construct a user-friendly error message from Zod errors
    const errorMessages = validatedInput.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    console.error("Sentiment analysis input validation failed:", errorMessages);
    return { error: `Invalid input: ${errorMessages}` };
  }
  
  try {
    // Call the Genkit flow
    const result = await analyzeSentiment(validatedInput.data);
    return result;
  } catch (error: any) {
    console.error("Error in sentiment analysis action:", error);
    // Provide a generic error message to the client
    return { error: error.message || "Failed to analyze sentiment due to an unexpected error." };
  }
}
