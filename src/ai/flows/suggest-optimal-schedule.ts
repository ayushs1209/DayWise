'use server';
/**
 * @fileOverview Suggests an optimal schedule for the user's tasks, considering deadlines and importance.
 *
 * - suggestOptimalSchedule - A function that suggests an optimal schedule for the user's tasks.
 */

import { ai } from '@/ai/ai-instance';
// Import schemas and types from the central types file
import type { SuggestOptimalScheduleInput, SuggestOptimalScheduleOutput } from '@/lib/types';
import { SuggestOptimalScheduleInputSchema, SuggestOptimalScheduleOutputSchema } from '@/lib/types';

// Export only the async function
export async function suggestOptimalSchedule(input: SuggestOptimalScheduleInput): Promise<SuggestOptimalScheduleOutput> {
  return suggestOptimalScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalSchedulePrompt',
  input: {
    schema: SuggestOptimalScheduleInputSchema, // Use imported schema
  },
  output: {
    schema: SuggestOptimalScheduleOutputSchema, // Use imported schema
  },
  prompt: `Given the following list of tasks, suggest an optimal schedule for the day, considering deadlines and importance. The schedule should be in chronological order, with start and end times for each task. Assume a standard working day (e.g., 9:00 to 17:00) unless deadlines suggest otherwise. Try to fit all tasks, prioritizing higher importance and earlier deadlines. Include reasonable breaks between tasks if possible.

Tasks:
{{#each tasks}}
- Name: {{name}}
  {{#if description}}Description: {{description}}{{/if}}
  {{#if deadline}}Deadline: {{deadline}}{{/if}}
  Importance: {{importance}}
  Estimated Time: {{estimatedTime}} minutes
{{/each}}

Return a JSON object containing the schedule array and a boolean 'isPossible'.
If it's impossible to schedule all tasks within a single reasonable day (consider total estimated time vs. available hours), return an empty schedule array and set 'isPossible' to false. Otherwise, return the generated schedule and set 'isPossible' to true.`,
});

// Define the flow using imported schemas
const suggestOptimalScheduleFlow = ai.defineFlow<
  typeof SuggestOptimalScheduleInputSchema,
  typeof SuggestOptimalScheduleOutputSchema
>({
  name: 'suggestOptimalScheduleFlow',
  inputSchema: SuggestOptimalScheduleInputSchema,
  outputSchema: SuggestOptimalScheduleOutputSchema,
},
async input => {
  const { output } = await prompt(input);
  // Ensure the output matches the schema, return a default/error state if not
  // The prompt's output validation handles this, but `!` is still needed for type safety if not strictly guaranteed
  return output!;
});
