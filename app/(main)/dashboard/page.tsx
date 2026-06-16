"use client";

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

const DashboardBox = ({
  children,
  className = "",
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) => (
  <div
    className={`border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900 hover:border-green-500 ${className}`}
    style={style}
  >
    {children}
  </div>
);

const Dashboard = () => {
  const queryClient = useQueryClient();
  const [cheers, setCheers] = useState<any[]>([]);

  const fetchCheers = async () => {
    try {
      const res = await fetch("/api/friends/cheer");
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0) {
          setCheers(data);

          // Mark them as seen in the background
          await fetch("/api/friends/cheer", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ids: data.map((c: any) => c.id) }),
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
      queryClient.invalidateQueries({ queryKey: ["recent-sessions"] });
      queryClient.invalidateQueries({ queryKey: ["graph"] });
      queryClient.invalidateQueries({ queryKey: ["focused-trends"] });
      queryClient.invalidateQueries({ queryKey: ["comparison"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });

      fetchCheers();
    };

    window.addEventListener("timer-saved", handleTimerSaved);
    return () => window.removeEventListener("timer-saved", handleTimerSaved);
  }, [queryClient]);

  return (
    <div className="w-full min-h-fit bg-gradient-to-b from-black to-gray-900 text-white relative">
      {cheers.length > 0 && (
        <CheerSneerPopup cheers={cheers} onDismiss={() => setCheers([])} />
      )}

      <Navbar showToggle={false} />
      <div className="container mx-auto p-2 md:p-4 mt-10">
        <div className="grid grid-cols-1 md:grid-cols-[2fr,1fr] md:grid-rows-[85vh_auto] gap-4">
          {/* Row 1, Col 1 — Graph */}
          <DashboardBox className="overflow-x-auto h-full min-h-[400px] md:min-h-0">
            <div className="min-w-[600px] md:min-w-0 h-full">
              <Graph />
            </div>
          </DashboardBox>

          {/* Row 1, Col 2 — FocusTrend + FriendsStats stacked, same height as graph */}
          <div className="flex flex-col gap-4 h-full md:overflow-hidden">
            <DashboardBox className="w-full flex-shrink-0 min-h-[300px] md:min-h-0">
              <FocusTrend />
            </DashboardBox>
            <DashboardBox className="w-full flex-1 min-h-[400px] max-h-[400px] md:max-h-none md:min-h-0 md:overflow-hidden">
              <FriendsStats />
            </DashboardBox>
          </div>

          {/* Row 2, Col 1 — 3 stat boxes, pinned height */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:h-[280px]">
            <DashboardBox className="w-full md:h-full overflow-hidden min-h-[250px] max-h-[350px] md:max-h-none md:min-h-0">
              <RecentSessions />
            </DashboardBox>
            <DashboardBox className="w-full md:h-full overflow-hidden min-h-[250px] max-h-[350px] md:max-h-none md:min-h-0">
              <BestHours />
            </DashboardBox>
            <DashboardBox className="w-full md:h-full overflow-hidden min-h-[250px] max-h-[350px] md:max-h-none md:min-h-0">
              <CurrentStreak />
            </DashboardBox>
          </div>

          {/* Row 2, Col 2 — Daily Goals, same pinned height */}
          <DashboardBox className="w-full overflow-hidden md:h-[280px] min-h-[350px] md:min-h-0">
            <HabitBuilder />
          </DashboardBox>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
