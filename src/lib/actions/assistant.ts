
'use server';
import { aiInvestmentAssistant, type AiInvestmentAssistantInput, AiInvestmentAssistantInputSchema, type AiInvestmentAssistantOutput } from '@/ai/flows/ai-investment-assistant';

export async function getInvestmentAdviceAction(
  input: AiInvestmentAssistantInput
): Promise<AiInvestmentAssistantOutput | { error: string }> {
  
  const validatedInput = AiInvestmentAssistantInputSchema.safeParse(input);

  if (!validatedInput.success) {
    // Construct a user-friendly error message from Zod errors
    const errorMessages = validatedInput.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ');
    console.error("AI Investment Assistant input validation failed:", errorMessages);
    return { error: `Invalid input: ${errorMessages}` };
  }
  
  try {
    // Call the Genkit flow
    const result = await aiInvestmentAssistant(validatedInput.data);
    return result;
  } catch (error: any) {
    console.error("Error in AI investment assistant action:", error);
    // Provide a generic error message to the client
    return { error: error.message || "Failed to get investment advice due to an unexpected error." };
  }
}
