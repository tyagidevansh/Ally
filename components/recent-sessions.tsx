'use client';

import { PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Button } from './ui/button';

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

  if (loading) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div className="h-full w-full custom-scrollbar overflow-y-auto" style={{ maxHeight: 'calc(100vh / 3)' }}>
      <div className="flex flex-row justify-between items-center">
        <h2 className="text-xl font-bold mb-4 text-green-500">Recent Sessions</h2>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <button className="text-green-500 cursor-pointer">
              <PlusCircle />
            </button>
          </DialogTrigger>
          
          <DialogContent className='bg-gray-950 text-white'>
            <DialogHeader>
              <DialogTitle className='text-green-500'>Add New Log</DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-100">Activity</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Study">Study</SelectItem>
                    <SelectItem value="Reading">Reading</SelectItem>
                    <SelectItem value="Coding">Coding</SelectItem>
                    <SelectItem value="Meditation">Meditation</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100">Start Time</label>
                <input type="time" className="w-full border border-gray-300 rounded-md p-2" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-100">Duration (in minutes)</label>
                <input type="number" className="w-full border border-gray-300 rounded-md p-2" placeholder="Enter duration in minutes" />
              </div>
            </div>

            <DialogFooter>
              <Button onClick={() => setOpen(false)}>Cancel</Button>
              <Button>Add Session</Button>
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