
"use client";

import type React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Save } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import type { ScheduleItem } from '@/lib/types';

// Type for the editable item including ID
type EditableScheduleItem = ScheduleItem & { id: string };

// Zod schema for validation
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:MM format validation
const editScheduleItemSchema = z.object({
  id: z.string(), // Keep the ID
  name: z.string().min(1, { message: 'Task name is required.' }).max(100, {message: 'Task name too long.'}),
  startTime: z.string().regex(timeRegex, { message: 'Invalid time format (HH:MM).' }),
  endTime: z.string().regex(timeRegex, { message: 'Invalid time format (HH:MM).' }),
}).refine(data => data.startTime < data.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"], // Point error to endTime field
});


type EditScheduleItemFormValues = z.infer<typeof editScheduleItemSchema>;

interface EditScheduleItemFormProps {
  item: EditableScheduleItem;
  onSave: (updatedItem: EditableScheduleItem) => void;
}

export function EditScheduleItemForm({ item, onSave }: EditScheduleItemFormProps) {
  const form = useForm<EditScheduleItemFormValues>({
    resolver: zodResolver(editScheduleItemSchema),
    defaultValues: {
      ...item, // Pre-fill form with current item data
    },
  });

  const handleFormSubmit = (values: EditScheduleItemFormValues) => {
    onSave(values); // Pass the validated and updated data up
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
         {/* Name is editable for consistency, though often schedule name matches task name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="Scheduled Task Name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
             <FormField
            control={form.control}
            name="startTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Start Time</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
             <FormField
            control={form.control}
            name="endTime"
            render={({ field }) => (
                <FormItem>
                <FormLabel>End Time</FormLabel>
                <FormControl>
                    <Input type="time" {...field} />
                </FormControl>
                <FormMessage />
                </FormItem>
            )}
            />
        </div>

        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            variant="gradient"
            disabled={form.formState.isSubmitting}
            >
             <Save className="mr-2 h-4 w-4" />
             Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
 
    