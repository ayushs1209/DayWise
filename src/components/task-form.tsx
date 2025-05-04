"use client";

import type React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { format } from "date-fns";
import { Plus, Trash2, Save, CalendarIcon } from 'lucide-react';

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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import type { Task, TaskWithoutId } from '@/lib/types';

const taskFormSchema = z.object({
  id: z.string().optional(), // Optional for new tasks
  name: z.string().min(1, { message: 'Task name is required.' }).max(100, {message: 'Task name too long.'}),
  description: z.string().max(500, {message: 'Description too long.'}).optional(),
  deadline: z.date().optional(),
  importance: z.enum(['high', 'medium', 'low']).default('medium'),
  estimatedTime: z.coerce
    .number({ invalid_type_error: "Must be a number" })
    .int()
    .min(1, { message: 'Est. time must be at least 1 min.' })
    .max(1440, { message: 'Est. time cannot exceed 1 day (1440 min).'}),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

interface TaskFormProps {
  onSubmit: (task: Task | TaskWithoutId) => void; // Accept Task or TaskWithoutId
  onDelete?: (taskId: string) => void;
  initialData?: Task | null;
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
    const taskData: TaskWithoutId = {
      name: values.name,
      description: values.description || undefined, // Ensure optional fields are undefined if empty
      deadline: values.deadline ? values.deadline.toISOString() : undefined,
      importance: values.importance,
      estimatedTime: values.estimatedTime, // Already coerced to number by Zod
    };

    if (initialData) {
      const taskToSubmit: Task = { ...taskData, id: initialData.id };
      onSubmit(taskToSubmit);
    } else {
      onSubmit(taskData); // Submit TaskWithoutId for new tasks
       form.reset({ // Reset form only if it's a new task
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
      <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
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
                <Textarea placeholder="Add key details, links, or notes..." {...field} value={field.value ?? ''} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-3">
           <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col justify-end">
                <FormLabel>Deadline (Optional)</FormLabel>
                 <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? (
                            format(field.value, "PPP")
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
                    <SelectItem value="high">High 🔥</SelectItem>
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
                  {/* Ensure field.value is handled correctly, especially on reset */}
                  <Input type="number" placeholder="e.g., 60" {...field} value={field.value ?? ''} min="1" max="1440"/>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end space-x-3 pt-2">
          {initialData && onDelete && (
             <Button
                type="button"
                variant="destructive"
                onClick={() => onDelete(initialData.id)}
                size="icon"
                className="shadow-md transition-all duration-200 hover:shadow-lg active:scale-95"
              >
                <Trash2 className="h-4 w-4"/>
                <span className="sr-only">Delete Task</span>
              </Button>
          )}
          <Button
            type="submit"
            variant="gradient" // Use gradient variant
            disabled={form.formState.isSubmitting} // Disable during submission
            >
             {initialData ? <Save className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
             {initialData ? 'Save Changes' : 'Add Task'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
