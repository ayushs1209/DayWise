import { z } from 'zod';

// Define Zod schemas directly in this file
export const SuggestOptimalScheduleInputSchema = z.object({
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

export const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z.array(
    z.object({
      name: z.string().describe('The name of the task.'),
      startTime: z.string().describe('The start time for the task (e.g., HH:MM).'),
      endTime: z.string().describe('The end time for the task (e.g., HH:MM).'),
    })
  ),
  isPossible: z.boolean().describe('Whether it is possible to schedule all tasks within a single day.'),
});

// Derive TypeScript types from the schemas
export type SuggestOptimalScheduleInput = z.infer<typeof SuggestOptimalScheduleInputSchema>;
export type SuggestOptimalScheduleOutput = z.infer<typeof SuggestOptimalScheduleOutputSchema>;

// Extract the inner task type from the SuggestOptimalScheduleInputSchema
export type TaskWithoutId = SuggestOptimalScheduleInput['tasks'][number];
export type Task = TaskWithoutId & { id: string }; // Add an ID for client-side list management

// Extract the inner schedule item type from the SuggestOptimalScheduleOutputSchema
export type ScheduleItem = SuggestOptimalScheduleOutput['schedule'][number];

// Schedule type is the same as the output schema type
export type Schedule = SuggestOptimalScheduleOutput;
