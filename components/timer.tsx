import React, { useEffect, useState, useRef } from "react";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter} from "next/navigation";
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

interface TimerProps {
  onChangeTimer: (value: string) => void;
}

const Timer = ({ onChangeTimer }:TimerProps) => {
  const [totalTime, setTotalTime] = useState(10800); // 180 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(10);
  const [isRunning, setIsRunning] = useState(false);
  const [activity, setActivity] = useState("Study");
  const [isDragging, setIsDragging] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [quote, setQuote] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft == 0) {
      stopTimer();
    }
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const startTimer = () => {
    setIsRunning(true);
    setTotalTime(timeLeft);
    setStartTime(Date.now());
  };

  const stopTimer = async () => {
    setIsRunning(false);
    setTimeLeft(totalTime);
    setTotalTime(10800);
    
    try {
      const response = await axios.post("/api/timer-log", {
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(Date.now()).toISOString(),
        duration: Date.now() - startTime,
        activity,
      });
    } catch (error) {
      console.error("Error saving timer log: ", error);
    }
  };

  const percentage = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 118;
  const offset = circumference - (percentage / 100) * circumference;

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    console.log("mouse clicked!");
    if (!isRunning) {
      setIsDragging(true);
      updateTime(event);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && !isRunning) {
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
    console.log(newTime);
    newTime = Math.round(newTime / 600) * 600; //round to nearest 10 minutes
    newTime = Math.max(600, Math.min(newTime, totalTime)); //clamp between 10 minutes and 3 hours

    setTimeLeft(newTime);
  };

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
  }

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !isRunning && svgRef.current) {
        updateTime(e as unknown as React.MouseEvent<HTMLDivElement>);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
    };
  }, [isDragging, isRunning]);

  const handleStop = () => {
    setShowAlert(true);
  };

  const confirmStop = () => {
    stopTimer();
    setShowAlert(false);
  };

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

  return (
    <div className="flex flex-col items-center justify-center max-h-screen select-none">
      <div className="relative w-60 h-60 mt-20"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <svg 
          className="w-full h-full transform -rotate-90 cursor-pointer " 
          ref={svgRef}
        >
          <circle
            cx="120"
            cy="120"
            r="118"
            stroke="#2b292e"
            strokeWidth="4"
            fill="transparent"
            className="w-60 h-60"
          />
          <circle 
            cx="120"
            cy="120"
            r="118"
            stroke="#22c55e"
            strokeWidth="4"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="w-60 h-60"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>
      <div className="mb-4 mt-8 w-[25%]">
            {isRunning ? (
              <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={handleStop}
                    className="bg-red-500 w-full"
                  >
                    Give up
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
      <div className="mt-3 w-[25%]">
        <Select onValueChange={onChangeTimer}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Timer" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Stopwatch">Stopwatch</SelectItem>
            <SelectItem value="Timer">Timer</SelectItem>
            <SelectItem value="Pomodoro">Pomodoro</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-3 w-[25%]">
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
      <div className="text-zinc-900 dark:text-zinc-300 mt-3 text-center">
        Focused {formatTimeForDaily(studyTimeToday)} today
      </div>
      <div className="mt-16 text-zinc-900 dark:text-zinc-200 bottom-6 text-center">
          {quote}
        </div>
    </div>
  );
};

export default Timer;
