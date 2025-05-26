
'use server';
// This imports will likely use the minimalized flow definitions
import { aiInvestmentAssistant, type AiInvestmentAssistantInput, type AiInvestmentAssistantOutput } from '@/ai/flows/ai-investment-assistant';
import { z } from 'zod';

// Assuming the schema from the cleared flow file exists
const AiInvestmentAssistantInputSchemaValidation = z.object({
  query: z.string().min(1, "Query cannot be empty.").optional(), // Adjusted for cleared flow
});

export async function getInvestmentAdviceAction(input: AiInvestmentAssistantInput): Promise<AiInvestmentAssistantOutput | { error: string }> {
  const validatedInput = AiInvestmentAssistantInputSchemaValidation.safeParse(input);
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(', ') };
  }
  
  // Call the cleared/minimal flow
  try {
    const result = await aiInvestmentAssistant(validatedInput.data);
    return result; // This will return the placeholder response from the cleared flow
  } catch (error) {
    console.error("Error in cleared AI investment assistant action:", error);
    return { error: "Failed to get investment advice (action cleared)." };
  }
}
