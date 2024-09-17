'use client'

import Navbar from "@/components/navbar";
import { useEffect, useState } from "react";
import { ReactNode } from "react";
import Graph from "@/components/graph";

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
          Stats maybe? <br />
          Day total (up/down) <br />
          Week total <br />
          Month total so far <br />
          Streak of hitting daily goal <br />
        </DashboardBox>

        <DashboardBox className="row-span-2">
          To do list
        </DashboardBox>

        <div className="grid grid-cols-3 gap-4 row-span-1">
          <DashboardBox>
            Recent sessions?
          </DashboardBox>
          <DashboardBox>
            Calendar?
          </DashboardBox>
          <DashboardBox>
            Coins/points/month leaderboard?
          </DashboardBox>
        </div>

      </div>
    </div>

  )
}

export default dashboard;