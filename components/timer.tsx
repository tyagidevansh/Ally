'use client';

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useBackgroundTimer } from "@/hooks/use-background-timer";
import { Button } from "./ui/button";
import axios from "axios";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
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
import { getSession, saveSession, clearSession, getElapsedMs, getTimerRemainingSecs, FocusSession } from "@/lib/focus-session";
import { timerComm } from "@/lib/timer-communication";

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
  const [isRunningLocal, setIsRunningLocal] = useState(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const intervalRef = useRef<number | null>(null);
  const selectedDurationRef = useRef<number>(600); // the user-chosen duration in seconds
  const isSavingRef = useRef(false); // prevents concurrent save calls
  const { setIsRunning } = useTimerStore();
  const queryClient = useQueryClient();
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

  // ── Timer completion (auto-save with intended duration) ──────────────
  const completeTimer = useCallback(async () => {
    // Guard: prevent concurrent calls (interval tick + backgroundTimer both hitting 0)
    if (isSavingRef.current) return;
    const session = getSession();
    if (!session || session.type !== 'Timer') return;
    isSavingRef.current = true;

    const intendedDurationMs = (session.timerDurationSecs ?? 0) * 1000;
    const endTime = session.startedAt + intendedDurationMs + session.totalPausedMs;

    clearSession();
    setIsRunningLocal(false);
    setIsRunning(false);
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    document.title = "Ally";
    setTimeLeft(selectedDurationRef.current);
    setTotalTime(10800);

    sendNotification("Timer completed!", {
      body: "Restart the timer if you want to keep going",
      icon: 'https://img.freepik.com/premium-vector/correct-time-icon-clock-icon-with-check-sign-clock-icon-approved-confirm-done-tick-completed-symbol-correct-icon-time-24-accept-agree-apply-approved-back-business-change_995545-153.jpg'
    });

    try {
      await axios.post("/api/timer-log", {
        startTime: new Date(session.startedAt).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration: intendedDurationMs,
        activity: session.activity,
      });
    } catch (error) {
      console.error("Error saving timer log: ", error);
    } finally {
      isSavingRef.current = false;
    }

    timerComm.broadcast({ type: 'session-saved' });

    queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['graph'] });
    queryClient.invalidateQueries({ queryKey: ['focused-trends'] });
    queryClient.invalidateQueries({ queryKey: ['comparison'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });

    router.refresh();
    fetchTodayStudyTime();
  }, [setIsRunning, router, queryClient, sendNotification]);

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
      if (s && s.type === 'Timer') {
        const remaining = getTimerRemainingSecs(s);
        setTimeLeft(remaining);
        document.title = `${formatTime(remaining)} | Ally`;
        if (remaining <= 0) {
          // Stop the interval immediately so it doesn't fire again while completeTimer awaits
          clearTicking();
          completeTimer();
        }
      }
    };
    tick();
    intervalRef.current = window.setInterval(tick, 1000);
  }, [clearTicking, completeTimer]);

  // Background recovery: recalculate when tab becomes visible
  const handleBackgroundTick = useCallback(() => {
    const s = getSession();
    if (s && s.type === 'Timer') {
      const remaining = getTimerRemainingSecs(s);
      setTimeLeft(remaining);
      document.title = `${formatTime(remaining)} | Ally`;
      if (remaining <= 0) {
        completeTimer();
      }
    }
  }, [completeTimer]);

  useBackgroundTimer(isRunningLocal, handleBackgroundTick, 1000);

  // ── Restore session on mount + cross-tab sync ────────────────────────
  useEffect(() => {
    const session = getSession();
    if (session && session.type === 'Timer') {
      const remaining = getTimerRemainingSecs(session);
      if (remaining <= 0) {
        // Timer already expired while we were away — auto-save
        completeTimer();
      } else {
        setIsRunningLocal(true);
        setActivity(session.activity);
        setIsRunning(true);
        selectedDurationRef.current = session.timerDurationSecs ?? 600;
        setTotalTime(session.timerDurationSecs ?? 10800);
        setTimeLeft(remaining);
        startTicking();
      }
    }

    const unsub = timerComm.subscribe((msg) => {
      if (msg.type === 'session-stopped' || msg.type === 'session-saved') {
        setIsRunningLocal(false);
        clearTicking();
        document.title = 'Ally';
        setTimeLeft(selectedDurationRef.current);
        setTotalTime(10800);
        fetchTodayStudyTime();
      } else if (msg.type === 'session-started') {
        const s = getSession();
        if (s && s.type === 'Timer') {
          setIsRunningLocal(true);
          setActivity(s.activity);
          setIsRunning(true);
          selectedDurationRef.current = s.timerDurationSecs ?? 600;
          setTotalTime(s.timerDurationSecs ?? 10800);
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
      type: 'Timer',
      startedAt: Date.now(),
      activity,
      timerDurationSecs: timeLeft,
      isPaused: false,
      totalPausedMs: 0,
    };
    saveSession(session);
    selectedDurationRef.current = timeLeft;
    setTotalTime(timeLeft);
    setIsRunningLocal(true);
    setIsRunning(true);
    timerComm.broadcast({ type: 'session-started' });
    startTicking();
  }, [activity, timeLeft, setIsRunning, startTicking]);

  const stopTimer = useCallback(async () => {
    if (isSavingRef.current) return;
    const session = getSession();
    if (!session) return;
    isSavingRef.current = true;

    const button = document.getElementById("stopButton");
    if (button) button.innerText = "Saving...";

    const endTime = Date.now();
    const duration = getElapsedMs(session);

    clearSession();
    setIsRunningLocal(false);
    setIsRunning(false);
    clearTicking();
    document.title = "Ally";
    setTimeLeft(selectedDurationRef.current);
    setTotalTime(10800);

    try {
      await axios.post("/api/timer-log", {
        startTime: new Date(session.startedAt).toISOString(),
        endTime: new Date(endTime).toISOString(),
        duration,
        activity: session.activity,
      });
    } catch (error) {
      console.error("Error saving timer log: ", error);
    } finally {
      isSavingRef.current = false;
    }

    timerComm.broadcast({ type: 'session-saved' });

    queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
    queryClient.invalidateQueries({ queryKey: ['graph'] });
    queryClient.invalidateQueries({ queryKey: ['focused-trends'] });
    queryClient.invalidateQueries({ queryKey: ['comparison'] });
    queryClient.invalidateQueries({ queryKey: ['streak'] });

    router.refresh();
    fetchTodayStudyTime();
  }, [router, setIsRunning, clearTicking, queryClient]);

  // ── Cleanup ──────────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

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

  // ── Drag-to-set-time (circular dial) ────────────────────────────────
  const percentage = (timeLeft / totalTime) * 100;
  const circumference = 2 * Math.PI * 118;
  const offset = circumference - (percentage / 100) * circumference;

  const updateTimeFromCoords = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const dx = clientX - centerX;
    const dy = clientY - centerY;

    let angle = Math.atan2(dy, dx);
    if (angle < 0) angle += 2 * Math.PI;

    let pct = (-angle / (2 * Math.PI)) * 100; //angle negative to correct for direction
    pct = (100 - pct + 25) % 100;

    let newTime = Math.round((pct / 100) * totalTime);
    newTime = Math.round(newTime / 600) * 600; //round to nearest 10 minutes
    newTime = Math.max(600, Math.min(newTime, totalTime)); //clamp between 10 minutes and 3 hours

    setTimeLeft(newTime);
    selectedDurationRef.current = newTime;
  };

  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isRunningLocal) {
      setIsDragging(true);
      updateTimeFromCoords(event.clientX, event.clientY);
    }
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && !isRunningLocal) {
      updateTimeFromCoords(event.clientX, event.clientY);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile drag support
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isRunningLocal && event.touches.length > 0) {
      event.preventDefault();
      setIsDragging(true);
      const touch = event.touches[0];
      updateTimeFromCoords(touch.clientX, touch.clientY);
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (isDragging && !isRunningLocal && event.touches.length > 0) {
      event.preventDefault();
      const touch = event.touches[0];
      updateTimeFromCoords(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (isDragging && !isRunningLocal && svgRef.current) {
        updateTimeFromCoords(e.clientX, e.clientY);
      }
    };
    const handleGlobalTouchEnd = () => setIsDragging(false);
    const handleGlobalTouchMove = (e: TouchEvent) => {
      if (isDragging && !isRunningLocal && svgRef.current && e.touches.length > 0) {
        e.preventDefault();
        updateTimeFromCoords(e.touches[0].clientX, e.touches[0].clientY);
      }
    };

    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('touchend', handleGlobalTouchEnd);
    document.addEventListener('touchmove', handleGlobalTouchMove, { passive: false });

    return () => {
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('touchend', handleGlobalTouchEnd);
      document.removeEventListener('touchmove', handleGlobalTouchMove);
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
  <div className="h-full w-full flex flex-col items-center justify-center select-none text-white overflow-y-auto py-4 md:py-0">
    <div className="flex flex-col items-center w-full gap-6">
      {/* Timer circle */}
      <div
        className="relative w-52 h-52 md:w-60 md:h-60 shrink-0 touch-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg className="w-full h-full transform -rotate-90 cursor-pointer" viewBox="0 0 240 240" ref={svgRef}>
          <circle
            cx="120"
            cy="120"
            r="118"
            stroke="#e3ffed"
            opacity={0.3}
            strokeWidth="5"
            fill="transparent"
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
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-bold">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col items-center w-full max-w-[350px]">
        <div className="mb-4 w-[40%]">
          {isRunningLocal ? (
            <AlertDialog open={showAlert} onOpenChange={setShowAlert}>
              <AlertDialogTrigger asChild>
                <Button
                  onClick={handleStop}
                  className="bg-red-600 w-full hover:bg-red-500 text-white"
                  id = "stopButton"
                  >
                  Give up
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-white/30 backdrop:blur-md text-white border-none">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure you want to stop the timer?</AlertDialogTitle>
                  <AlertDialogDescription className="text-gray-900">
                    Keep pushing and reach your goal!
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className = "bg-gray-900 text-white hover:bg-gray-900 hover:text-white border-none" onClick={() => setShowAlert(false)}>Keep going</AlertDialogCancel>
                  <AlertDialogAction className = "bg-white text-gray-900 hover:bg-white hover:text-gray-900 border-none" onClick={confirmStop}>Give up</AlertDialogAction>
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
              className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed text-gray-900 dark:text-gray-500' : 'bg-white/30 backdrop-blur-md'} border-none`}
            >
              <SelectValue placeholder="Timer" />
            </SelectTrigger>
            <SelectContent className="bg-white/20 text-white backdrop-blur-md">
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
              className={`w-full ${isRunningLocal ? 'opacity-50 cursor-not-allowed text-gray-900 dark:text-gray-500' : 'bg-white/30 backdrop-blur-md'} border-none`}
            >
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
      </div>
    </div>
  </div>
  
);

};

export default Timer;