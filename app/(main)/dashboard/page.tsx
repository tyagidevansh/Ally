'use client'

import Navbar from "@/components/navbar";
import { ReactNode, useEffect } from "react";
import Graph from "@/components/graph";
import RecentSessions from "@/components/recent-sessions";
import FocusTrend from "@/components/focused-time-comparison";
import CurrentStreak from "@/components/current-streak";
import BestHours from "@/components/best-hours";
import ToDoList from "@/components/todo";

const DashboardBox = ({ children, className = "", style }: { children: ReactNode, className?: string, style?: React.CSSProperties }) => (
  <div className={`border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900 hover:border-green-500 ${className}`} style={style}>
    {children}
  </div>
);

const dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <Navbar />
      <div className="container mx-auto p-4 grid grid-cols-[2fr,1fr] grid-rows-3 gap-4 mt-10">
        
        <DashboardBox className="row-span-2" style={{ minHeight: '75vh' }}>
          <Graph />
        </DashboardBox> 

        <DashboardBox className="row-span-1">
          <FocusTrend/>
        </DashboardBox>

        <DashboardBox className="row-span-2">
          <ToDoList/>
        </DashboardBox>

        <div className="grid grid-cols-3 gap-4 row-span-1">
          <DashboardBox>
            <RecentSessions/>
          </DashboardBox>
          <DashboardBox>
            <BestHours/>
          </DashboardBox>
          <DashboardBox>
            <CurrentStreak/>
          </DashboardBox>
        </div>

      </div>
    </div>

  )
}

export default dashboard;