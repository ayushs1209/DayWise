
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
import { BrainCircuit, User as UserIconImport, Loader2, Ghost, LogIn as LogInIcon, Link as LinkIcon } from 'lucide-react'; // Renamed imports to avoid conflicts
import { ThemeToggle } from '@/components/theme-toggle';
import { useAuth } from '@/context/auth-context'; // Import authentication hook
import { AuthModal } from '@/components/auth-modal'; // Import authentication modal
import { Button } from '@/components/ui/button';
import { db, auth } from '@/lib/firebase'; // Import firestore and auth instances
import { signInAnonymously } from 'firebase/auth'; // Import signInAnonymously
import { collection, addDoc, updateDoc, deleteDoc, query, where, getDocs, doc, Timestamp, serverTimestamp } from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


// --- Firestore Data Fetching and Mutations ---

// Fetch tasks for the logged-in user or return empty for guests
const fetchTasks = async (userId: string | null): Promise<Task[]> => {
  if (!userId) return []; // Return empty array for guests/logged-out users
  // Use a consistent collection name, e.g., 'tasks' directly under 'users/{userId}'
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

   const docRef = await addDoc(tasksCol, {
     ...taskData,
     deadline: deadlineTimestamp, // Store as Timestamp
     createdAt: serverTimestamp(), // Add server timestamp
     userId: userId, // Store userId with the task
   });
    // Return the newly created task with its ID
    return { ...taskData, id: docRef.id, userId: userId, createdAt: new Date() }; // Approximate client-side timestamp
};

// Edit a task for the logged-in user
const editTask = async ({ userId, task }: { userId: string, task: Task }) => {
  if (!userId) throw new Error("User not logged in");
  const taskRef = doc(db, 'users', userId, 'tasks', task.id);
  const { id, createdAt, userId: taskUserId, updatedAt, ...taskData } = task; // Exclude fields not to be updated directly
  // Convert ISO string deadline back to Firestore Timestamp if it exists
  const deadlineTimestamp = taskData.deadline ? Timestamp.fromDate(new Date(taskData.deadline)) : undefined;

  await updateDoc(taskRef, {
    ...taskData,
    deadline: deadlineTimestamp, // Store as Timestamp
    updatedAt: serverTimestamp(), // Add server timestamp for updates
  });
    // Return the updated task
    return { ...task, updatedAt: new Date() }; // Approximate client-side timestamp
};

// Delete a task for the logged-in user
const deleteTask = async ({ userId, taskId }: { userId: string, taskId: string }) => {
  if (!userId) throw new Error("User not logged in");
  const taskRef = doc(db, 'users', userId, 'tasks', taskId);
  await deleteDoc(taskRef);
  return taskId; // Return the ID of the deleted task
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
   // Now fetches based on user?.uid, will use key ['tasks', null] for guests
  const { data: tasks = [], isLoading: tasksLoading, error: tasksError } = useQuery<Task[], Error>({
    queryKey: ['tasks', user?.uid ?? null], // Use null for guest key
    queryFn: () => fetchTasks(user?.uid ?? null),
    enabled: !authLoading, // Fetch as soon as auth state is resolved
     placeholderData: [], // Start with empty array while loading
  });


  // React Query Mutations for CUD operations
  const addTaskMutation = useMutation({
    mutationFn: addTask,
    // Optimistic update for adding tasks (optional, enhances UX)
    onMutate: async (newTaskInfo) => {
        await queryClient.cancelQueries({ queryKey: ['tasks', newTaskInfo.userId] });
        const previousTasks = queryClient.getQueryData<Task[]>(['tasks', newTaskInfo.userId]) ?? [];
        // Create a temporary task for optimistic update
        const optimisticTask: Task = {
            ...newTaskInfo.taskData,
            id: `temp-${Date.now()}`, // Temporary ID
            userId: newTaskInfo.userId,
            createdAt: new Date().toISOString(), // Client-side timestamp
        };
        queryClient.setQueryData<Task[]>(['tasks', newTaskInfo.userId], [...previousTasks, optimisticTask]);
        return { previousTasks, optimisticTask };
    },
    onSuccess: (data, variables, context) => {
      // Replace optimistic task with real data from server
        if (context?.optimisticTask) {
             queryClient.setQueryData<Task[]>(
                ['tasks', variables.userId],
                 (oldTasks = []) => oldTasks.map(task =>
                    task.id === context.optimisticTask.id ? { ...data, id: data.id } : task // Ensure the server ID is used
                 )
            );
        } else {
             // Fallback if optimistic update context is missing
             queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
        }

        toast({ title: "Task Added", description: `"${data.name}" has been added.` });
        setSchedule(null); // Clear schedule when tasks change
    },
    onError: (error, variables, context) => {
        console.error("Error adding task:", error);
         // Rollback optimistic update on error
         if (context?.previousTasks) {
             queryClient.setQueryData(['tasks', variables.userId], context.previousTasks);
         }
        toast({ title: "Error", description: "Failed to add task.", variant: "destructive" });
    },
     onSettled: (data, error, variables) => {
       // Always refetch after mutation settles (success or error) to ensure consistency
       queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
     },
  });

  const editTaskMutation = useMutation({
    mutationFn: editTask,
     // Optimistic update for editing
     onMutate: async (updatedTaskInfo) => {
        await queryClient.cancelQueries({ queryKey: ['tasks', updatedTaskInfo.userId] });
        const previousTasks = queryClient.getQueryData<Task[]>(['tasks', updatedTaskInfo.userId]) ?? [];
        queryClient.setQueryData<Task[]>(
          ['tasks', updatedTaskInfo.userId],
          previousTasks.map(task => task.id === updatedTaskInfo.task.id ? updatedTaskInfo.task : task)
        );
        return { previousTasks };
    },
    onSuccess: (data, variables, context) => {
        // No specific action needed on success if optimistic update worked,
        // but invalidation ensures data consistency.
       toast({ title: "Task Updated", description: `"${variables.task.name}" has been updated.` });
       setSchedule(null); // Clear schedule when tasks change
    },
     onError: (error, variables, context) => {
      console.error("Error updating task:", error);
       // Rollback optimistic update on error
        if (context?.previousTasks) {
            queryClient.setQueryData(['tasks', variables.userId], context.previousTasks);
        }
      toast({ title: "Error", description: `Failed to update "${variables.task.name}".`, variant: "destructive" });
    },
      onSettled: (data, error, variables) => {
        queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
      },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
     // Optimistic update for deleting
    onMutate: async (taskToDelete) => {
        await queryClient.cancelQueries({ queryKey: ['tasks', taskToDelete.userId] });
        const previousTasks = queryClient.getQueryData<Task[]>(['tasks', taskToDelete.userId]) ?? [];
        queryClient.setQueryData<Task[]>(
            ['tasks', taskToDelete.userId],
            previousTasks.filter(task => task.id !== taskToDelete.taskId)
        );
        return { previousTasks };
    },
    onSuccess: (deletedTaskId, variables, context) => {
       toast({ title: "Task Deleted", description: `Task has been removed.`, variant: "destructive" });
       setSchedule(null); // Clear schedule as task list changed
    },
    onError: (error, variables, context) => {
        console.error("Error deleting task:", error);
         // Rollback optimistic update on error
         if (context?.previousTasks) {
             queryClient.setQueryData(['tasks', variables.userId], context.previousTasks);
         }
        toast({ title: "Error", description: `Failed to delete task.`, variant: "destructive" });
    },
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', variables.userId] });
    },
  });


  const handleAddTask = (newTaskData: TaskWithoutId) => {
    // Allow adding tasks locally for guests, but show login prompt for saving
    if (!user) {
        // Optimistically add to local React Query cache for guests
        const optimisticTask: Task = {
            ...newTaskData,
            id: `temp-${Date.now()}`, // Temporary ID
            createdAt: new Date().toISOString(), // Client-side timestamp
        };
         queryClient.setQueryData<Task[]>(['tasks', null], (oldTasks = []) => [...oldTasks, optimisticTask]);
         toast({
             title: "Task Added (Locally)",
             description: "Sign in to save your tasks permanently.",
             action: ( // Add action to open login modal
                 <Button variant="outline" size="sm" onClick={() => setIsAuthModalOpen(true)}>
                     Sign In
                 </Button>
             ),
         });
        setSchedule(null);
        return;
    }
     addTaskMutation.mutate({ userId: user.uid, taskData: newTaskData });
  };

  const handleEditTask = (updatedTask: Task) => {
     if (!user) {
        // Optimistically update local React Query cache for guests
        queryClient.setQueryData<Task[]>(['tasks', null], (oldTasks = []) =>
           oldTasks.map(task => task.id === updatedTask.id ? updatedTask : task)
        );
        toast({ title: "Task Updated (Locally)", description: "Sign in to save changes." });
        setSchedule(null);
        return;
     }
     // Ensure task has the correct userId before mutation
     const taskWithUserId = { ...updatedTask, userId: user.uid };
     editTaskMutation.mutate({ userId: user.uid, task: taskWithUserId });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!user) {
        // Optimistically remove from local React Query cache for guests
         queryClient.setQueryData<Task[]>(['tasks', null], (oldTasks = []) =>
             oldTasks.filter(task => task.id !== taskId)
         );
        toast({ title: "Task Deleted (Locally)", variant:"destructive" });
        setSchedule(null);
        return;
    }
     deleteTaskMutation.mutate({ userId: user.uid, taskId: taskId });
  };

  const handleGenerateSchedule = async () => {
    // Allow generation for guests with local tasks
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
      setSchedule(result); // Set schedule data, including potential errors from AI

       if (result.error) {
           toast({ title: "AI Error", description: result.error, variant: "destructive" });
       } else if (result.isPossible && result.schedule.length > 0) {
         toast({ title: "Schedule Generated", description: "Your optimal schedule is ready!" });
          if (!user) { // Prompt guest to sign in if generation was successful
              toast({
                  title: "Sign In to Save",
                  description: "Your schedule is generated. Sign in to save your tasks and schedules.",
                  action: (
                      <Button variant="outline" size="sm" onClick={() => setIsAuthModalOpen(true)}>
                          Sign In
                      </Button>
                  ),
              });
          }
       } else if (!result.isPossible) {
           toast({ title: "Scheduling Conflict", description: "Could not fit all tasks in one day.", variant: "destructive" });
       } else {
            toast({ title: "Schedule Empty", description: "No tasks were scheduled.", variant: "default"});
       }
    } catch (error: any) {
      console.error('Error generating schedule:', error);
       // Set error state in the schedule object
      setSchedule({ schedule: [], isPossible: false, error: "Failed to generate schedule. Please try again." });
       // Removed redundant toast here, error is displayed in ScheduleDisplay
    } finally {
      setIsGenerating(false);
    }
  };


  // Show loading spinner only during initial auth check
  const isLoading = authLoading;


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
                         user.isAnonymous ? (
                            <Ghost className="h-5 w-5" /> // Guest icon
                         ) : (
                             <UserIconImport className="h-5 w-5" /> // User icon for signed-in users
                         )
                    ) : (
                        <LogInIcon className="h-5 w-5" /> // LogIn icon for signed-out users
                    )}
                    <span className="sr-only">Account</span>
                </Button>
           </div>
        </div>
      </header>

       {/* Main Content - Always visible */}
       <main className="container mx-auto px-4 py-10 grid grid-cols-1 lg:grid-cols-2 gap-10 flex-grow">
           {isLoading ? (
             <div className="lg:col-span-2 flex items-center justify-center p-10">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
             </div>
           ) : (
                <>
                    <div className="space-y-10">
                        <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
                            <CardHeader>
                            <CardTitle>Add a New Task</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <TaskForm
                                    onSubmit={handleAddTask}
                                    isSubmitting={addTaskMutation.isPending}
                                />
                            </CardContent>
                        </Card>

                        <TaskList
                            tasks={tasks}
                            onGenerateSchedule={handleGenerateSchedule}
                            onEditTask={handleEditTask}
                            onDeleteTask={handleDeleteTask}
                            isGenerating={isGenerating}
                             isMutating={editTaskMutation.isPending || deleteTaskMutation.isPending || addTaskMutation.isPending} // Combine mutation states
                        />
                        {tasksError && user && ( // Only show task error if logged in user failed to load
                            <p className="text-destructive text-sm">Error loading tasks: {tasksError.message}</p>
                        )}
                         {tasksLoading && !tasksError && (
                            <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300">
                                <CardHeader><CardTitle>Loading Tasks...</CardTitle></CardHeader>
                                <CardContent><Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" /></CardContent>
                            </Card>
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
         Powered by Rano ✨
       </footer>
       {/* AuthModal remains available */}
       <AuthModal open={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </div>
  );
}
