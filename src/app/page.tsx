"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TaskForm } from '@/components/task-form';
import { TaskList } from '@/components/task-list';
import { ScheduleDisplay } from '@/components/schedule-display';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { suggestOptimalSchedule } from '@/ai/flows/suggest-optimal-schedule';
// Update imports to use the central types file
import type {
    Task,
    Schedule,
    SuggestOptimalScheduleInput, // Import from @/lib/types
    SuggestOptimalScheduleOutput, // Import from @/lib/types
    TaskWithoutId
} from '@/lib/types';
import { BrainCircuit } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast();

  // Load tasks from local storage on initial render
  useEffect(() => {
    try {
      const storedTasks = localStorage.getItem('daywise-tasks');
      if (storedTasks) {
        const parsedTasks: unknown = JSON.parse(storedTasks);
        // Validate loaded data
        if (Array.isArray(parsedTasks) && parsedTasks.every(t => typeof t?.id === 'string' && typeof t?.name === 'string')) {
            setTasks(parsedTasks as Task[]);
        } else {
            console.warn("Stored tasks data is invalid. Clearing storage.");
            localStorage.removeItem('daywise-tasks');
        }
      }
    } catch (error) {
        console.error("Failed to parse tasks from local storage:", error);
        localStorage.removeItem('daywise-tasks'); // Clear corrupted data
    }
  }, []);

  // Save tasks to local storage whenever tasks change
  useEffect(() => {
    // Avoid saving the initial potentially empty array before loading completes
    // or if the loaded data was invalid (tasks would be empty)
    if (tasks.length > 0 || localStorage.getItem('daywise-tasks') !== null) {
      localStorage.setItem('daywise-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);


  const handleAddTask = (newTaskData: TaskWithoutId) => {
    const newTask: Task = { ...newTaskData, id: crypto.randomUUID() };
    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.name}" has been added.` });
    setSchedule(null); // Clear schedule when tasks change
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
     toast({ title: "Task Updated", description: `"${updatedTask.name}" has been updated.` });
     setSchedule(null); // Clear schedule when tasks change
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.name}" has been removed.`, variant: "destructive" });
    }
     setSchedule(null); // Clear schedule when tasks change
  };

  const handleGenerateSchedule = async () => {
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Add some tasks before generating a schedule.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setSchedule(null); // Clear previous schedule while generating

    // Prepare input for the AI flow (TaskWithoutId matches the schema)
    const aiInput: SuggestOptimalScheduleInput = {
       tasks: tasks.map(({ id, ...rest }) => rest) // Exclude client-side 'id'
    };

    try {
      const result: SuggestOptimalScheduleOutput = await suggestOptimalSchedule(aiInput);
      setSchedule(result);
       if (result.isPossible && result.schedule.length > 0) {
         toast({ title: "Schedule Generated", description: "Your optimal schedule is ready!" });
       } else if (!result.isPossible) {
           toast({ title: "Scheduling Conflict", description: "Could not fit all tasks in one day.", variant: "destructive" });
       } else {
            // Handle case where AI returns isPossible=true but schedule is empty
            toast({ title: "Schedule Empty", description: "No tasks were scheduled, perhaps they are too short?", variant: "default"});
       }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({ title: "AI Error", description: "Failed to generate schedule. Please check the AI configuration or try again later.", variant: "destructive" });
       setSchedule(null); // Ensure schedule is cleared on error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col"> {/* Use flex-col for footer */}
      <header className="bg-gradient-to-r from-primary/80 to-accent/80 backdrop-blur-sm text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <BrainCircuit className="h-7 w-7" />
             <h1 className="text-3xl font-bold tracking-tight">DayWise</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow"> {/* Use flex-grow to push footer */}
        <div className="space-y-10">
           <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
            <CardHeader>
              <CardTitle>Add a New Task</CardTitle>
            </CardHeader>
            <CardContent>
              <TaskForm onSubmit={handleAddTask} />
            </CardContent>
          </Card>

          <TaskList
            tasks={tasks}
            onGenerateSchedule={handleGenerateSchedule}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTask}
            isGenerating={isGenerating}
          />
        </div>

        <div className="space-y-10 lg:sticky lg:top-24 self-start"> {/* Make schedule sticky on larger screens */}
            <ScheduleDisplay scheduleData={schedule} isLoading={isGenerating} />
        </div>
      </main>
       <Toaster />
       <footer className="text-center py-4 text-muted-foreground text-sm">
         Powered by AI ✨
       </footer>
    </div>
  );
}
