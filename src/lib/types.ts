
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
        estimatedTime: z.number().int().min(1).describe('Estimated time in minutes to complete the task.'), // Ensure integer and min 1
      })
    )
    .min(1) // Ensure at least one task
    .describe('A list of tasks to schedule.'),
});

export const ScheduleItemSchema = z.object({
      id: z.string().optional(), // Optional ID for client-side usage, not expected from AI
      name: z.string().describe('The name of the task.'),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM format").describe('The start time for the task (e.g., HH:MM).'), // Add regex validation
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM format").describe('The end time for the task (e.g., HH:MM).'), // Add regex validation
});

export const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z.array(ScheduleItemSchema), // Use the refined ScheduleItemSchema
  isPossible: z.boolean().describe('Whether it is possible to schedule all tasks within a single day.'),
}).refine(data => {
    // If possible, ensure schedule is not empty unless it's explicitly meant to be.
    // This prevents AI returning isPossible=true with an empty schedule erroneously.
    // However, allow empty schedule if isPossible is false.
    return !data.isPossible || data.schedule.length > 0 || !data.isPossible;
}, {
    message: "If scheduling is possible, the schedule array should not be empty.",
    path: ["schedule"], // Point error to schedule field
});


// Derive TypeScript types from the schemas
export type SuggestOptimalScheduleInput = z.infer<typeof SuggestOptimalScheduleInputSchema>;
export type SuggestOptimalScheduleOutput = z.infer<typeof SuggestOptimalScheduleOutputSchema>;

// Extract the inner task type from the SuggestOptimalScheduleInputSchema
export type TaskWithoutId = SuggestOptimalScheduleInput['tasks'][number];
export type Task = TaskWithoutId & { id: string }; // Add an ID for client-side list management

// Extract the inner schedule item type from the SuggestOptimalScheduleOutputSchema
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;

// Schedule type is the same as the output schema type
export type Schedule = SuggestOptimalScheduleOutput;
 
    