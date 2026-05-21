'use client';

import { useEffect, useState, useRef, useCallback } from "react";
import { useBackgroundTimer } from "@/hooks/use-background-timer";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { getSession, saveSession, clearSession, getElapsedMs, FocusSession } from "@/lib/focus-session";
import { timerComm } from "@/lib/timer-communication";

interface StopwatchProps {
  autoStart?: boolean;
  onChangeTimer: (value: string) => void;
  initialActivity?: string;
}

const Stopwatch = ({ autoStart = false, onChangeTimer, initialActivity = "Study" }: StopwatchProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [activity, setActivity] = useState(initialActivity);
  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const [isRunningLocal, setIsRunningLocal] = useState(false);

  const intervalRef = useRef<number | null>(null);
  const router = useRouter();
  const { setIsRunning } = useTimerStore();
  const queryClient = useQueryClient();

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
  };

  // ── Ticking ──────────────────────────────────────────────────────────
  const clearTicking = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const startTicking = useCallback(() => {
    clearTicking();
    const tick = () => {
      const s = getSession();
      if (s && s.type === 'Stopwatch') {
        const elapsed = getElapsedMs(s);
        setElapsedTime(elapsed);
        document.title = `${formatTime(elapsed)} | Ally`;
      }
    };
    tick();
    intervalRef.current = window.setInterval(tick, 1000);
  }, [clearTicking]);

  // Background recovery: recalculate when tab becomes visible
  const handleBackgroundTick = useCallback(() => {
    const s = getSession();
    if (s && s.type === 'Stopwatch') {
      const elapsed = getElapsedMs(s);
      setElapsedTime(elapsed);
      document.title = `${formatTime(elapsed)} | Ally`;
    }
  }, []);

  useBackgroundTimer(isRunningLocal, handleBackgroundTick, 1000);

  // ── Restore session on mount + cross-tab sync ────────────────────────
  useEffect(() => {
    const session = getSession();
    if (session && session.type === 'Stopwatch') {
      setIsRunningLocal(true);
      setActivity(session.activity);
      setIsRunning(true);
      startTicking();
    }

    const unsub = timerComm.subscribe((msg) => {
      if (msg.type === 'session-stopped' || msg.type === 'session-saved') {
        setIsRunningLocal(false);
        setElapsedTime(0);
        clearTicking();
        document.title = 'Ally';
        fetchTodayStudyTime();
      } else if (msg.type === 'session-started') {
        const s = getSession();
        if (s && s.type === 'Stopwatch') {
          setIsRunningLocal(true);
          setActivity(s.activity);
          setIsRunning(true);
          startTicking();
        }
      }
    });

    return () => {
      unsub();
      clearTicking();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Start / Stop ─────────────────────────────────────────────────────
  const startTimer = useCallback(() => {
    const session: FocusSession = {
      type: 'Stopwatch',
      startedAt: Date.now(),
      activity,
      isPaused: false,
      totalPausedMs: 0,
    };
    saveSession(session);
    setIsRunningLocal(true);
    setIsRunning(true);
    timerComm.broadcast({ type: 'session-started' });
    startTicking();
  }, [activity, setIsRunning, startTicking]);

  const stopTimer = useCallback(async () => {
    const session = getSession();
    if (!session) return;

    const button = document.getElementById("stopButton");
    if (button) button.innerText = "Saving...";

    const endTime = Date.now();
    const duration = getElapsedMs(session);

    clearSession();
    setIsRunningLocal(false);
    setIsRunning(false);
    clearTicking();
    document.title = 'Ally';

    try {
      await axios.post("/api/timer-log", {
        startTime: new Date(session.startedAt).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration,
        activity: session.activity,
      });
    } catch (error) {
      console.error("Error saving timer log:", error);
    }

    timerComm.broadcast({ type: 'session-saved' });

    setElapsedTime(0);
    queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['graph'] });
    queryClient.invalidateQueries({ queryKey: ['focused-trends'] });
    queryClient.invalidateQueries({ queryKey: ['comparison'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });

    router.refresh();
    fetchTodayStudyTime();
  }, [router, setIsRunning, clearTicking, queryClient]);

  const resetAbandonedTimer = useCallback(() => {
    clearSession();
    setIsRunningLocal(false);
    setIsRunning(false);
    clearTicking();
    setElapsedTime(0);
    document.title = "Ally";
    timerComm.broadcast({ type: 'session-stopped' });
  }, [setIsRunning, clearTicking]);

  // Auto-discard sessions older than 5 hours
  useEffect(() => {
    if (isRunningLocal && elapsedTime >= 5 * 60 * 60 * 1000) {
      resetAbandonedTimer();
    }
  }, [elapsedTime, isRunningLocal, resetAbandonedTimer]);

  // ── Warn before unload ──────────────────────────────────────────────
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (isRunningLocal) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isRunningLocal]);

  // ── Cleanup interval on unmount ─────────────────────────────────────
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
  }, [isRunningLocal]);

  return (
    <div className="h-full w-full flex flex-col items-center justify-center select-none text-white overflow-y-auto py-4 md:py-0">
      <div className="flex flex-col items-center w-full gap-6">
        {/* Stopwatch circle */}
        <div className="flex flex-col items-center justify-center w-52 h-52 md:w-60 md:h-60 border-[5px] border-green-500 rounded-full shrink-0">
          <div className="text-4xl">{formatTime(elapsedTime)}</div>
        </div>
        
        {/* Controls */}
        <div className="flex flex-col items-center w-full max-w-[350px]">
          <div className="mb-4 w-[40%]">
            {isRunningLocal ? (
              <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
                <AlertDialogTrigger asChild>
                  <Button
                    onClick={handleStop}
                    className="bg-red-600 w-full text-white hover:bg-red-500"
                    id = "stopButton"
                  >
                    Stop
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="text-white bg-white/30 backdrop:blur-md border-none">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure you want to stop the timer?</AlertDialogTitle>
                    <AlertDialogDescription className="text-gray-900">
                      Stopping the timer will save this record.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className = "bg-gray-900 text-white hover:bg-gray-900 hover:text-white border-none" onClick={() => setShowAlert(false)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction className = "bg-white text-gray-900 hover:bg-white hover:text-gray-900 border-none" onClick={confirmStop}>End session</AlertDialogAction>
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
          
          {!autoStart && (
            <>
              <div className="mt-3 w-[35%]">
              <Select 
                onValueChange={onChangeTimer}
                disabled = {isRunningLocal}
              >
                  <SelectTrigger className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed text-gray-900 dark:text-gray-500' : 'bg-white/30 backdrop-blur-md'} border-none`}>
                    <SelectValue placeholder="Stopwatch" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/20 backdrop-blur-md text-white">
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
                  disabled = {isRunningLocal}
                >
                  <SelectTrigger className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed text-gray-900 dark:text-gray-500' : 'bg-white/30 backdrop-blur-md'} border-none`}>
                    <SelectValue placeholder="Study" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/20 backdrop-blur-md text-white">
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                    <SelectItem value="Meditation">Meditation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="text-zinc-100 mt-8 text-center text-lg">
                Focused {formatTimeForDaily(studyTimeToday)} today
              </div>
            </>
          )}
        </div>
        
      </div>
    </div>
  );
};

export default Stopwatch;
