import { useEffect, useState, useRef, useCallback, act } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StopwatchProps {
  autoStart?: boolean;
  onChangeTimer: (value: string) => void;
  initialActivity?: string;
}

const Stopwatch = ({ autoStart = false, onChangeTimer, initialActivity = "Study"  }: StopwatchProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [activity, setActivity] = useState(initialActivity);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
    } else if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    } else {
      return `${seconds}`;
    }
  };

  const updateTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      const elapsedTime = Date.now() - startTimeRef.current;
      setElapsedTime(elapsedTime);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  }, []);

  const startTimer = useCallback(() => {
    if (!autoStart) {
      handleRedirect();
    }

    const startTime = Date.now();
    startTimeRef.current = startTime;
    setIsRunning(true);
    animationFrameRef.current = requestAnimationFrame(updateTimer);
  }, [updateTimer]);

  const stopTimer = useCallback(async () => {
    if (startTimeRef.current !== null) {
      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;
      setIsRunning(false);
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      try {
        const response = await axios.post("/api/timer-log", {
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration,
          activity,
        });
        console.log("Timer log saved:", response.data);
      } catch (error) {
        console.error("Error saving timer log:", error);
      }
      setElapsedTime(0);
      startTimeRef.current = null;
      router.push("/home");
    }
  }, [router]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (autoStart) {
      startTimer();
    }
  }, [autoStart, startTimer]);

  const handleRedirect = () => {
    router.push(`/focus?activity=${encodeURIComponent(activity)}`);
    router.refresh();
  };

  const handleStop = () => {
    setShowAlert(true);
  };

  const confirmStop = () => {
    stopTimer();
    setShowAlert(false);
  };

  useEffect(() => {
    const activityParam = searchParams.get('activity');
    if (activityParam) {
      setActivity(activityParam);
    }
  }, []);

  useEffect(() => {
    console.log(activity);
  }, [activity])


  return (
    <div className="relative h-full flex flex-col items-center">
      <div className="absolute top-3/4 -translate-y-full">
        <div className="flex flex-col items-center justify-center w-60 h-60 border-4 border-green-500 rounded-full">
          <div className="text-4xl">{formatTime(elapsedTime)}</div>
        </div>
        <div className="mt-4 flex flex-col items-center bg-zinc-900">
          <div className="mb-4">
            {isRunning ? (
              <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={handleStop}
                    className="bg-red-500"
                  >
                    Stop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-800 text-white">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to stop the timer?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Stopping the timer will save this record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setShowAlert(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmStop}>End session</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button
                onClick={startTimer}
                className="bg-green-500"
              >
                Start
              </Button>
            )}
          </div>
          <div>
            {!autoStart && (
              <Select onValueChange={onChangeTimer}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Change type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Stopwatch">Stopwatch</SelectItem>
                <SelectItem value="Timer">Timer</SelectItem>
                <SelectItem value="Pomodoro">Pomodoro</SelectItem>
              </SelectContent>
            </Select>
            )}
              
          </div>
          <div className="mt-4">
            {!autoStart && (
              <div className="mt-4">
                <Select value = {activity} onValueChange={(value) => setActivity(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Choose activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Workout">Workout</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
