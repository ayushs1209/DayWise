
"use client";

import type React from 'react';
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from '@/components/ui/button';
import { Clock, AlertTriangle, Edit, Save } from 'lucide-react';
import type { ScheduleItem, Schedule } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { EditScheduleItemForm } from './edit-schedule-item-form'; // New component for editing
import { useToast } from '@/hooks/use-toast';

interface ScheduleDisplayProps {
  scheduleData: Schedule | null;
  isLoading: boolean;
}

// Add an ID to ScheduleItem for client-side state management
type EditableScheduleItem = ScheduleItem & { id: string };
type EditableSchedule = Omit<Schedule, 'schedule'> & { schedule: EditableScheduleItem[] };

export function ScheduleDisplay({ scheduleData, isLoading }: ScheduleDisplayProps) {
  const [editableSchedule, setEditableSchedule] = useState<EditableSchedule | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scheduleData && scheduleData.schedule) {
      // Add unique IDs to schedule items when data is received
      setEditableSchedule({
        ...scheduleData,
        schedule: scheduleData.schedule.map((item, index) => ({
          ...item,
          id: crypto.randomUUID(), // Assign a unique ID
        })),
      });
    } else {
      setEditableSchedule(null);
    }
  }, [scheduleData]);

  const handleEditSave = (updatedItem: EditableScheduleItem) => {
    if (!editableSchedule) return;

    const newSchedule = editableSchedule.schedule.map(item =>
      item.id === updatedItem.id ? updatedItem : item
    );

    // Optional: Sort schedule again after edit if times changed significantly
    // newSchedule.sort((a, b) => a.startTime.localeCompare(b.startTime));

    setEditableSchedule({ ...editableSchedule, schedule: newSchedule });
    setEditingItemId(null); // Close dialog
    toast({ title: "Schedule Updated", description: `"${updatedItem.name}" time has been adjusted.` });
  };

  if (isLoading) {
    return (
      <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Clock className="mr-2 h-5 w-5 animate-spin text-primary" /> Generating Schedule...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

   if (!scheduleData) { // Check original prop for initial state
     return (
      <Card className="border-dashed border-muted-foreground/40 bg-card/60 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Clock className="mx-auto mb-3 h-10 w-10 text-primary/80" />
          <p className="text-lg">Click "Generate Schedule" to get an AI-powered plan!</p>
        </CardContent>
      </Card>
    );
  }

  // Use editableSchedule for rendering and checking possibility/length after initial load
  if (!editableSchedule) {
     // This case might occur briefly between scheduleData updating and editableSchedule initializing
     return null; // Or a minimal loading/placeholder state
  }


  if (!editableSchedule.isPossible) {
    return (
      <Alert variant="destructive" className="shadow-lg backdrop-blur-sm border-destructive/70">
        <AlertTriangle className="h-5 w-5" />
        <AlertTitle className="text-lg">Scheduling Not Possible</AlertTitle>
        <AlertDescription>
          It's not possible to fit all tasks into a single day. Consider removing or shortening some tasks, or adjusting their importance.
        </AlertDescription>
      </Alert>
    );
  }

  if (editableSchedule.schedule.length === 0) {
    return (
       <Card className="border-dashed border-muted-foreground/40 bg-card/60 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Clock className="mx-auto mb-3 h-10 w-10 text-primary/80" />
          <p className="text-lg">No tasks were scheduled. This might happen if the total estimated time is very short.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-2xl">
            <div className="flex items-center">
                <Clock className="mr-2 h-6 w-6 text-primary" /> Today's Suggested Schedule
            </div>
             {/* Add an info text or button indicating editability if desired */}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {editableSchedule.schedule.map((item) => (
             <Dialog key={item.id} open={editingItemId === item.id} onOpenChange={(isOpen) => setEditingItemId(isOpen ? item.id : null)}>
                <DialogTrigger asChild>
                    <Card className="bg-gradient-to-r from-secondary/70 to-secondary/50 shadow-md border border-border/30 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg cursor-pointer group">
                    <CardContent className="p-4 relative">
                        <div className="flex items-center justify-between">
                        <p className="font-semibold text-lg">{item.name}</p>
                        <p className="text-base text-muted-foreground font-mono">
                            {item.startTime} - {item.endTime}
                        </p>
                        </div>
                         <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-7 w-7 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10">
                            <Edit className="h-4 w-4" />
                            <span className="sr-only">Edit Time</span>
                        </Button>
                    </CardContent>
                    </Card>
                </DialogTrigger>
                 <DialogContent className="bg-card/95 backdrop-blur-md border border-border/60 shadow-xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl">Edit Schedule Item</DialogTitle>
                  </DialogHeader>
                  <EditScheduleItemForm
                    item={item}
                    onSave={handleEditSave}
                  />
                   <DialogFooter className="sm:justify-start">
                    <DialogClose asChild>
                      <Button type="button" variant="secondary">
                        Cancel
                      </Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
 
    