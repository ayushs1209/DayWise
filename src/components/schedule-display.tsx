"use client";

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Clock, AlertTriangle } from 'lucide-react';
import type { ScheduleItem, Schedule } from '@/lib/types';

interface ScheduleDisplayProps {
  scheduleData: Schedule | null;
  isLoading: boolean;
}

export function ScheduleDisplay({ scheduleData, isLoading }: ScheduleDisplayProps) {
  if (isLoading) {
    return (
      <Card className="bg-card/80 backdrop-blur-sm"> {/* Adjusted card background */}
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="mr-2 h-5 w-5 animate-spin" /> Generating Schedule...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="h-16 animate-pulse rounded-md bg-muted/50"></div> {/* Adjusted pulse background */}
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData) {
     return (
      <Card className="border-dashed border-muted-foreground/50 bg-card/50 backdrop-blur-sm"> {/* Adjusted background */}
        <CardContent className="p-6 text-center text-muted-foreground">
          <Clock className="mx-auto mb-2 h-8 w-8" />
          <p>Your suggested schedule will appear here once generated.</p>
        </CardContent>
      </Card>
    );
  }

  if (!scheduleData.isPossible) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Scheduling Not Possible</AlertTitle>
        <AlertDescription>
          It's not possible to fit all tasks into a single day. Consider removing or shortening some tasks.
        </AlertDescription>
      </Alert>
    );
  }

  if (scheduleData.schedule.length === 0) {
    return (
       <Card className="border-dashed border-muted-foreground/50 bg-card/50 backdrop-blur-sm"> {/* Adjusted background */}
        <CardContent className="p-6 text-center text-muted-foreground">
          <Clock className="mx-auto mb-2 h-8 w-8" />
          <p>No tasks to schedule. Add some tasks above!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/80 backdrop-blur-sm"> {/* Adjusted card background */}
      <CardHeader>
        <CardTitle className="flex items-center"><Clock className="mr-2 h-5 w-5" /> Today's Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {scheduleData.schedule.map((item: ScheduleItem, index: number) => (
            <Card key={index} className="bg-secondary/60 shadow-sm"> {/* Adjusted item card background */}
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
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
