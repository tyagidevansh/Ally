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

const DashboardBox = ({ children, className = "", style }: { children: ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div className={`border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900 hover:border-green-500 ${className}`} style={style}>
    {children}
  </div>
);

const Dashboard = () => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleTimerSaved = () => {
      queryClient.invalidateQueries({ queryKey: ['recent-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['graph'] });
      queryClient.invalidateQueries({ queryKey: ['focused-trends'] });
      queryClient.invalidateQueries({ queryKey: ['comparison'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    };

    window.addEventListener('timer-saved', handleTimerSaved);
    return () => window.removeEventListener('timer-saved', handleTimerSaved);
  }, [queryClient]);

  return (
    <div className="w-full min-h-fit bg-gradient-to-b from-black to-gray-900 text-white">
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
