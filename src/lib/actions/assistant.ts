
'use server';
import { aiInvestmentAssistant, type AiInvestmentAssistantInput, type AiInvestmentAssistantOutput } from '@/ai/flows/ai-investment-assistant';

export async function getInvestmentAdviceAction(
  input: AiInvestmentAssistantInput
): Promise<AiInvestmentAssistantOutput | { error: string }> {
  
  try {
    // Call the Genkit flow. Input validation will be handled by the flow itself.
    const result = await aiInvestmentAssistant(input);
    return result;
  } catch (error: any) {
    console.error("Error in AI investment assistant action:", error);
    // Provide a generic error message to the client
    return { error: error.message || "Failed to get investment advice due to an unexpected error." };
  }
}
