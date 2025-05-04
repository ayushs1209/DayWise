"use client";

import type React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Edit, Trash2, CalendarDays, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/types';
import { format, parseISO } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { TaskForm } from './task-form'; // Import TaskForm

interface TaskListProps {
  tasks: Task[];
  onGenerateSchedule: () => void;
  onEditTask: (task: Task) => void; // Pass the full task object
  onDeleteTask: (taskId: string) => void;
  isGenerating: boolean;
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
        return <AlertCircle className="mr-1 h-3 w-3 text-destructive-foreground dark:text-destructive-foreground" />; // Ensure icon contrast in dark destructive
        case 'medium':
        return <CheckCircle className="mr-1 h-3 w-3 text-secondary-foreground" />;
        case 'low':
        return <XCircle className="mr-1 h-3 w-3 text-muted-foreground" />;
        default:
        return null;
    }
};

export function TaskList({ tasks, onGenerateSchedule, onEditTask, onDeleteTask, isGenerating }: TaskListProps) {

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-lg"> {/* Adjusted card background */}
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center"><List className="mr-2 h-5 w-5" /> Your Tasks</CardTitle>
        <Button onClick={onGenerateSchedule} disabled={tasks.length === 0 || isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate Schedule'}
        </Button>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-center text-muted-foreground">No tasks added yet. Add tasks using the form above.</p>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Dialog key={task.id}>
                <Card className="bg-secondary/60 shadow-sm hover:shadow-md transition-shadow"> {/* Adjusted item card background */}
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{task.name}</p>
                        {task.description && (
                          <p className="text-sm text-muted-foreground mt-1">{task.description}</p>
                        )}
                      </div>
                      <div className="flex space-x-1">
                        <DialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Task</span>
                          </Button>
                        </DialogTrigger>
                         <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive/90" onClick={() => onDeleteTask(task.id)}> {/* Adjusted hover color */}
                           <Trash2 className="h-4 w-4" />
                           <span className="sr-only">Delete Task</span>
                         </Button>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      <Badge variant={getImportanceBadgeVariant(task.importance)} className="flex items-center">
                        {getImportanceIcon(task.importance)}
                        {task.importance.charAt(0).toUpperCase() + task.importance.slice(1)}
                      </Badge>
                      <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> {task.estimatedTime} min</span>
                      {task.deadline && (
                        <span className="flex items-center"><CalendarDays className="mr-1 h-3 w-3" /> {format(parseISO(task.deadline), 'MMM d, yyyy')}</span>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <DialogContent className="bg-card/95 backdrop-blur-sm"> {/* Adjusted dialog background */}
                  <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                  </DialogHeader>
                  {/* Pass down handlers and initial data */}
                  <TaskForm
                    onSubmit={(updatedTask) => {
                      onEditTask(updatedTask);
                      // Find the close button and click it programmatically
                      const closeButton = document.querySelector('[data-radix-dialog-close]');
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      }
                    }}
                    onDelete={(taskId) => {
                      onDeleteTask(taskId);
                       // Find the close button and click it programmatically
                      const closeButton = document.querySelector('[data-radix-dialog-close]');
                      if (closeButton instanceof HTMLElement) {
                        closeButton.click();
                      }
                    }}
                    initialData={task}
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
