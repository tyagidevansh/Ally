'use client';

import Navbar from "@/components/navbar";
import { ReactNode, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import Graph from "@/components/graph";
import RecentSessions from "@/components/recent-sessions";
import FocusTrend from "@/components/focused-time-comparison";
import CurrentStreak from "@/components/current-streak";
import BestHours from "@/components/best-hours";
import HabitBuilder from "@/components/todo";
import FriendsStats from "@/components/friends-stats";
import CheerSneerPopup from "@/components/cheer-sneer-popup";
import { useState } from "react";

const DashboardBox = ({ children, className = "", style }: { children: ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div className={`border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900 hover:border-green-500 ${className}`} style={style}>
    {children}
  </div>
);

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [cheers, setCheers] = useState<any[]>([]);

  const fetchCheers = async () => {
    try {
      const res = await fetch('/api/friends/cheer');
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCheers(data);
          
          // Mark them as seen in the background
          await fetch('/api/friends/cheer', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: data.map((c: any) => c.id) })
          });
        }
      }
    } catch (err) {
      console.error("Failed to fetch cheers", err);
    }
  };

  useEffect(() => {
    fetchCheers();
  }, []);

  useEffect(() => {
    const handleTimerSaved = async () => {
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['focused-trends'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });

      fetchCheers();
    };

    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [queryClient]);

  return (
    <div className="w-full min-h-fit bg-gradient-to-b from-black to-gray-900 text-white relative">
      {cheers.length > 0 && (
        <CheerSneerPopup 
          cheers={cheers} 
          onDismiss={() => setCheers([])} 
        />
      )}

      <Navbar showToggle={false} />
      <div className="container mx-auto p-2 md:p-4 mt-10">
        <div className="grid md:grid-cols-[2fr,1fr] md:grid-rows-3 gap-4">
          {/* Graph — now visible on all screens. On mobile, horizontally scrollable. */}
          <DashboardBox className="md:row-span-2 overflow-x-auto" style={{ minHeight: '70vh' }}>
            <div className="min-w-[600px] md:min-w-0 h-full">
              <Graph />
            </div>
          </DashboardBox>

          <div className="flex flex-col gap-4 md:row-span-3 w-full">
            <DashboardBox className="w-full">
              <FocusTrend />
            </DashboardBox>

            <DashboardBox className="w-full overflow-hidden" style={{ maxHeight: '40vh' }}>
              <FriendsStats />
            </DashboardBox>

            <DashboardBox className="w-full flex-1 min-h-[30vh] overflow-hidden" style={{ maxHeight: '45vh' }}>
              <HabitBuilder />
            </DashboardBox>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:row-span-1">
            <DashboardBox className="w-full h-full">
              <RecentSessions />
            </DashboardBox>
            <DashboardBox className="w-full h-full">
              <BestHours />
            </DashboardBox>
            <DashboardBox className="w-full h-full">
              <CurrentStreak />
            </DashboardBox>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
