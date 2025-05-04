"use client";

import type React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TaskForm } from '@/components/task-form';
import { TaskList } from '@/components/task-list';
import { ScheduleDisplay } from '@/components/schedule-display';
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
import { suggestOptimalSchedule } from '@/ai/flows/suggest-optimal-schedule';
import type {
    Task,
    Schedule,
    SuggestOptimalScheduleInput,
    SuggestOptimalScheduleOutput,
    TaskWithoutId
} from '@/lib/types';
import { BrainCircuit, User as UserIcon, Loader2, LogIn } from 'lucide-react'; // Correctly import LogIn
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/auth-context'; // Import authentication hook
import { AuthModal } from '@/components/auth-modal'; // Import authentication modal
import { Button } from '@/components/ui/button';
import { db } from '@/lib/firebase'; // Import firestore instance
import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// --- Firestore Data Fetching and Mutations ---

// Fetch tasks for the logged-in user
const fetchTasks = async (userId: string): Promise<Task[]> => {
  if (!userId) return [];
  const tasksCol = collection(db, 'users', userId, 'tasks');
  const q = query(tasksCol); // Add ordering later if needed (e.g., orderBy('createdAt'))
  const taskSnapshot = await getDocs(q);
  const tasksList = taskSnapshot.docs.map(doc => {
    const data = doc.data();
    // Convert Firestore Timestamp to ISO string if deadline exists
    const deadline = data.deadline instanceof Timestamp ? data.deadline.toDate().toISOString() : undefined;
    return {
        id: doc.id,
        ...data,
        deadline,
        // Ensure createdAt and updatedAt are handled (optional here, depends on need)
    } as Task;
  });
  return tasksList;
};

// Add a task for the logged-in user
const addTask = async ({ userId, taskData }: { userId: string, taskData: TaskWithoutId }) => {
   if (!userId) throw new Error("User not logged in");
   const tasksCol = collection(db, 'users', userId, 'tasks');
   // Convert ISO string deadline back to Firestore Timestamp if it exists
    const deadlineTimestamp = taskData.deadline ? Timestamp.fromDate(new Date(taskData.deadline)) : undefined;

   await addDoc(tasksCol, {
     ...taskData,
     deadline: deadlineTimestamp, // Store as Timestamp
     createdAt: serverTimestamp(), // Add server timestamp
     userId: userId, // Store userId with the task
   });
};

// Edit a task for the logged-in user
const editTask = async ({ userId, task }: { userId: string, task: Task }) => {
  if (!userId) throw new Error("User not logged in");
  const taskRef = doc(db, 'users', userId, 'tasks', task.id);
  const { id, ...taskData } = task; // Exclude id from data to be updated
  // Convert ISO string deadline back to Firestore Timestamp if it exists
  const deadlineTimestamp = taskData.deadline ? Timestamp.fromDate(new Date(taskData.deadline)) : undefined;

  await updateDoc(taskRef, {
    ...taskData,
    deadline: deadlineTimestamp, // Store as Timestamp
    updatedAt: serverTimestamp(), // Add server timestamp for updates
  });
};

// Delete a task for the logged-in user
const deleteTask = async ({ userId, taskId }: { userId: string, taskId: string }) => {
  if (!userId) throw new Error("User not logged in");
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskRef);
};


// --- Component Logic ---

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

   // React Query for fetching tasks
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<Task[], Error>({
    queryKey: ['tasks', user?.uid], // Query key includes user ID
    queryFn: () => fetchTasks(user?.uid ?? ''),
    enabled: !!user && !authLoading, // Only fetch if user is logged in and auth is not loading
  });


  // React Query Mutations for CUD operations
  const addTaskMutation = useMutation({
    mutationFn: addTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.uid] }); // Refetch tasks on success
      toast({ title: "Task Added", description: `New task has been added.` });
      setSchedule(null); // Clear schedule when tasks change
    },
    onError: (error) => {
      console.error("Error adding task:", error);
      toast({ title: "Error", description: "Failed to add task.", variant: "destructive" });
    },
  });

  const editTaskMutation = useMutation({
    mutationFn: editTask,
    onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['tasks', user?.uid] });
       toast({ title: "Task Updated", description: `"${variables.task.name}" has been updated.` });
       setSchedule(null); // Clear schedule when tasks change
    },
     onError: (error, variables) => {
      console.error("Error updating task:", error);
      toast({ title: "Error", description: `Failed to update "${variables.task.name}".`, variant: "destructive" });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    // Removed optimistic update logic for simplification
    onSuccess: (_, variables) => {
       queryClient.invalidateQueries({ queryKey: ['tasks', user?.uid] }); // Invalidate queries to refetch
       toast({ title: "Task Deleted", description: `Task has been removed.`, variant: "destructive" });
       setSchedule(null); // Clear schedule as task list changed
    },
    onError: (error, variables) => {
        console.error("Error deleting task:", error);
        // We don't have the name readily available without optimistic updates/context
        toast({ title: "Error", description: `Failed to delete task.`, variant: "destructive" });
    },
    // onSettled is still useful for ensuring refetch happens regardless of error/success
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks', user?.uid] });
    },
  });


  const handleAddTask = (newTaskData: TaskWithoutId) => {
    if (!user) {
        toast({ title: "Not Signed In", description: "Please sign in to add tasks.", variant: "destructive" });
        setIsAuthModalOpen(true);
        return;
    }
     addTaskMutation.mutate({ userId: user.uid, taskData: newTaskData });
  };

  const handleEditTask = (updatedTask: Task) => {
     if (!user) return; // Should not happen if tasks are loaded, but good practice
     editTaskMutation.mutate({ userId: user.uid, task: updatedTask });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!user) return;
     deleteTaskMutation.mutate({ userId: user.uid, taskId: taskId });
  };


  const handleGenerateSchedule = async () => {
    if (!user) {
        toast({ title: "Not Signed In", description: "Please sign in to generate a schedule.", variant: "destructive" });
        setIsAuthModalOpen(true);
        return;
    }
    if (tasks.length === 0) {
      toast({ title: "No Tasks", description: "Add some tasks before generating a schedule.", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    setSchedule(null); // Clear previous schedule

    // Prepare input for the AI flow (exclude client-side 'id' and user-specific fields)
    const aiInput: SuggestOptimalScheduleInput = {
       tasks: tasks.map(({ id, userId, createdAt, updatedAt, ...rest }) => rest) // Exclude IDs and timestamps
    };

    try {
      const result: SuggestOptimalScheduleOutput = await suggestOptimalSchedule(aiInput);
      setSchedule(result);
       if (result.isPossible && result.schedule.length > 0) {
         toast({ title: "Schedule Generated", description: "Your optimal schedule is ready!" });
       } else if (!result.isPossible) {
           toast({ title: "Scheduling Conflict", description: "Could not fit all tasks in one day.", variant: "destructive" });
       } else {
            toast({ title: "Schedule Empty", description: "No tasks were scheduled.", variant: "default"});
       }
    } catch (error) {
      console.error('Error generating schedule:', error);
      toast({ title: "AI Error", description: "Failed to generate schedule. Please try again.", variant: "destructive" });
       setSchedule(null);
    } finally {
      setIsGenerating(false);
    }
  };


  const isLoading = authLoading || tasksLoading;


  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-gradient-to-r from-primary/80 to-accent/80 backdrop-blur-sm text-primary-foreground shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <BrainCircuit className="h-7 w-7" />
             <h1 className="text-3xl font-bold tracking-tight">DayWise</h1>
          </div>
           <div className="flex items-center gap-4">
                <ThemeToggle />
                <Button variant="outline" size="icon" onClick={() => setIsAuthModalOpen(true)}>
                    {authLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : user ? (
                         <UserIcon className="h-5 w-5" /> // Renamed import
                    ) : (
                        <LogIn className="h-5 w-5" /> // Use imported LogIn icon
                    )}
                    <span className="sr-only">Account</span>
                </Button>
           </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow">
           {isLoading ? (
             <div className="space-y-10">
                <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300">
                    <CardHeader><CardTitle>Loading...</CardTitle></CardHeader>
                    <CardContent><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></CardContent>
                </Card>
                 <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300">
                    <CardHeader><CardTitle>Loading Tasks...</CardTitle></CardHeader>
                    <CardContent><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></CardContent>
                </Card>
             </div>
           ) : !user ? (
             // Show prompt to sign in if not logged in
              <div className="lg:col-span-2 flex flex-col items-center justify-center text-center p-10 bg-card/70 backdrop-blur-md rounded-lg shadow-xl border border-border/40">
                <UserIcon className="h-16 w-16 text-primary mb-4" />
                <h2 className="text-2xl font-semibold mb-2">Welcome to DayWise!</h2>
                <p className="text-muted-foreground mb-6">Please sign in to manage your tasks and generate schedules.</p>
                <Button variant="gradient" onClick={() => setIsAuthModalOpen(true)}>
                  <LogIn className="mr-2 h-4 w-4" /> Sign In / Sign Up
                </Button>
              </div>
           ) : (
             // Show main content if logged in
             <>
                <div className="space-y-10">
                    <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                        <CardHeader>
                        <CardTitle>Add a New Task</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <TaskForm onSubmit={handleAddTask} isSubmitting={addTaskMutation.isPending}/>
                        </CardContent>
                    </Card>

                    <TaskList
                        tasks={tasks}
                        onGenerateSchedule={handleGenerateSchedule}
                        onEditTask={handleEditTask}
                        onDeleteTask={handleDeleteTask}
                        isGenerating={isGenerating}
                        isMutating={editTaskMutation.isPending || deleteTaskMutation.isPending}
                    />
                    {tasksError && (
                        <p className="text-destructive text-sm">Error loading tasks: {tasksError.message}</p>
                    )}
                </div>

                <div className="space-y-10 lg:sticky lg:top-24 self-start">
                    <ScheduleDisplay scheduleData={schedule} isLoading={isGenerating} />
                </div>
            </>
           )}
      </main>
       <Toaster />
       <footer className="text-center py-4 text-muted-foreground text-sm">
         Powered by AI ✨
       </footer>
       <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </div>
  );
}

    