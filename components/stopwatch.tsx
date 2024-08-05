import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter} from "next/navigation";
import useTimerStore from "@/store/timerStore";
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
  const {isRunning, setIsRunning} = useTimerStore() as { isRunning: boolean, setIsRunning: (value: boolean) => void };
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [activity, setActivity] = useState(initialActivity);
  const [quote, setQuote] = useState("");
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const router = useRouter();

  const quotes = [
    "The future depends on what you do today",
    "The only way to achieve the impossible is to believe it is possible",
    "Push yourself, because no one else is going to do it for you",
    "Success is not final, failure is not fatal",
    "You don't have to be great to start, but you have to start to be great",
    "Don't limit your challenges. Challenge your limits",
    "Small daily improvements over time lead to stunning results"
  ];

  const getRandomQuote = () => {
    const randomQuote = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomQuote]);
  }

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

  const formatTimeForDaily = (time: number) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

    if (hours > 0) {
      return `${hours} hr ${minutes.toString().padStart(2, "0")} min ${seconds
        .toString()
        .padStart(2, "0")} sec`;
    } else if (minutes > 0) {
      return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`;
    } else {
      return `${seconds} sec`;
    }
  }

  const updateTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      const elapsedTime = Date.now() - startTimeRef.current;
      setElapsedTime(elapsedTime);
    }
  }, []);

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    startTimeRef.current = startTime;
    setIsRunning(true);
    intervalRef.current = window.setInterval(() => {
      updateTimer();
      document.title = `${formatTime(Date.now() - startTime)} | Ally`;
    }, 1000);
  }, [updateTimer]);

  const stopTimer = useCallback(async () => {
    if (startTimeRef.current !== null) {
      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;
      setIsRunning(false);
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }

      try {
        const response = await axios.post("/api/timer-log", {
          startTime: new Date(startTimeRef.current).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration,
          activity,
        });
      } catch (error) {
        console.error("Error saving timer log:", error);
      }
      setElapsedTime(0);
      startTimeRef.current = null;
      document.title = "Ally";
      router.refresh();
    }
  }, [router, activity]);

  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const handleStop = () => {
    setShowAlert(true);
  };

  const confirmStop = () => {
    stopTimer();
    setShowAlert(false);
  };

  const fetchTodayStudyTime = async () => {
    try {
      const response = await fetch('/api/timer-log', {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to fetch study time');
      }
      const data = await response.json();
      const totalMicroseconds = data.totalMicroseconds;
      setStudyTimeToday(totalMicroseconds);
    } catch (error) {
      console.error('Error fetching today\'s study time:', error);
    }
  };

  useEffect(() => {
    fetchTodayStudyTime();
    getRandomQuote();
  }, [isRunning]);

  useEffect(() => {
    console.log(activity);
  }, [activity]);

  return (
    <div className="relative h-full flex flex-col items-center select-none">
      <div className="absolute top-[10%] flex flex-col items-center w-full">
        <div className="flex flex-col items-center justify-center w-60 h-60 border-4 border-green-500 rounded-full mb-8">
          <div className="text-4xl">{formatTime(elapsedTime)}</div>
        </div>
        
        <div className="flex flex-col items-center w-full max-w-[350px]">
          <div className="mb-4 w-[50%]">
            {isRunning ? (
              <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={handleStop}
                    className="bg-red-500 w-full"
                  >
                    Stop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white">
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
                className="bg-green-500 w-full"
              >
                Start
              </Button>
            )}
          </div>
          
          {!autoStart && (
            <>
              <div className="mt-3 w-[50%]">
                <Select onValueChange={onChangeTimer}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Stopwatch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Stopwatch">Stopwatch</SelectItem>
                    <SelectItem value="Timer">Timer</SelectItem>
                    <SelectItem value="Pomodoro">Pomodoro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="mt-3 w-[50%]">
                <Select value={activity} onValueChange={(value) => setActivity(value)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Stopwatch" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Workout">Workout</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-zinc-900 dark:text-zinc-300 mt-4 text-center">
                Focused {formatTimeForDaily(studyTimeToday)} today
              </div>
            </>
          )}
        </div>
        
        <div className="mt-16 text-zinc-900 dark:text-zinc-200 bottom-4 text-center">
          {quote}
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
