"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TaskForm } from '@/components/task-form';
import { TaskList } from '@/components/task-list';
import { ScheduleDisplay } from '@/components/schedule-display';
import { Toaster } from "@/components/ui/toaster"; // Import Toaster
import { useToast } from "@/hooks/use-toast"; // Import useToast hook
import { suggestOptimalSchedule } from '@/ai/flows/suggest-optimal-schedule';
import type { Task, Schedule, SuggestOptimalScheduleInput, SuggestOptimalScheduleOutput } from '@/lib/types';
import { BrainCircuit } from 'lucide-react'; // Import BrainCircuit for AI features
import { ThemeToggle } from '@/components/theme-toggle'; // Import ThemeToggle


export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const { toast } = useToast(); // Initialize toast

  // Load tasks from local storage on initial render
  useEffect(() => {
    const storedTasks = localStorage.getItem('daywise-tasks');
    if (storedTasks) {
      try {
        const parsedTasks = JSON.parse(storedTasks);
        // Basic validation
        if (Array.isArray(parsedTasks) && parsedTasks.every(t => typeof t.id === 'string' && typeof t.name === 'string')) {
            setTasks(parsedTasks);
        } else {
             console.warn("Stored tasks data is invalid.");
             localStorage.removeItem('daywise-tasks'); // Clear invalid data
        }
      } catch (error) {
        console.error("Failed to parse tasks from local storage:", error);
        localStorage.removeItem('daywise-tasks'); // Clear corrupted data
      }
    }
  }, []);

  // Save tasks to local storage whenever tasks change
  useEffect(() => {
    // Avoid saving initial empty array if loading from storage
    if(tasks.length > 0 || localStorage.getItem('daywise-tasks')) {
        localStorage.setItem('daywise-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);


  const handleAddTask = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask]);
    toast({ title: "Task Added", description: `"${newTask.name}" has been added to your list.` });
  };

  const handleEditTask = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    );
     toast({ title: "Task Updated", description: `"${updatedTask.name}" has been updated.` });
     // Clear schedule if tasks change
     setSchedule(null);
  };

  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find(task => task.id === taskId);
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId));
    if (taskToDelete) {
      toast({ title: "Task Deleted", description: `"${taskToDelete.name}" has been removed.`, variant: "destructive" });
    }
     // Clear schedule if tasks change
    setSchedule(null);
  };

  const handleGenerateSchedule = async () => {
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Add some tasks before generating a schedule.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setSchedule(null); // Clear previous schedule

    // Prepare input for the AI flow, removing the client-side 'id'
    const aiInput: SuggestOptimalScheduleInput = {
       tasks: tasks.map(({ id, ...rest }) => rest) // Exclude 'id'
    };

    try {
      const result: SuggestOptimalScheduleOutput = await suggestOptimalSchedule(aiInput);
      setSchedule(result);
       if (result.isPossible && result.schedule.length > 0) {
         toast({ title: "Schedule Generated", description: "Your optimal schedule is ready!" });
       } else if (!result.isPossible) {
           toast({ title: "Scheduling Conflict", description: "Could not fit all tasks in one day.", variant: "destructive" });
       } else {
            toast({ title: "Schedule Empty", description: "No tasks were scheduled."});
       }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({ title: "Error", description: "Failed to generate schedule. Please try again.", variant: "destructive" });
       setSchedule(null); // Ensure schedule is cleared on error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground"> {/* Ensure body uses bg-background */}
      <header className="bg-primary/80 backdrop-blur-sm text-primary-foreground shadow-md sticky top-0 z-50"> {/* Adjusted header background */}
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <BrainCircuit className="h-6 w-6" />
             <h1 className="text-2xl font-bold">DayWise</h1>
          </div>
          <ThemeToggle /> {/* Add ThemeToggle button */}
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="shadow-lg bg-card/80 backdrop-blur-sm"> {/* Adjusted card background */}
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

        <div className="space-y-8">
            <ScheduleDisplay scheduleData={schedule} isLoading={isGenerating} />
        </div>
      </main>
       <Toaster /> {/* Add Toaster component here */}
    </div>
  );
}
