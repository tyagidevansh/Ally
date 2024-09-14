'use client'

import Navbar from "@/components/navbar";
import { useEffect, useState } from "react";
import { ReactNode } from "react";
import Graph from "@/components/graph";

const DashboardBox = ({ children, className = ""}: { children: ReactNode, className?: string }) => (
  <div className={`border border-gray-700 rounded-lg p-4 transition-all duration-300 hover:bg-gray-900 hover:border-green-500 ${className}`}>
    {children}
  </div>
);

const dashboard = () => {

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <Navbar/>  
      <div className="container mx-auto p-4 grid grid-cols-4 gap-4 mt-10"> 
      
        <DashboardBox className="col-span-3 row-span-2">
          <Graph/>
        </DashboardBox>

        <DashboardBox className="col-span-1 row-span-4">
          sidebar
        </DashboardBox>

        <DashboardBox className="col-span-1 row-span-1">
          bottom element 1
        </DashboardBox>

        <DashboardBox className="col-span-1 row-span-1">
          bottom element 2
        </DashboardBox>

        <DashboardBox className="col-span-1 row-span-1">
          bottom element 3
        </DashboardBox>

      </div>  
      
    </div>
  )
}

export default dashboard;