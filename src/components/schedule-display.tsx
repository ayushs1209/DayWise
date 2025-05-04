"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, AlertTriangle } from 'lucide-react';
import type { ScheduleItem, Schedule } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton"; // Import Skeleton

interface ScheduleDisplayProps {
  scheduleData: Schedule | null;
  isLoading: boolean;
}

export function ScheduleDisplay({ scheduleData, isLoading }: ScheduleDisplayProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl"> {/* Enhanced card style */}
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 animate-spin text-primary" /> Generating Schedule... {/* Color icon */}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              // Use Skeleton component for pulsing effect with better styling
              <Skeleton key={index} className="h-16 w-full rounded-lg bg-muted/60" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData) {
     return (
      <Card className="border-dashed border-muted-foreground/40 bg-card/60 backdrop-blur-sm shadow-lg"> {/* Softer border, slight blur */}
        <CardContent className="p-8 text-center text-muted-foreground"> {/* Increased padding */}
          <Clock className="mx-auto mb-3 h-10 w-10 text-primary/80" /> {/* Larger, styled icon */}
          <p className="text-lg">Your suggested schedule will appear here.</p> {/* Slightly larger text */}
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData.isPossible) {
    return (
      <Alert variant="destructive" className="shadow-lg backdrop-blur-sm border-destructive/70"> {/* Enhanced alert style */}
        <AlertTriangle className="h-5 w-5" /> {/* Slightly larger icon */}
        <AlertTitle className="text-lg">Scheduling Not Possible</AlertTitle> {/* Larger title */}
        <AlertDescription>
          It's not possible to fit all tasks into a single day. Consider removing or shortening some tasks, or adjusting their importance.
        </AlertDescription>
      </Alert>
    );
  }

  if (scheduleData.schedule.length === 0) {
    return (
       <Card className="border-dashed border-muted-foreground/40 bg-card/60 backdrop-blur-sm shadow-lg"> {/* Consistent styling with no-schedule */}
        <CardContent className="p-8 text-center text-muted-foreground">
          <Clock className="mx-auto mb-3 h-10 w-10 text-primary/80" />
          <p className="text-lg">No tasks to schedule. Add some tasks using the form!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/85 backdrop-blur-md border border-border/50 shadow-xl transition-all duration-300 hover:shadow-2xl"> {/* Enhanced card style */}
      <CardHeader>
        <CardTitle className="flex items-center text-2xl"><Clock className="mr-2 h-6 w-6 text-primary" /> Today's Schedule</CardTitle> {/* Styled title */}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduleData.schedule.map((item: ScheduleItem, index: number) => (
             <Card key={index} className="bg-gradient-to-r from-secondary/70 to-secondary/50 shadow-md border border-border/30 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg"> {/* Subtle gradient and hover effect */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">{item.name}</p> {/* Larger font */}
                  <p className="text-base text-muted-foreground font-mono"> {/* Mono font for time */}
                    {item.startTime} - {item.endTime}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
