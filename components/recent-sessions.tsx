'use client';

import { PlusCircle, Clock, Tag, LoaderCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
  tag?: string;
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
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const minuteRef = useRef<HTMLInputElement>(null);
  const hourRef = useRef<HTMLInputElement>(null);
  const secondRef = useRef<HTMLInputElement>(null);
  const [newDuration, setNewDuration] = useState<number>(30);
  const [error, setError] = useState<String>("");
  const [activity, setActivity] = useState("Study");

  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isSavingTag, setIsSavingTag] = useState(false);

  const { data: sessions = [], isLoading: loading } = useQuery<Session[]>({
    queryKey: ['recent-sessions'],
    queryFn: async () => {
      const res = await fetch('/api/recent-times');
      const data = await res.json();
      if (data.success) return data.logs;
      return [];
    },
  });

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
    setIsSavingLog(true);
    try {
      const response = await axios.post("/api/timer-log", {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        duration: Number(newDuration) * 60000,
        activity,
      });
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['focused-trends'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      setOpen(false);
    } catch (error) {
      //console.error("Error saving timer log:", error);
    } finally {
      setIsSavingLog(false);
    }
  };

  const handleSaveTag = async () => {
    if (!selectedSessionId) return;
    setIsSavingTag(true);
    try {
      await axios.put('/api/timer-log/tag', {
        id: selectedSessionId,
        tag: tagInput,
      });
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      setTagModalOpen(false);
      setTagInput("");
    } catch (error) {
      console.error("Error saving tag:", error);
    } finally {
      setIsSavingTag(false);
    }
  };

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="h-full w-full flex flex-col" style={{ maxHeight: 'calc(100vh / 3)' }}>
      <div className="flex flex-row justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-green-500">Recent Sessions</h2>
        
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
                disabled = {error.length > 0 || isSavingLog}
              >
                {isSavingLog ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : null}
                Add Log
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>

      <div className="space-y-3 custom-scrollbar overflow-y-auto pr-2 flex-1 min-h-0 relative">
        {sessions.length === 0 ? (
          <p className="text-white">No recent sessions available.</p>
        ) : (
          sessions.map((session) => (
            <div 
              key={session.id} 
              className="bg-black p-3 rounded-md relative group flex flex-col transition-colors hover:bg-gray-700"
              title={session.tag ? `Tag: ${session.tag}` : undefined}
            >
              <div className="flex justify-between items-center">
                <div className="text-white flex gap-2 items-center">
                  <p>{session.activity}</p>
                  {/* Tag button that appears on hover */}
                  <button 
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 bg-gray-800 rounded-md hover:bg-gray-700 text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedSessionId(session.id);
                      setTagInput(session.tag || "");
                      setTagModalOpen(true);
                    }}
                  >
                    <Tag className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-sm text-gray-400">
                  {new Date(session.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} - 
                  {new Date(session.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
                </span>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <p className="text-white">
                  {formatTime(session.duration)}
                </p>
                <span className="text-sm text-gray-400">
                  {new Date(session.startTime).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}
                </span>
              </div>

              {session.tag && (
                <p className="text-xs text-green-400 mt-2 truncate w-full">
                  #{session.tag}
                </p>
              )}


            </div>
          ))
        )}
      </div>

      <Dialog open={tagModalOpen} onOpenChange={setTagModalOpen}>
        <DialogContent className="bg-gray-950 text-white shadow-lg border border-gray-700 rounded-lg sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-green-500 text-xl">Tag Session</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="tag" className="block text-sm font-medium text-gray-100 mb-2">
              Write a few words about what you did
            </Label>
            <input
              id="tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="w-full bg-gray-800 text-white border border-gray-600 rounded-md p-2"
              placeholder="e.g. Next.js bug fixing"
              autoFocus
              maxLength={40}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTag();
              }}
            />
          </div>
          <DialogFooter>
            <Button className="bg-gray-700 text-white border border-gray-600 hover:bg-gray-600" onClick={() => setTagModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="bg-green-600 text-white border border-green-500 hover:bg-green-500"
              onClick={handleSaveTag}
              disabled={isSavingTag}
            >
              {isSavingTag ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : null}
              Save Tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RecentSessions;