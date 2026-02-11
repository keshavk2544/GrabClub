'use server';

/**
 * @fileOverview Personalized product recommendations based on past orders and browsing history.
 * This flow uses a tool to filter low quality product recommendations.
 *
 * - getPersonalizedRecommendations - A function that generates personalized product recommendations.
 * - PersonalizedRecommendationsInput - The input type for the getPersonalizedRecommendations function.
 * - PersonalizedRecommendationsOutput - The return type for the getPersonalizedRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedRecommendationsInputSchema = z.object({
  userId: z.string().describe('The ID of the user for whom to generate recommendations.'),
  pastOrders: z.array(z.string()).describe('List of past order IDs for the user.'),
  browsingHistory: z.array(z.string()).describe('List of product IDs the user has browsed.'),
});
export type PersonalizedRecommendationsInput = z.infer<typeof PersonalizedRecommendationsInputSchema>;

const PersonalizedRecommendationsOutputSchema = z.object({
  productRecommendations: z.array(z.string()).describe('A list of recommended product IDs.'),
});
export type PersonalizedRecommendationsOutput = z.infer<typeof PersonalizedRecommendationsOutputSchema>;


export async function getPersonalizedRecommendations(input: PersonalizedRecommendationsInput): Promise<PersonalizedRecommendationsOutput> {
  return personalizedRecommendationsFlow(input);
}

const filterPoorQualityRecommendations = ai.defineTool(
    {
      name: 'filterPoorQualityRecommendations',
      description: 'Filters out poor quality or irrelevant product recommendations.  This could involve checking product ratings, reviews, or other quality metrics.',
      inputSchema: z.object({
        productIds: z.array(z.string()).describe('The list of product IDs to filter.'),
      }),
      outputSchema: z.array(z.string()).describe('The filtered list of product IDs.'),
    },
    async (input) => {
      // TODO: Implement the logic to filter out poor quality recommendations.
      // This could involve checking product ratings, reviews, or other quality metrics.
      // For now, just return the original list.
      return input.productIds;
    }
);

const prompt = ai.definePrompt({
  name: 'personalizedRecommendationsPrompt',
  input: {schema: PersonalizedRecommendationsInputSchema},
  output: {schema: PersonalizedRecommendationsOutputSchema},
  tools: [filterPoorQualityRecommendations],
  prompt: `You are a recommendation engine specializing in providing personalized product recommendations to college students.

  Based on the user's past orders and browsing history, provide a list of product IDs that the user might be interested in.
  Apply the 'filterPoorQualityRecommendations' tool to filter out low quality recommendations. Always use this tool after generating the initial list of product recommendations.

  Past Orders: {{pastOrders}}
  Browsing History: {{browsingHistory}}

  Return only a list of product IDs.`,
});

const personalizedRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedRecommendationsFlow',
    inputSchema: PersonalizedRecommendationsInputSchema,
    outputSchema: PersonalizedRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
