import { z } from 'zod';
import type { Timestamp } from 'firebase/firestore'; // Import Timestamp type

// Define Zod schemas directly in this file
export const SuggestOptimalScheduleInputSchema = z.object({
  tasks: z
    .array(
      z.object({
        name: z.string().describe('The name of the task.'),
        description: z.string().optional().describe('A description of the task.'),
        deadline: z.string().datetime({ offset: true }).optional().describe('The deadline for the task as ISO 8601 string (e.g., YYYY-MM-DDTHH:MM:SSZ).'), // Expect ISO string
        importance: z
          .enum(['high', 'medium', 'low'])
          .default('medium')
          .describe('The importance of the task.'),
        estimatedTime: z.number().int().min(1).describe('Estimated time in minutes to complete the task.'),
      })
    )
    .min(1)
    .describe('A list of tasks to schedule.'),
});

export const ScheduleItemSchema = z.object({
      id: z.string().optional(), // Optional ID for client-side usage, not expected from AI
      name: z.string().describe('The name of the task.'),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM format").describe('The start time for the task (e.g., HH:MM).'),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Expected HH:MM format").describe('The end time for the task (e.g., HH:MM).'),
});

export const SuggestOptimalScheduleOutputSchema = z.object({
  schedule: z.array(ScheduleItemSchema),
  isPossible: z.boolean().describe('Whether it is possible to schedule all tasks within a single day.'),
  error: z.string().optional().describe('An error message if generation failed.'), // Added optional error field
}).refine(data => {
    // If scheduling is possible OR there's an error, the schedule array can be empty or populated.
    // If scheduling is *not* possible AND there's *no* error, the schedule array *must* be empty.
    // This refine logic might need adjustment based on exact AI behavior on failure vs impossibility.
    // Let's simplify: If !isPossible and !error, schedule must be empty.
     if (!data.isPossible && !data.error) {
         return data.schedule.length === 0;
     }
     return true; // Otherwise, allow any schedule content (empty or not)
}, {
    message: "If scheduling is impossible and there is no error, the schedule array must be empty.",
    path: ["schedule"],
});


// Derive TypeScript types from the schemas
export type SuggestOptimalScheduleInput = z.infer<typeof SuggestOptimalScheduleInputSchema>;
export type SuggestOptimalScheduleOutput = z.infer<typeof SuggestOptimalScheduleOutputSchema>;

// Task type used ONLY for AI input (no ID or Firestore fields)
export type TaskForAI = SuggestOptimalScheduleInput['tasks'][number];

// Base Task type derived from AI input schema, used for form data
export type TaskWithoutId = TaskForAI;

// Full Task type including client-side ID and Firestore fields
export type Task = TaskWithoutId & {
    id: string;
    userId?: string; // Added optional userId
    createdAt?: Timestamp | Date | string; // Allow Timestamp, Date, or string representation
    updatedAt?: Timestamp | Date | string; // Allow Timestamp, Date, or string representation
 };


export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
// Update Schedule type to include optional error
export type Schedule = SuggestOptimalScheduleOutput;
