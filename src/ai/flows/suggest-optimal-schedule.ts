
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
  // Add basic input validation before calling the flow
  if (!input || !Array.isArray(input.tasks) || input.tasks.length === 0) {
    console.warn("SuggestOptimalSchedule called with invalid input:", input);
    // Return a predictable error state that matches the output schema
    return { schedule: [], isPossible: false };
  }
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
  prompt: `Given the following list of tasks, suggest an optimal schedule for a single day, considering deadlines and importance.
The schedule must be in chronological order. Start and end times for each task must be in strict HH:MM format (24-hour clock).
Assume a standard working day (e.g., 09:00 to 17:00) unless deadlines require extending beyond this.
Prioritize higher importance and earlier deadlines. Fit as many tasks as possible. Include reasonable breaks (e.g., 10-15 min) between tasks if time permits.

Tasks:
{{#each tasks}}
- Name: {{{name}}}
  {{#if description}}Description: {{{description}}}{{/if}}
  {{#if deadline}}Deadline: {{{deadline}}}{{/if}}
  Importance: {{importance}}
  Estimated Time: {{estimatedTime}} minutes
{{/each}}

Constraints:
- Output must be a valid JSON object matching the specified output schema.
- Start and End times MUST be in HH:MM format (e.g., "09:00", "14:30").
- The schedule array should contain objects with "name", "startTime", and "endTime".

Return Logic:
- If it's impossible to schedule *any* tasks (e.g., a single task is longer than the available day), return an empty schedule array and set 'isPossible' to false.
- If some tasks can be scheduled but not all within a reasonable timeframe (considering total time, breaks, and standard day), return the partial schedule of tasks that *do* fit and set 'isPossible' to true (indicating possibility, even if incomplete).
- If all tasks fit perfectly, return the full schedule and set 'isPossible' to true.

Example Output for partial fit:
{ "schedule": [ { "name": "High Prio Task", "startTime": "09:00", "endTime": "10:30" }, { "name": "Medium Prio Task", "startTime": "10:45", "endTime": "11:45" } ], "isPossible": true }

Example Output for impossible:
{ "schedule": [], "isPossible": false }

Example Output for all fit:
{ "schedule": [ { "name": "Task 1", "startTime": "09:00", "endTime": "10:00" }, { "name": "Task 2", "startTime": "10:15", "endTime": "11:15" }, ... ], "isPossible": true }

Generate the schedule now.
`,
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
   console.log("AI Input:", JSON.stringify(input, null, 2)); // Log AI input
  const { output, finishReason, usage } = await prompt(input);
  console.log("AI Raw Output:", output); // Log raw AI output
  console.log("AI Finish Reason:", finishReason);
  console.log("AI Usage:", usage);


  if (!output) {
    console.error("AI returned undefined output.");
    // Attempt to return a valid default/error structure
    return { schedule: [], isPossible: false };
  }

   // Validate the output against the Zod schema AFTER receiving it from the AI
   // Although the prompt definition includes output schema validation,
   // doing it explicitly here provides clearer error handling.
   const validationResult = SuggestOptimalScheduleOutputSchema.safeParse(output);

   if (!validationResult.success) {
     console.error("AI output failed validation:", validationResult.error.errors);
     // Handle validation failure - maybe return a default error state or try to salvage
     // For now, return the potentially invalid output but log the error. A stricter approach
     // would be to return { schedule: [], isPossible: false };
     return { schedule: [], isPossible: false }; // Return a safe default on validation failure
   }


   // If validation passes, return the validated data
   return validationResult.data;
});
 
    