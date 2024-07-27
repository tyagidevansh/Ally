import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "./ui/button";
import axios from "axios";

const Stopwatch = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const startTimeRef = useRef<number | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const formatTime = (time: number) => {
    const hours = Math.floor(time / 3600000);
    const minutes = Math.floor((time % 3600000) / 60000);
    const seconds = Math.floor((time % 60000) / 1000);

   if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  } else if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  } else {
    return `${seconds}`;
  }

    // return `${hours > 0 ? `${hours}:` : ""}${minutes
    //   .toString()
    //   .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  const updateTimer = useCallback(() => {
    if (startTimeRef.current !== null) {
      const elapsedTime = Date.now() - startTimeRef.current;
      setElapsedTime(elapsedTime);
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  }, []);

  const startTimer = useCallback(() => {
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
          activity: "study",
        });
        console.log("Timer log saved:", response.data);
      } catch (error) {
        console.error("Error saving timer log:", error);
      }
      setElapsedTime(0);
      startTimeRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div className="relative h-full flex flex-col items-center">
      <div className="absolute top-3/4 -translate-y-full">
        <div className="flex flex-col items-center justify-center w-60 h-60 border-4 border-green-500 rounded-full">
          <div className="text-4xl">{formatTime(elapsedTime)}</div>
        </div>
        <div className="mt-4 flex justify-center">
          <Button
            onClick={isRunning ? stopTimer : startTimer}
            className={isRunning ? "bg-red-500" : "bg-green-500"}
          >
            {isRunning ? "Stop" : "Start"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Stopwatch;
