import React, { useEffect, useState, useRef, useCallback} from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import useTimerStore from "@/store/timerStore";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useNotifications } from "@/hooks/use-notification";
import { useTimerCommunication } from "@/lib/timer-communication";

interface TimerProps {
  onChangeTimer: (value: string) => void;
}

const Timer = ({ onChangeTimer }: TimerProps) => {
  const [totalTime, setTotalTime] = useState(10800); // 180 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(600);
  const [activity, setActivity] = useState("Study");
  const [isDragging, setIsDragging] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [quote, setQuote] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const selectedTimeRef = useRef<number>(10800);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { isRunning, setIsRunning, runningCount, setRunningCount } = useTimerStore();
  const { broadcastTimerUpdate } = useTimerCommunication();
  const [isRunningLocal, setIsRunningLocal] = useState(false);

  const router = useRouter();
  const { sendNotification } = useNotifications();

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor((time % 60));

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
  };

  const updateTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      const elapsedTime = Math.floor((Date.now() - startTimeRef.current) / 1000);
      const newTimeLeft = Math.max(0, selectedTimeRef.current - elapsedTime);
      setTimeLeft(newTimeLeft);
      
      if (newTimeLeft === 0) {
        stopTimer();
        sendNotification("Timer completed!", {body: "Restart the timer if you want to keep going", icon: 'https://img.freepik.com/premium-vector/correct-time-icon-clock-icon-with-check-sign-clock-icon-approved-confirm-done-tick-completed-symbol-correct-icon-time-24-accept-agree-apply-approved-back-business-change_995545-153.jpg'});
      } else {
        timerRef.current = requestAnimationFrame(updateTimer);
      }
    }
  }, []);
  
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    selectedTimeRef.current = timeLeft;
    setIsRunningLocal(true);
    const currentRunningCount = useTimerStore.getState().runningCount;
    setRunningCount(currentRunningCount + 1);
    setIsRunning(true);
    broadcastTimerUpdate();
    setTotalTime(timeLeft);
    timerRef.current = requestAnimationFrame(updateTimer);

    const intervalId = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      const newTimeLeft = Math.max(0, selectedTimeRef.current - elapsedTime);
      document.title = `${formatTime(newTimeLeft)} | Ally`;
    }, 1000);
  
    intervalRef.current = intervalId;
  }, [updateTimer, setIsRunning, timeLeft, formatTime]);
  
  const stopTimer = useCallback(async () => {
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }

    const currentRunningCount = useTimerStore.getState().runningCount;
    setRunningCount(Math.max(0, currentRunningCount - 1)) 


    setIsRunningLocal(false);
    broadcastTimerUpdate();
    const endTime = Date.now();
    const duration = endTime - (startTimeRef.current ?? endTime);
    
    try {
      const response = await axios.post("/api/timer-log", {
        startTime: new Date(startTimeRef.current ?? endTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration,
        activity,
      });
    } catch (error) {
      console.error("Error saving timer log: ", error);
    }
    
    startTimeRef.current = null;
    setTimeLeft(selectedTimeRef.current);
    setTotalTime(10800);
    document.title = "Ally";
    router.refresh();
  }, [setIsRunningLocal, activity, router]);
  
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        cancelAnimationFrame(timerRef.current);
      }
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (runningCount <= 0) {
      setIsRunning(false);
    } else {
      setIsRunning(true);
    }
  }, [runningCount, setIsRunning]);

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRunningLocal) {
        event.preventDefault();
        event.returnValue = '';  
      }
    };

    const handleUnload = () => {
      if (isRunningLocal) {
        
        const currentRunningCount = useTimerStore.getState().runningCount;
        setRunningCount(Math.max(0, currentRunningCount - 1));
        if (runningCount === 1) {
          setIsRunning(false);
        }
        broadcastTimerUpdate();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('unload', handleUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('unload', handleUnload);
    };
  }, [isRunningLocal, runningCount, broadcastTimerUpdate, setIsRunning, setRunningCount]);

  const percentage = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 118;
  const offset = circumference - (percentage / 100) * circumference;

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isRunningLocal) {
      setIsDragging(true);
      updateTime(event);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && !isRunningLocal) {
      updateTime(event);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateTime = (event: React.MouseEvent<HTMLDivElement>) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const mouseX = event.clientX - centerX;
    const mouseY = event.clientY - centerY;

    let angle = Math.atan2(mouseY, mouseX);
    if (angle < 0) angle += 2 * Math.PI;

    let percentage = (-angle / (2 * Math.PI)) * 100; //angle negative to correct for direction
    percentage = (100 - percentage + 25) % 100;

    let newTime = Math.round((percentage / 100) * totalTime);
    newTime = Math.round(newTime / 600) * 600; //round to nearest 10 minutes
    newTime = Math.max(600, Math.min(newTime, totalTime)); //clamp between 10 minutes and 3 hours

    setTimeLeft(newTime);
    selectedTimeRef.current = newTime;
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !isRunningLocal && svgRef.current) {
        updateTime(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, isRunningLocal]);

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
  }, [isRunningLocal]);

  return (
  <div className="relative h-full flex flex-col items-center select-none">
    <div className="absolute top-[10%] flex flex-col items-center w-full">
      <div
        className="relative w-60 h-60 mb-8"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg className="w-full h-full transform -rotate-90 cursor-pointer" ref={svgRef}>
          <circle
            cx="120"
            cy="120"
            r="118"
            stroke="#e3ffed"
            opacity={0.3}
            strokeWidth="5"
            fill="transparent"
            className="w-60 h-60"
          />
          <circle
            cx="120"
            cy="120"
            r="118"
            stroke="#22c55e"
            strokeWidth="5"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="w-60 h-60"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      <div className="flex flex-col items-center w-full max-w-[350px]">
        <div className="mb-4 w-[40%]">
          {isRunningLocal ? (
            <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleStop}
                  className="bg-red-600 w-full text-white hover:bg-red-500"
                >
                  Give up
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="text-white bg-white/30 backdrop:blur-md">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to stop the timer?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Keep pushing and reach your goal!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => setShowAlert(false)}>Keep going</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmStop}>Give up</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          ) : (
            <Button
              onClick={startTimer}
              className="bg-green-500 w-full text-white hover:bg-green-600"
            >
              Start
            </Button>
          )}
        </div>

        <div className="mt-3 w-[35%]">
          <Select onValueChange={onChangeTimer} disabled={isRunningLocal}>
            <SelectTrigger
              className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed' : 'bg-white/30 backdrop-blur-md'}`}
            >
              <SelectValue placeholder="Timer" />
            </SelectTrigger>
            <SelectContent className="bg-white/20 backdrop-blur-md">
              <SelectItem value="Stopwatch">Stopwatch</SelectItem>
              <SelectItem value="Timer">Timer</SelectItem>
              <SelectItem value="Pomodoro">Pomodoro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-3 w-[35%]">
          <Select
            value={activity}
            onValueChange={(value) => setActivity(value)}
            disabled={isRunningLocal}
          >
            <SelectTrigger
              className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed' : 'bg-white/30 backdrop-blur-md'}`}
            >
              <SelectValue placeholder="Stopwatch" />
            </SelectTrigger>
            <SelectContent className="bg-white/20 backdrop-blur-md">
              <SelectItem value="Study">Study</SelectItem>
              <SelectItem value="Reading">Reading</SelectItem>
              <SelectItem value="Coding">Coding</SelectItem>
              <SelectItem value="Meditation">Meditation</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-zinc-100 mt-12 text-center text-lg">
          Focused {formatTimeForDaily(studyTimeToday)} today
        </div>
      </div>
    </div>
  </div>
  
);

};

export default Timer;