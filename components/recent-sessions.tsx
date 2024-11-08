'use client';

import { PlusCircle, Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from './ui/button';
import { Label } from "@/components/ui/label";
import { TimePickerInput } from "./time-picker-input";
import axios from 'axios';

interface Session {
  id: string;
  startTime: string;
  endTime: string;
  activity: string;
  duration: number;
}

const formatTime = (time: number) => {
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

const RecentSessions = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const minuteRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const [newDuration, setNewDuration] = useState<number>(30);
  const [error, setError] = useState<String>("");
  const [activity, setActivity] = useState("Study");

  useEffect(() => {
    const fetchRecentSessions = async () => {
      try {
        const res = await fetch('/api/recent-times');
        const data = await res.json();

        if (data.success) {
          setSessions(data.logs);
        }
      } catch (error) {
        console.error('Error fetching recent sessions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentSessions();
  }, []);

  const handleChange = (event: any) => {
    const value = event.target.value;

    if (value == "" || (Number(value)) >= 0 && (Number(value) <= 300)) {
      setError("");
      setNewDuration(value);
    } else {
      setError("Duration must be in between 0 and 300 minutes!");
    }
 
  };

  const constructStartTime = () => {
    const hours = parseInt(hourRef.current?.value || "0", 10);
    const minutes = parseInt(minuteRef.current?.value || "0", 10);
    const seconds = parseInt(secondRef.current?.value || "0", 10);
  
    const startTime = new Date();
    startTime.setHours(hours, minutes, seconds); // sets the milliseconds to 0
  
    return startTime;
  };
  

  const handleNewLog = async () => {
    const startTime = constructStartTime();
    const endTime = new Date(startTime.getTime() + newDuration * 60000); // Calculate end time
  
    try {
      const response = await axios.post("/api/timer-log", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: Number(newDuration) * 60000,
        activity,
      });
      console.log("Log saved successfully:", response.data);
      setOpen(false);
    } catch (error) {
      //console.error("Error saving timer log:", error);
    }
  };
  

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="h-full w-full custom-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(100vh / 3)' }}>
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-bold mb-4 text-green-500">Recent Sessions</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="text-green-500 cursor-pointer mb-3">
              <PlusCircle />
            </button>
          </DialogTrigger>

          <DialogContent className="bg-gray-950 text-white shadow-lg border border-gray-700 rounded-lg">
            <DialogHeader>
              <DialogTitle className="text-green-500 text-xl">Add New Log</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-100 mb-2">Activity</label>
                <Select
                  value = {activity}
                  onValueChange={(value) => setActivity(value)}
                >
                  <SelectTrigger className="bg-gray-800 text-white border border-gray-600 rounded-md">
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 text-white border border-gray-600 rounded-md">
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                    <SelectItem value="Meditation">Meditation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-row space-x-4">
                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-2">Start Time</label>
                  <div className="flex items-end gap-2">
                    <div className="grid gap-1 text-center">
                      <Label htmlFor="hours" className="text-xs text-gray-100">
                        Hours
                      </Label>
                      <TimePickerInput
                        picker="hours"
                        date={date}
                        setDate={setDate}
                        ref={hourRef}
                        onRightFocus={() => minuteRef.current?.focus()}
                        className="bg-gray-800 text-white border border-gray-600 rounded-md"
                      />
                    </div>
                    <div className="grid gap-1 text-center">
                      <Label htmlFor="minutes" className="text-xs text-gray-100">
                        Minutes
                      </Label>
                      <TimePickerInput
                        picker="minutes"
                        date={date}
                        setDate={setDate}
                        ref={minuteRef}
                        onLeftFocus={() => hourRef.current?.focus()}
                        onRightFocus={() => secondRef.current?.focus()}
                        className="bg-gray-800 text-white border border-gray-600 rounded-md"
                      />
                    </div>
                    <div className="grid gap-1 text-center">
                      <Label htmlFor="seconds" className="text-xs text-gray-100">
                        Seconds
                      </Label>
                      <TimePickerInput
                        picker="seconds"
                        date={date}
                        setDate={setDate}
                        ref={secondRef}
                        onLeftFocus={() => minuteRef.current?.focus()}
                        className="bg-gray-800 text-white border border-gray-600 rounded-md"
                      />
                    </div>
                    <div className="flex h-10 items-center">
                      <Clock className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-100 mb-1 md:mb-6">Duration (in minutes)</label>
                  <input
                    type="number"
                    value = {newDuration || ""}
                    onChange = {handleChange}
                    className="w-full bg-gray-800 text-white border border-gray-600 rounded-md p-2"
                    placeholder="Enter duration in minutes"
                  />
                  {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600 mt-2 md:mt-0" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="bg-green-600 text-white border border-green-500 hover:bg-green-500"
                onClick = {handleNewLog}  
                disabled = {error.length > 0}
              >
                Add Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      <div className="space-y-3">
        {sessions.length === 0 ? (
          <p className="text-white">No recent sessions available.</p>
        ) : (
          sessions.map((session) => (
            <div key={session.id} className="bg-black p-3 rounded-md">
            <p className="text-white flex justify-between">
              {session.activity}
              <span className="text-sm text-gray-400">
                {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - 
                {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
            </p>
            <p className="text-white flex justify-between">
              {formatTime(session.duration)}
              <span className="text-sm text-gray-400">
                {new Date(session.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
              </span>
            </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentSessions;