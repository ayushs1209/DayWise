"use client";

import type React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Plus, Trash2, Save } from 'lucide-react'; // Added Save icon

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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DatePicker } from '@/components/ui/date-picker';
import type { Task } from '@/lib/types';

const taskFormSchema = z.object({
  id: z.string().optional(), // Optional for new tasks
  name: z.string().min(1, { message: 'Task name is required.' }).max(100, {message: 'Task name too long.'}), // Added max length
  description: z.string().max(500, {message: 'Description too long.'}).optional(), // Added max length
  deadline: z.date().optional(),
  importance: z.enum(['high', 'medium', 'low']).default('medium'),
  estimatedTime: z.coerce
    .number()
    .min(1, { message: 'Est. time must be at least 1 min.' }) // Shortened message
    .max(1440, { message: 'Est. time cannot exceed 1 day (1440 min).'}), // Added max value
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (task: Task) => void;
  onDelete?: (taskId: string) => void; // Optional delete handler
  initialData?: Task | null; // Optional initial data for editing
}

export function TaskForm({ onSubmit, onDelete, initialData }: TaskFormProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: initialData
      ? {
          ...initialData,
          deadline: initialData.deadline ? new Date(initialData.deadline) : undefined,
        }
      : {
          name: '',
          description: '',
          deadline: undefined,
          importance: 'medium',
          estimatedTime: 30,
        },
  });

  const handleFormSubmit = (values: TaskFormValues) => {
    const taskToSubmit: Task = {
      ...values,
      id: initialData?.id || crypto.randomUUID(), // Use existing ID or generate new one
      deadline: values.deadline ? values.deadline.toISOString() : undefined,
      estimatedTime: Number(values.estimatedTime), // Ensure it's a number
    };
    onSubmit(taskToSubmit);
    if (!initialData) { // Reset form only if it's a new task
      form.reset({
        name: '',
        description: '',
        deadline: undefined,
        importance: 'medium',
        estimatedTime: 30,
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6"> {/* Increased spacing */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Task Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Finish quarterly report" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description (Optional)</FormLabel>
              <FormControl>
                <Textarea placeholder="Add key details, links, or notes..." {...field} rows={3} /> {/* Suggested rows */}
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3"> {/* Responsive grid */}
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end"> {/* Align label better */}
                <FormLabel>Deadline (Optional)</FormLabel>
                <FormControl>
                  <DatePicker date={field.value} setDate={field.onChange} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="importance"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Importance</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select importance level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="high">High 🔥</SelectItem> {/* Added emojis */}
                    <SelectItem value="medium">Medium ✨</SelectItem>
                    <SelectItem value="low">Low 🌱</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="estimatedTime"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Est. Time (min)</FormLabel>
                <FormControl>
                  <Input type="number" placeholder="e.g., 60" {...field} min="1" max="1440"/> {/* Added min/max */}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2"> {/* Increased top padding and spacing */}
          {initialData && onDelete && (
             <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(initialData.id)}
                size="icon"
                className="shadow-md transition-all duration-200 hover:shadow-lg active:scale-95" /* Added effects */
              >
                <Trash2 className="h-4 w-4"/>
                <span className="sr-only">Delete Task</span>
              </Button>
          )}
          <Button
            type="submit"
            className="bg-gradient-to-r from-primary to-accent text-primary-foreground hover:from-primary/90 hover:to-accent/90 shadow-md transition-all duration-200 hover:shadow-lg active:scale-95" /* Gradient Button */
            >
             <> {/* Wrap icon and text in a Fragment */}
               {initialData ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
               {initialData ? 'Save Changes' : 'Add Task'}
             </>
          </Button>
        </div>
      </form>
    </Form>
  );
}
