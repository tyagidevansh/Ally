import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
const Timer = require('timer-for-pomodoro');

interface TimerState {
  raw: number;
  minutes: number;
  seconds: number;
  rounds: number;
  status: 'work' | 'break';
}

const PomodoroComponent: React.FC = () => {
  const [timerState, setTimerState] = useState<TimerState | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [activity, setActivity] = useState("Study");
  const timerRef = useRef<typeof Timer | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const startTimeRef = useRef<number | null> (null);

  useEffect(() => {
    timerRef.current = new Timer(25, 5, 4);

    // Subscribe to timer events
    timerRef.current.subscribe((currentTime:any) => {
      setTimerState({
        raw: currentTime.timeRaw,
        minutes: currentTime.minutes,
        seconds: currentTime.seconds,
        rounds: currentTime.rounds,
        status: currentTime.status,
      });
    });

    // Start the timer
    //timerRef.current.start();

    return () => {
      // Cleanup: Stop the timer when the component unmounts
      timerRef.current?.stop();
    };
  }, []);

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

  const handleStart = () => {
    setIsRunning(true);
    timerRef.current.start();
    startTimeRef.current = Date.now();
  }

  const handleStop = async () => {
    setIsRunning(false);
    timerRef.current.stop();
    if (timerState?.status == "work") {
      const duration = (1500 - timerState?.raw) * 1000; //data stored in milliseconds
      const endTime = Date.now();
      try{
        const response = await axios.post("/api/timer-log", {
          startTime: new Date(startTimeRef.current ?? endTime).toISOString(),
          endTime: new Date(endTime).toISOString(),
          duration,
          activity,
        });
        console.log(response);
      } catch (error) {
        console.error("Error saving timer log: ", error);
      }
    } 
  }

  const percentage = (timerState?.raw / (timerState?.status === "work" ? 1500 : 300)) * 100;
  const circumference = 2 * Math.PI * 118;
  const offset = circumference - (percentage / 100) * circumference;


  return (
    <div className='relative h-full flex flex-col items-center select-none'>
      <div className='absolute top-[10%] flex flex-col items-center w-full'>
        <div className='relative w-60 h-60 mb-8'>
          <svg
            className='w-full h-full transform -rotate-90 cursor-pointer'
            ref = {svgRef}
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
            <div className='text-4xl font-bold mt-2'>{formatTime(timerState?.raw)}</div>
            <div className='text-2xl font-bold mt-2'>{timerState?.status == "work" ? "Focus" : "Break"}</div>
          </div>
        </div>

        <div className='flex flex-col items-center w-full max-w-[350px]'>
          <div className='mb-4 w-[40%] text-white'>
            <AnimatePresence mode='wait'>
              {!isRunning ? (
                <motion.div
                  key="start"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1}}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    onClick={() => handleStart()}
                  >
                    Start
                  </Button>

                </motion.div>
              ): (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.3 }}
                  className='flex justify-center items-center space-x-4'
                >
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleStop()}
                    className='p-2 bg-red-500 rounded-full text-white'
                  >

                  </motion.button>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>

      </div>

    </div>
  );
};

export default PomodoroComponent;
