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
import { useTimerCommunication } from "@/lib/timer-communication";

interface StopwatchProps {
  autoStart?: boolean;
  onChangeTimer: (value: string) => void;
  initialActivity?: string;
}

const Stopwatch = ({ autoStart = false, onChangeTimer, initialActivity = "Study"  }: StopwatchProps) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showAlert, setShowAlert] = useState(false);
  const [activity, setActivity] = useState(initialActivity);

  const [studyTimeToday, setStudyTimeToday] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const router = useRouter();
  const { isRunning, setIsRunning, runningCount, setRunningCount } = useTimerStore();
  const { broadcastTimerUpdate } = useTimerCommunication();
  const [isRunningLocal, setIsRunningLocal] = useState(false);


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
    setIsRunningLocal(true);
    const currentRunningCount = useTimerStore.getState().runningCount;
    setRunningCount(currentRunningCount + 1);
    setIsRunning(true);
    broadcastTimerUpdate();
    intervalRef.current = window.setInterval(() => {
      updateTimer();
      document.title = `${formatTime(Date.now() - startTime)} | Ally`;
    }, 1000);
  }, [setIsRunning, setRunningCount, broadcastTimerUpdate]);

  const stopTimer = useCallback(async () => {
  if (startTimeRef.current !== null) {
    const button = document.getElementById("stopButton");
    if (button) {
      button.innerText = "Saving...";
    }
    const endTime = Date.now();
    const duration = endTime - startTimeRef.current;

    const currentRunningCount = useTimerStore.getState().runningCount;
    setRunningCount(Math.max(0, currentRunningCount - 1)); 

    broadcastTimerUpdate();

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

    setIsRunningLocal(false);
    setElapsedTime(0);
    startTimeRef.current = null;
    document.title = "Ally";
    router.refresh();
    fetchTodayStudyTime();
  }
}, [router, activity, setRunningCount, broadcastTimerUpdate]);

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
  }, [isRunning]);

  useEffect(() => {
    console.log(activity);
  }, [activity]);

  return (
    <div className="relative h-full w-full min-w-fit flex flex-col items-center select-none text-white">
      <div className="absolute top-[10%] flex flex-col items-center w-full">
        <div className="flex flex-col items-center justify-center w-60 h-60 border-[5px] border-green-500 rounded-full mb-8">
          <div className="text-4xl">{formatTime(elapsedTime)}</div>
        </div>
        
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
              
              <div className="text-zinc-100 mt-12 text-center text-lg">
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
