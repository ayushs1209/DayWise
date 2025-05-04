import type { z } from 'zod';
import type { SuggestOptimalScheduleInput, SuggestOptimalScheduleOutput } from '@/ai/flows/suggest-optimal-schedule';

// Extract the inner task type from the SuggestOptimalScheduleInputSchema
type InputSchemaType = z.infer<typeof SuggestOptimalScheduleInput>;
export type Task = InputSchemaType['tasks'][number] & { id: string }; // Add an ID for client-side list management

// Extract the inner schedule item type from the SuggestOptimalScheduleOutputSchema
type OutputSchemaType = z.infer<typeof SuggestOptimalScheduleOutput>;
export type ScheduleItem = OutputSchemaType['schedule'][number];

export type Schedule = OutputSchemaType;
