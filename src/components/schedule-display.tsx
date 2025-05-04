"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, AlertTriangle } from 'lucide-react';
import type { ScheduleItem, Schedule } from '@/lib/types';
import { Skeleton } from "@/components/ui/skeleton";

interface ScheduleDisplayProps {
  scheduleData: Schedule | null;
  isLoading: boolean;
}

export function ScheduleDisplay({ scheduleData, isLoading }: ScheduleDisplayProps) {
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

  if (!scheduleData) {
     return (
      <Card className="border-dashed border-muted-foreground/40 bg-card/60 backdrop-blur-sm shadow-lg">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Clock className="mx-auto mb-3 h-10 w-10 text-primary/80" />
          <p className="text-lg">Click "Generate Schedule" to get an AI-powered plan!</p>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData.isPossible) {
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

  if (scheduleData.schedule.length === 0) {
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
        <CardTitle className="flex items-center text-2xl"><Clock className="mr-2 h-6 w-6 text-primary" /> Today's Suggested Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduleData.schedule.map((item: ScheduleItem, index: number) => (
             <Card key={index} className="bg-gradient-to-r from-secondary/70 to-secondary/50 shadow-md border border-border/30 transition-transform duration-200 hover:scale-[1.02] hover:shadow-lg">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-lg">{item.name}</p>
                  <p className="text-base text-muted-foreground font-mono">
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
