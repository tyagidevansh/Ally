import React, { useEffect, useState, useRef } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TimerProps {
  onChangeTimer: (value: string) => void;
}

const Timer: React.FC<TimerProps> = ({ onChangeTimer }) => {
  const totalTime = 10800; // 180 minutes in seconds
  const [timeLeft, setTimeLeft] = useState(60);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const startTimer = () => setIsRunning(true);
  const stopTimer = () => setIsRunning(false);
  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(600);
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

    let percentage = (-angle / (2 * Math.PI)) * 100;
    percentage = (100 - percentage + 25) % 100;

    let newTime = Math.round((percentage / 100) * totalTime);
    newTime = Math.round(newTime / 600) * 600; // Round to nearest 10 minutes
    newTime = Math.max(600, Math.min(newTime, totalTime)); // Clamp between 10 minutes and 3 hours

    setTimeLeft(newTime);
  };

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    console.log("use effect called");
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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen select-none">
      <div className="relative w-60 h-60"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onClick={() => console.log("SVG clicked!")}
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
      <div className="mt-4">
        <button onClick={startTimer} className="px-4 py-2 bg-green-600 text-white rounded mr-2">Start</button>
        <button onClick={stopTimer} className="px-4 py-2 bg-red-500 text-white rounded mr-2">Stop</button>
        <button onClick={resetTimer} className="px-4 py-2 bg-blue-500 text-white rounded">Reset</button>
      </div>
      <div className="mt-3 w-[50%]">
        <Select onValueChange={onChangeTimer}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Change type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Stopwatch">Stopwatch</SelectItem>
            <SelectItem value="Timer">Timer</SelectItem>
            <SelectItem value="Pomodoro">Pomodoro</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default Timer;
