import React, { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import { motion, AnimatePresence } from 'framer-motion';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

import { useNotifications } from "@/hooks/use-notification";
import { RefreshCcw, SkipForward, Square } from "lucide-react";

interface TimerProps {
  onChangeTimer: (value: string) => void;
}

const Pomodoro = ({ onChangeTimer }: TimerProps) => {
  const [totalTime, setTotalTime] = useState(1500);
  const [isBreak, setIsBreak] = useState(false);
  const [intervalsRemaining, setIntervalsRemaining] = useState(8);
  const [timeLeft, setTimeLeft] = useState(1500);
  const { isRunning, setIsRunning } = useTimerStore() as { isRunning: boolean, setIsRunning: (value: boolean) => void };
  const [activity, setActivity] = useState("Study");
  const [showAlert, setShowAlert] = useState(false);
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [quote, setQuote] = useState("");
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const selectedTimeRef = useRef<number>(1500);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
        handleIntervalChange();
        if (totalTime === 1500) {
          if (!document.hidden) {
            sendNotification("Time for a break!", {body: "Rest up and be back in 5!", icon: 'https://img.freepik.com/premium-vector/correct-time-icon-clock-icon-with-check-sign-clock-icon-approved-confirm-done-tick-completed-symbol-correct-icon-time-24-accept-agree-apply-approved-back-business-change_995545-153.jpg'});
          } else {
            sendNotification("25 minutes are up!", {body: "Keep going or return to the site to start the break.", icon: 'https://img.freepik.com/premium-vector/correct-time-icon-clock-icon-with-check-sign-clock-icon-approved-confirm-done-tick-completed-symbol-correct-icon-time-24-accept-agree-apply-approved-back-business-change_995545-153.jpg'});
          }
        } else {
          if (!document.hidden) {
            sendNotification("Break's over!", {body: "Time to lock in", icon: 'https://img.freepik.com/premium-vector/correct-time-icon-clock-icon-with-check-sign-clock-icon-approved-confirm-done-tick-completed-symbol-correct-icon-time-24-accept-agree-apply-approved-back-business-change_995545-153.jpg'});
          } else {
            sendNotification("5 minutes are up!", {body: "Return to the website when you're ready to start focusing.", icon: 'https://img.freepik.com/premium-vector/correct-time-icon-clock-icon-with-check-sign-clock-icon-approved-confirm-done-tick-completed-symbol-correct-icon-time-24-accept-agree-apply-approved-back-business-change_995545-153.jpg'});
          }
        }
      } else {
        timerRef.current = requestAnimationFrame(updateTimer);
      }
    }
  }, []);
  
  const startTimer = useCallback((startTime = timeLeft) => {
    startTimeRef.current = Date.now();
    selectedTimeRef.current = startTime;
    setIsRunning(true);
    setIntervalsRemaining(intervalsRemaining - 1);
    setTotalTime(startTime);
    timerRef.current = requestAnimationFrame(updateTimer);
  
    const intervalId = setInterval(() => {
      const elapsedTime = Math.floor((Date.now() - startTimeRef.current!) / 1000);
      const newTimeLeft = Math.max(0, selectedTimeRef.current - elapsedTime);
      document.title = `${formatTime(newTimeLeft)} | Ally`;
    }, 1000);
  
    intervalRef.current = intervalId;
  }, [timeLeft, setIsRunning, updateTimer, formatTime]);
  
  const stopTimer = useCallback(async () => {
    if (timerRef.current !== null) {
      cancelAnimationFrame(timerRef.current);
    }
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
    }
    setIsRunning(false);
    const endTime = Date.now();
    const duration = endTime - (startTimeRef.current ?? endTime);
    console.log(duration)

    if (duration > 295000 && duration < 305000) {
      //do nothing
    } else {
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
    }

    startTimeRef.current = null;
    setTimeLeft(selectedTimeRef.current);
    //setTotalTime(1500);
    document.title = "Ally";
    router.refresh();
  }, [setIsRunning, activity, router, isBreak, setIsBreak]);
  
  const handleIntervalChange = useCallback(async () => {
    console.log("interval change triggered!");
    await stopTimer();
    
    setIsBreak((prevIsBreak) => {
      let newIsBreak;
      let newTime;
      if (intervalsRemaining == 4) {
        setIntervalsRemaining(8);
        newTime = 4;
        newIsBreak = true;
      } else {
        newIsBreak = !prevIsBreak;
        console.log("New isBreak value:", newIsBreak);
        newTime = newIsBreak ? 300 : 1500;
      }
      console.log(intervalsRemaining);
      startTimer(newTime);
      return newIsBreak;
    });
  }, [stopTimer, startTimer]);

  const handleReset = () => {
    startTimeRef.current = Date.now();
    setTimeLeft(totalTime);
  }

  const handleSkip = () => {
    //stopTimer();
    if (totalTime == 1500) {
      setTotalTime(300);
      setTimeLeft(300);
    } else {
      setTotalTime(1500);
      setTimeLeft(1500);
    }
  }

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

  const percentage = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 118;
  const offset = circumference - (percentage / 100) * circumference;

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

  const handleStop = () => {
    setShowAlert(true);
  };

  const confirmStop = () => {
    stopTimer();
    setShowAlert(false);
    setTotalTime(1500);
    setTimeLeft(1500);
    router.refresh();
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

  return (
    <div className="relative h-full flex flex-col items-center select-none">
      <div className="absolute top-[10%] flex flex-col items-center w-full">
        <div className="relative w-60 h-60 mb-8">
          <svg 
            className="w-full h-full transform -rotate-90 cursor-pointer" 
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-4xl font-bold mt-2">{formatTime(timeLeft)}</div>
            <div className="text-2xl font-bold mt-2">{totalTime === 1500 ? "Focus" : "Break"}</div>
          </div>
        </div>
    
    <div className="flex flex-col items-center w-full max-w-[350px]">
      <div className="mb-4 w-[50%]">
        <AnimatePresence mode="wait">
          {!isRunning ? (
            <motion.div
              key="start"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={() => startTimer(1500)}
                className="bg-green-500 w-full py-2"
              >
                Start
              </Button>
            </motion.div>
          ) : (
            <motion.div
              key="controls"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center items-center space-x-4"
            >
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-blue-500 rounded-full text-white"
              >
                <RefreshCcw size={24} onClick={handleReset} />
              </motion.button>
              
              <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogTrigger asChild>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStop}
                    className="p-3 bg-red-500 rounded-full text-white"
                  >
                    <Square size={32} />
                  </motion.button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white">
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

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 bg-green-500 rounded-full text-white"
              >
                <SkipForward size={24} onClick={handleSkip} />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
        </div>
    </div>

    <TooltipProvider>
      <div className="mt-3 w-[25%]">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select 
                onValueChange={onChangeTimer}
                disabled={isRunning}
              >
                <SelectTrigger className={`w-full ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <SelectValue placeholder="Pomodoro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stopwatch">Stopwatch</SelectItem>
                  <SelectItem value="Timer">Timer</SelectItem>
                  <SelectItem value="Pomodoro">Pomodoro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRunning ? "Timer type cannot be changed while running" : "Select timer type"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      
      <div className="mt-3 w-[25%]">
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Select 
                value={activity} 
                onValueChange={(value) => setActivity(value)}
                disabled={isRunning}
              >
                <SelectTrigger className={`w-full ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
                  <SelectValue placeholder="Stopwatch" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Study">Study</SelectItem>
                  <SelectItem value="Workout">Workout</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p>{isRunning ? "Activity cannot be changed while timer is running" : "Select activity"}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
    
      <div className="text-zinc-900 dark:text-zinc-300 mt-4 text-center">
        Focused {formatTimeForDaily(studyTimeToday)} today
      </div>

    <div className="mt-16 text-zinc-900 dark:text-zinc-200 bottom-4 text-center">
      {quote}
    </div>
  </div>
</div>
  );
};

export default Pomodoro;