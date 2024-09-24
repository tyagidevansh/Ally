import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { Pause, Play, SkipForward, Square } from 'lucide-react';
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
import useTimerStore from '@/store/timerStore';
import { useTimerCommunication } from '@/lib/timer-communication';

const Timer = require('timer-for-pomodoro');

interface TimerState {
  raw: number;
  minutes: number;
  seconds: number;
  rounds: number;
  status: 'work' | 'break';
}

interface PomodoroComponentProps {
  onChangeTimer: (value: string) => void;
}

const PomodoroComponent = ({ onChangeTimer }: PomodoroComponentProps) => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isRunningLocal, setIsRunningLocal] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [activity, setActivity] = useState("Study");
  const [showAlert, setShowAlert] = useState(false);
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [intervalsRemaining, setIntervalsRemaining] = useState(1);
  const [pausedTime, setPausedTime] = useState(0);

  const timerRef = useRef<typeof Timer | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const lastStatusRef = useRef<'work' | 'break' | null>(null);
  const pauseTimeRef = useRef<number | null>(null);
  const { isRunning, setIsRunning, runningCount, setRunningCount } = useTimerStore();
  const { broadcastTimerUpdate } = useTimerCommunication();

  useEffect(() => {
    timerRef.current = new Timer(25, 1, 20);

    timerRef.current.subscribe((currentTime: any) => {
      setTimerState({
        raw: currentTime.timeRaw,
        minutes: currentTime.minutes,
        seconds: currentTime.seconds,
        rounds: currentTime.rounds,
        status: currentTime.status,
      });
      setIntervalsRemaining(21 - currentTime.rounds);

      if (lastStatusRef.current === 'work' && currentTime.status === 'break') {
        logWorkTime();
      } else if (lastStatusRef.current === 'break' && currentTime.status === 'work') {
        startTimeRef.current = Date.now();
      }
      lastStatusRef.current = currentTime.status;
    });

    return () => {
      timerRef.current?.stop();
    };
  }, [activity]);
//if the timer runs out maybe just forcefully add 25 mins lmao rather than rely on stored time
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const formatTimeForDaily = (time: number) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

    if (hours > 0) {
      return `${hours} hr ${minutes.toString().padStart(2, "0")} min ${seconds.toString().padStart(2, "0")} sec`;
    } else if (minutes > 0) {
      return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`;
    } else {
      return `${seconds} sec`;
    }
  };

  const handleStart = () => {
    setIsRunningLocal(true);
    const currentRunningCount = useTimerStore.getState().runningCount;
    setRunningCount(currentRunningCount + 1);
    setIsRunning(true);
    broadcastTimerUpdate();
    setPausedTime(0);
    timerRef.current.start();
    setIsPaused(false);
    startTimeRef.current = Date.now();
  };

  const confirmStop = () => {
    setShowAlert(true);
  };

  const handleStop = async () => {
    setShowAlert(false);
    setIsRunningLocal(false);
    const currentRunningCount = useTimerStore.getState().runningCount;
    setRunningCount(Math.max(0, currentRunningCount - 1)); 
    broadcastTimerUpdate();
    timerRef.current.stop();
    if (timerState?.status === "work") {
      await logWorkTime();
    }
    resetTimer();
    const elemTime = document.getElementById('time-display');
    if (elemTime) {
      elemTime.textContent = '25:00';
    }

    const elemStatus = document.getElementById('status-display');
    if (elemStatus) {
      elemStatus.textContent = 'Focus';
    }
  };

  const logWorkTime = async () => {
    if (startTimeRef.current === null) return;

    const endTime = Date.now();
    console.log("paused time: ", pausedTime);
    const duration = endTime - startTimeRef.current;
    try {
      await axios.post("/api/timer-log", {
        startTime: new Date(startTimeRef.current).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: (duration * 0.97) - pausedTime - 2,
        activity,
      });
      fetchTodayStudyTime();
    } catch (error) {
      console.error("Error saving timer log: ", error);
    }
    startTimeRef.current = null;
  };

  const resetTimer = () => {
    timerRef.current = new Timer(25, 5, 20);
    timerRef.current.subscribe((currentTime: any) => {
      setTimerState({
        raw: currentTime.timeRaw,
        minutes: currentTime.minutes,
        seconds: currentTime.seconds,
        rounds: currentTime.rounds,
        status: currentTime.status,
      });
      setIntervalsRemaining(21 - currentTime.rounds);

      if (lastStatusRef.current === 'work' && currentTime.status === 'break') {
        logWorkTime();
      } else if (lastStatusRef.current === 'break' && currentTime.status === 'work') {
        startTimeRef.current = Date.now();
      }
      lastStatusRef.current = currentTime.status;
    });
    setIntervalsRemaining(1);
    startTimeRef.current = null;
  };

  const handlePause = () => {
    if (isPaused) {
      timerRef.current.start();
      setIsPaused(false);
      setPausedTime(pausedTime + (Date.now() - (pauseTimeRef.current ?? Date.now())))
    } else {
      timerRef.current.pause();
      setIsPaused(true);  
      pauseTimeRef.current = Date.now();
    }
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
      setStudyTimeToday(data.totalMicroseconds);
    } catch (error) {
      console.error('Error fetching today\'s study time:', error);
    }
  };

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

  useEffect(() => {
    fetchTodayStudyTime();
  }, [isRunningLocal]);

  const percentage = isRunningLocal 
  ? ((timerState?.raw ?? 1500) / (timerState?.status === "work" ? 1500 : 300)) * 100
  : 100;
  const circumference = 2 * Math.PI * 118;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div className='relative h-full flex flex-col items-center select-none'>
      <div className='absolute top-[10%] flex flex-col items-center w-full'>
        <div className='relative w-60 h-60 mb-8'>
          <svg
            className='w-full h-full transform -rotate-90 cursor-pointer'
            ref={svgRef}
          >
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
          <div className='absolute inset-0 flex flex-col items-center justify-center'>
            <div id='time-display' className='text-4xl font-bold mt-2'>{formatTime(timerState?.raw ?? 1500)}</div>
            <div id = 'status-display' className='text-2xl font-bold mt-2'>{timerState?.status === "work" ? "Focus" :( timerState?.status === "break" ? "Break" : "Focus")}</div>
            <div className='text-lg mt-2'>Interval {intervalsRemaining}</div>
          </div>
        </div>

        <div className="flex flex-col items-center w-full max-w-[350px]">
          <div className="mb-4 w-[40%] text-white">
            <AnimatePresence mode="wait">
              {!isRunningLocal ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={handleStart}
                    className="bg-green-500 w-full py-2 text-white text-bold hover:bg-green-600"
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
                    onClick={handlePause}
                  >
                    {isPaused ? <Play size={24} /> : <Pause size={24} />}
                  </motion.button>
                  
                  <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                    <AlertDialogTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={confirmStop}
                        className="p-3 bg-red-500 rounded-full text-white"
                      >
                        <Square size={32} />
                      </motion.button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white/30 backdrop:blur-md">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure you want to end this session?</AlertDialogTitle>
                        <AlertDialogDescription>
                          End the session if you are done studying.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowAlert(false)}>Keep going</AlertDialogCancel>
                        <AlertDialogAction onClick={handleStop}>End session</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 bg-green-500 rounded-full text-white"
                    onClick={() => timerRef.current.next()}
                  >
                    <SkipForward size={24} />
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="mt-3 w-[35%]">
          <Select 
            onValueChange={onChangeTimer}
            disabled={isRunningLocal}
          >
            <SelectTrigger className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed' : 'bg-white/30 backdrop-blur-md'}`}>
              <SelectValue placeholder="Pomodoro" />
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
            <SelectTrigger className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed' : 'bg-white/30 backdrop-blur-md'}`}>
              <SelectValue placeholder="Study" />
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
  );
};

export default PomodoroComponent;