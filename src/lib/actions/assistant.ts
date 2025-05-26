'use server';
import { aiInvestmentAssistant, type AiInvestmentAssistantInput, type AiInvestmentAssistantOutput } from '@/ai/flows/ai-investment-assistant';
import { z } from 'zod';

const AiInvestmentAssistantInputSchema = z.object({
  query: z.string().min(5, "Query must be at least 5 characters long."),
});

export async function getInvestmentAdviceAction(input: AiInvestmentAssistantInput): Promise<AiInvestmentAssistantOutput | { error: string }> {
  const validatedInput = AiInvestmentAssistantInputSchema.safeParse(input);
  if (!validatedInput.success) {
    return { error: validatedInput.error.errors.map(e => e.message).join(', ') };
  }

  try {
    const result = await aiInvestmentAssistant(validatedInput.data);
    return result;
  } catch (error) {
    console.error("Error in AI investment assistant action:", error);
    return { error: "Failed to get investment advice. Please try again." };
  }
}
