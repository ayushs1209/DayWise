'use server';
/**
 * @fileOverview Suggests an optimal schedule for the user's tasks, considering deadlines and importance.
 *
 * - suggestOptimalSchedule - A function that suggests an optimal schedule for the user's tasks.
 * - SuggestOptimalScheduleInput - The input type for the suggestOptimalSchedule function.
 * - SuggestOptimalScheduleOutput - The return type for the suggestOptimalSchedule function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const SuggestOptimalScheduleInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        name: z.string().describe('The name of the task.'),
        description: z.string().optional().describe('A description of the task.'),
        deadline: z.string().optional().describe('The deadline for the task (e.g., YYYY-MM-DDTHH:MM:SSZ).'),
        importance: z
          .enum(['high', 'medium', 'low'])
          .default('medium')
          .describe('The importance of the task.'),
        estimatedTime: z.number().describe('Estimated time in minutes to complete the task.'),
      })
    )
    .describe('A list of tasks to schedule.'),
});
export type SuggestOptimalScheduleInput = z.infer<typeof SuggestOptimalScheduleInputSchema>;

const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z.array(
    z.object({
      name: z.string().describe('The name of the task.'),
      startTime: z.string().describe('The start time for the task (e.g., HH:MM).'),
      endTime: z.string().describe('The end time for the task (e.g., HH:MM).'),
    })
  ),
  isPossible: z.boolean().describe('Whether it is possible to schedule all tasks within a single day.'),
});
export type SuggestOptimalScheduleOutput = z.infer<typeof SuggestOptimalScheduleOutputSchema>;

export async function suggestOptimalSchedule(input: SuggestOptimalScheduleInput): Promise<SuggestOptimalScheduleOutput> {
  return suggestOptimalScheduleFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestOptimalSchedulePrompt',
  input: {
    schema: z.object({
      tasks: z
        .array(
          z.object({
            name: z.string().describe('The name of the task.'),
            description: z.string().optional().describe('A description of the task.'),
            deadline: z.string().optional().describe('The deadline for the task (e.g., YYYY-MM-DDTHH:MM:SSZ).'),
            importance: z
              .enum(['high', 'medium', 'low'])
              .default('medium')
              .describe('The importance of the task.'),
            estimatedTime: z.number().describe('Estimated time in minutes to complete the task.'),
          })
        )
        .describe('A list of tasks to schedule.'),
    }),
  },
  output: {
    schema: z.object({
      schedule: z.array(
        z.object({
          name: z.string().describe('The name of the task.'),
          startTime: z.string().describe('The start time for the task (e.g., HH:MM).'),
          endTime: z.string().describe('The end time for the task (e.g., HH:MM).'),
        })
      ),
      isPossible: z.boolean().describe('Whether it is possible to schedule all tasks within a single day.'),
    }),
  },
  prompt: `Given the following list of tasks, suggest an optimal schedule for the day, considering deadlines and importance. The schedule should be in chronological order, with start and end times for each task.

Tasks:
{{#each tasks}}
- Name: {{name}}
  Description: {{description}}
  Deadline: {{deadline}}
  Importance: {{importance}}
  Estimated Time: {{estimatedTime}} minutes
{{/each}}

Return a JSON object containing the schedule and a boolean indicating whether it is possible to schedule all tasks within a single day. If it is not possible, return an empty schedule and isPossible as false.`,
});

const suggestOptimalScheduleFlow = ai.defineFlow<
  typeof SuggestOptimalScheduleInputSchema,
  typeof SuggestOptimalScheduleOutputSchema
>({
  name: 'suggestOptimalScheduleFlow',
  inputSchema: SuggestOptimalScheduleInputSchema,
  outputSchema: SuggestOptimalScheduleOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
