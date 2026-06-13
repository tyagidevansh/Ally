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
  const [isInitialLoading, setIsInitialLoading] = useState(true);

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
    const fetchDashboardData = async () => {
      try {
        const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const res = await fetch(`/api/dashboard?timezone=${userTimeZone}`);
        if (res.ok) {
          const data = await res.json();
          
          // Seed the cache so child components render instantly without fetching
          queryClient.setQueryData(['streak'], data.streak);
          queryClient.setQueryData(['comparison'], data.comparison);
          queryClient.setQueryData(['focused-trends'], data.productiveHours);
          queryClient.setQueryData(['recent-sessions'], data.recentSessions);
          queryClient.setQueryData(['friends'], data.friendsStats);
          queryClient.setQueryData(['friendRequests'], data.friendRequests);
          queryClient.setQueryData(['todos'], data.todos);
          
          if (data.cheers && data.cheers.length > 0) {
            setCheers(data.cheers);
            await fetch('/api/friends/cheer', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ids: data.cheers.map((c: any) => c.id) })
            });
          }
        }
      } catch (err) {
        console.error("Failed to fetch consolidated dashboard data", err);
      } finally {
        setIsInitialLoading(false);
      }
    };

    fetchDashboardData();
  }, [queryClient]);

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

  if (isInitialLoading) {
    return (
      <div className="w-full min-h-screen bg-gradient-to-b from-black to-gray-900 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-green-500"></div>
      </div>
    );
  }

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
        <div className="grid md:grid-cols-[2fr,1fr] gap-4" style={{ gridTemplateRows: '85vh auto' }}>

          {/* Row 1, Col 1 — Graph */}
          <DashboardBox className="overflow-x-auto h-full">
            <div className="min-w-[600px] md:min-w-0 h-full">
              <Graph />
            </div>
          </DashboardBox>

          {/* Row 1, Col 2 — FocusTrend + FriendsStats stacked, same height as graph */}
          <div className="flex flex-col gap-4 h-full overflow-hidden">
            <DashboardBox className="w-full flex-shrink-0">
              <FocusTrend />
            </DashboardBox>
            <DashboardBox className="w-full flex-1 min-h-0 overflow-hidden">
              <FriendsStats />
            </DashboardBox>
          </div>

          {/* Row 2, Col 1 — 3 stat boxes, pinned height */}
          <div className="grid md:grid-cols-3 gap-4 h-[280px]">
            <DashboardBox className="w-full h-full overflow-hidden">
              <RecentSessions />
            </DashboardBox>
            <DashboardBox className="w-full h-full overflow-hidden">
              <BestHours />
            </DashboardBox>
            <DashboardBox className="w-full h-full overflow-hidden">
              <CurrentStreak />
            </DashboardBox>
          </div>

          {/* Row 2, Col 2 — Daily Goals, same pinned height */}
          <DashboardBox className="w-full overflow-hidden h-[280px]">
            <HabitBuilder />
          </DashboardBox>

        </div>
      </div>
    </div>
  );

}

export default Dashboard;
