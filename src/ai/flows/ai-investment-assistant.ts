
'use server';
/**
 * @fileOverview An AI Investment Assistant flow that provides advice based on user queries.
 *
 * - aiInvestmentAssistant - A function that handles investment-related queries.
 * - AiInvestmentAssistantInputSchema - The input type for the aiInvestmentAssistant function.
 * - AiInvestmentAssistantOutputSchema - The return type for the aiInvestmentAssistant function.
 */
import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Define Zod Schemas for input and output
export const AiInvestmentAssistantInputSchema = z.object({
  query: z.string().describe('The user question about the market, a particular stock, or investment strategies.'),
  userProfile: z.object({
    riskTolerance: z.enum(['low', 'medium', 'high']).optional().describe('The user\'s risk tolerance.'),
    investmentGoals: z.array(z.string()).optional().describe('The user\'s investment goals (e.g., retirement, growth, income).'),
  }).optional().describe('Optional user profile information to tailor advice.'),
});
export type AiInvestmentAssistantInput = z.infer<typeof AiInvestmentAssistantInputSchema>;

export const AiInvestmentAssistantOutputSchema = z.object({
  answer: z.string().describe('The summarized insights and advice to help the user make informed decisions.'),
  confidenceScore: z.number().min(0).max(1).optional().describe('A score indicating the confidence in the provided advice (0-1).'),
  suggestedNextQuestions: z.array(z.string()).optional().describe('Questions the user might want to ask next.'),
});
export type AiInvestmentAssistantOutput = z.infer<typeof AiInvestmentAssistantOutputSchema>;

// Define the AI Prompt
const aiInvestmentAssistantPrompt = ai.definePrompt({
  name: 'aiInvestmentAssistantPrompt',
  input: { schema: AiInvestmentAssistantInputSchema },
  output: { schema: AiInvestmentAssistantOutputSchema },
  prompt: `You are a helpful AI Investment Assistant. Your goal is to provide clear, concise, and insightful advice based on the user's query.
Consider the user's risk tolerance: {{{userProfile.riskTolerance}}} and investment goals: {{#if userProfile.investmentGoals}} {{#each userProfile.investmentGoals}} - {{{this}}} {{/each}} {{else}} (not specified) {{/if}} if provided.

User Query: {{{query}}}

Provide a helpful answer. If the query is too vague, ask for clarification.
If you can, suggest 2-3 follow-up questions the user might have.
Assign a confidence score to your answer (0.0 to 1.0).
Do not give specific financial advice like "buy X stock now". Instead, provide information, analysis, and educational content.
Example: If asked about a stock, you can discuss its recent performance, news, and general analyst sentiment, but not whether to buy or sell it.
Keep your answer to a few paragraphs.
`,
});

// Define the AI Flow
const aiInvestmentAssistantFlow = ai.defineFlow(
  {
    name: 'aiInvestmentAssistantFlow',
    inputSchema: AiInvestmentAssistantInputSchema,
    outputSchema: AiInvestmentAssistantOutputSchema,
  },
  async (input) => {
    const { output } = await aiInvestmentAssistantPrompt(input);
    
    // Fallback if the model doesn't provide a structured output as expected
    if (!output) {
        return {
            answer: "I encountered an issue processing your request. Could you please rephrase or try again?"
        }
    }
    return output;
  }
);

// Exported wrapper function
export async function aiInvestmentAssistant(input: AiInvestmentAssistantInput): Promise<AiInvestmentAssistantOutput> {
  return aiInvestmentAssistantFlow(input);
}
