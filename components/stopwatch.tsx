import { useEffect, useState } from "react";
import { Button } from "./ui/button";

const Stopwatch = () => {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;
    if (isRunning) {
      intervalId = setInterval(() => {
        setTime(prevTime => prevTime + 1);
      }, 1000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isRunning]);

  const seconds = Math.floor((time % 60));
  const minutes = Math.floor((time % 3600) / 60); 
  const hours = Math.floor(time / 3600);

  let timeString = '';

  if (hours > 0) {
    timeString += `${hours}:`;
  }
  
  if (minutes > 0 || hours > 0) {
    timeString += `${minutes.toString().padStart(2, "0")}:`;
  }

  timeString += seconds.toString().padStart(2, "0");

  return ( 
    <div>
      <div>
      {timeString}
      </div>
      <div>
        <Button 
          onClick={() => setIsRunning(!isRunning)}
          className="bg-green-500"
        >
          {isRunning ? 'Stop' : 'Start'}
        </Button>
        <Button onClick={() => setTime(0)} className="bg-red-600">
          Reset
        </Button>
      </div>
    </div>
  );
};
 
export default Stopwatch;
