'use client';

import Navbar from "@/components/navbar";
import { ReactNode, useEffect, useState } from "react";
import Graph from "@/components/graph";
import RecentSessions from "@/components/recent-sessions";
import FocusTrend from "@/components/focused-time-comparison";
import CurrentStreak from "@/components/current-streak";
import BestHours from "@/components/best-hours";
import ToDoList from "@/components/todo";
import { Smartphone } from "lucide-react";

const DashboardBox = ({ children, className = "", style }: { children: ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div className={`border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900 hover:border-green-500 ${className}`} style={style}>
    {children}
  </div>
);

const Dashboard = () => {
  return (
    <div className="w-full min-h-fit bg-gradient-to-b from-black to-gray-900 text-white min-w-fit">
      <Navbar showToggle={false} />
      <div className="container mx-auto p-2 md:p-4 mt-10">
        <div className="grid md:grid-cols-[2fr,1fr] md:grid-rows-3 gap-4">
          <DashboardBox className="hidden md:block row-span-2" style={{ minHeight: '75vh' }}>
            <Graph />
          </DashboardBox>

          <DashboardBox className="md:row-span-1 w-full min-h-[35vh]">
            <FocusTrend />
          </DashboardBox>

          <DashboardBox className="md:row-span-2 w-full max-h-[60vh] min-h-[35vh] md:max-h-none">
            <ToDoList />
          </DashboardBox>

          <div className="grid md:grid-cols-3 gap-4 md:row-span-1">
            <DashboardBox className="w-full min-h-[40vh]">
              <RecentSessions />
            </DashboardBox>
            <DashboardBox className="w-full min-h-[40vh]">
              <BestHours />
            </DashboardBox>
            <DashboardBox className="w-full min-h-[35vh]">
              <CurrentStreak />
            </DashboardBox>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
