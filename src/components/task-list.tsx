"use client";

import type React from 'react';
import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Edit, Trash2, CalendarDays, Clock, AlertCircle, CheckCircle, XCircle, BrainCircuit, Loader2 } from 'lucide-react'; // Added Loader2
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { TaskForm } from './task-form';

interface TaskListProps {
  tasks: Task[];
  onGenerateSchedule: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  isGenerating: boolean;
   isMutating?: boolean; // Added prop for edit/delete loading state
}

const getImportanceBadgeVariant = (importance: 'high' | 'medium' | 'low'): 'destructive' | 'secondary' | 'outline' => {
  switch (importance) {
    case 'high':
      return 'destructive';
    case 'medium':
      return 'secondary';
    case 'low':
      return 'outline';
    default:
      return 'secondary';
  }
};

const getImportanceIcon = (importance: 'high' | 'medium' | 'low'): React.ReactNode => {
    switch (importance) {
        case 'high':
        return <AlertCircle className="mr-1 h-3.5 w-3.5 text-destructive-foreground" />;
        case 'medium':
        return <CheckCircle className="mr-1 h-3.5 w-3.5 text-secondary-foreground" />;
        case 'low':
        return <XCircle className="mr-1 h-3.5 w-3.5 text-muted-foreground" />;
        default:
        return null;
    }
};

export function TaskList({ tasks, onGenerateSchedule, onEditTask, onDeleteTask, isGenerating, isMutating = false }: TaskListProps) {
  const [editDialogOpen, setEditDialogOpen] = useState<string | null>(null); // Store ID of task being edited

  const handleEditSubmit = (updatedTask: Task) => {
      onEditTask(updatedTask);
      // Keep dialog open until mutation settles? Or close optimistically?
      // For now, let's close it optimistically. Add error handling if needed.
       setEditDialogOpen(null); // Close dialog
  }

  const handleDeleteInDialog = (taskId: string) => {
      onDeleteTask(taskId);
       setEditDialogOpen(null); // Close dialog
  }

  return (
    <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="flex items-center text-2xl"><List className="mr-2 h-6 w-6" /> Your Tasks</CardTitle>
         <Button
            onClick={onGenerateSchedule}
            disabled={tasks.length === 0 || isGenerating || isMutating} // Also disable during mutations
            variant="gradient" // Use gradient variant
            className="disabled:from-muted disabled:to-muted/80 disabled:text-muted-foreground disabled:cursor-not-allowed" // Style disabled state
         >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
            </>
          ) : (
             <>
              <BrainCircuit className="mr-2 h-4 w-4" /> Generate Schedule
             </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="py-10 text-center text-muted-foreground text-lg">
            No tasks added yet. Use the form above to plan your day!
          </p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Dialog key={task.id} open={editDialogOpen === task.id} onOpenChange={(isOpen) => !isMutating && setEditDialogOpen(isOpen ? task.id : null)}>
                 <Card className="bg-gradient-to-r from-secondary/70 to-secondary/50 shadow-md border border-border/30 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-lg">{task.name}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" disabled={isMutating}>
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Task</span>
                          </Button>
                        </DialogTrigger>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => onDeleteTask(task.id)} disabled={isMutating}>
                           {isMutating && editDialogOpen === task.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                           <span className="sr-only">Delete Task</span>
                         </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                       <Badge variant={getImportanceBadgeVariant(task.importance)} className="flex items-center px-2.5 py-1 shadow-sm">
                        {getImportanceIcon(task.importance)}
                        {task.importance.charAt(0).toUpperCase() + task.importance.slice(1)}
                      </Badge>
                      <span className="flex items-center"><Clock className="mr-1 h-3.5 w-3.5" /> {task.estimatedTime} min</span>
                      {task.deadline && (
                         // Ensure deadline is parsed correctly before formatting
                        <span className="flex items-center"><CalendarDays className="mr-1 h-3.5 w-3.5" /> {format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                 <DialogContent className="bg-card/95 backdrop-blur-md border border-border/60 shadow-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Edit Task</DialogTitle>
                  </DialogHeader>
                  <TaskForm
                    onSubmit={handleEditSubmit}
                    onDelete={handleDeleteInDialog}
                    initialData={task}
                     isSubmitting={isMutating && editDialogOpen === task.id} // Pass submitting state for the specific form
                     isDeleting={isMutating && editDialogOpen === task.id} // Pass deleting state
                  />
                </DialogContent>
              </Dialog>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
