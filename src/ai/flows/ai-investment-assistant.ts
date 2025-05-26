// use server'

/**
 * @fileOverview An AI investment assistant that answers questions about the market and stocks.
 *
 * - aiInvestmentAssistant - A function that handles the investment question process.
 * - AiInvestmentAssistantInput - The input type for the aiInvestmentAssistant function.
 * - AiInvestmentAssistantOutput - The return type for the aiInvestmentAssistant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiInvestmentAssistantInputSchema = z.object({
  query: z.string().describe('The user question about the market or a particular stock.'),
});
export type AiInvestmentAssistantInput = z.infer<typeof AiInvestmentAssistantInputSchema>;

const AiInvestmentAssistantOutputSchema = z.object({
  answer: z.string().describe('The summarized insights to help the user make informed decisions.'),
});
export type AiInvestmentAssistantOutput = z.infer<typeof AiInvestmentAssistantOutputSchema>;

export async function aiInvestmentAssistant(input: AiInvestmentAssistantInput): Promise<AiInvestmentAssistantOutput> {
  return aiInvestmentAssistantFlow(input);
}

const aiInvestmentAssistantPrompt = ai.definePrompt({
  name: 'aiInvestmentAssistantPrompt',
  input: {schema: AiInvestmentAssistantInputSchema},
  output: {schema: AiInvestmentAssistantOutputSchema},
  prompt: `You are an AI investment assistant. Answer the following question about the market or a particular stock, providing summarized insights to help the user make informed decisions. 

Question: {{{query}}}`,
});

const aiInvestmentAssistantFlow = ai.defineFlow(
  {
    name: 'aiInvestmentAssistantFlow',
    inputSchema: AiInvestmentAssistantInputSchema,
    outputSchema: AiInvestmentAssistantOutputSchema,
  },
  async input => {
    const {output} = await aiInvestmentAssistantPrompt(input);
    return output!;
  }
);
