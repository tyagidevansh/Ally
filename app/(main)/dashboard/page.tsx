'use client'

import Navbar from "@/components/navbar";
import { Bar, BarChart } from "recharts"
 
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import { Button } from "@/components/ui/button";
import axios from "axios";

const chartData = [
  { month: "January", desktop: 186, mobile: 80 },
  { month: "February", desktop: 305, mobile: 200 },
  { month: "March", desktop: 237, mobile: 120 },
  { month: "April", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "June", desktop: 214, mobile: 140 },
]
 
const chartConfig = {
  desktop: {
    label: "Desktop",
    color: "#2563eb",
  },
  mobile: {
    label: "Mobile",
    color: "#60a5fa",
  },
} satisfies ChartConfig

const handleClick = async () => {
  try {
    const response = await axios.get("/api/graphs", {
      params: {
        startTime: new Date("Septemeber 12, 2024 00:00:00").toISOString(),
        endTime: new Date("Septemeber 14, 2024 11:59:59").toISOString(),
      }    
    });
    console.log(response.data);
  } catch (error) {
    console.log("graph api handle click error", error);
  }
}

const dashboard = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-gray-900 text-white">
      <Navbar/>  
      <div className="h-[300px] w-[200px]">
      <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
        <BarChart accessibilityLayer data={chartData}>
          <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
          <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
        </BarChart>
      </ChartContainer>
      </div>  
      
      <div>
        <Button onClick={handleClick}>send request</Button>
      </div>

    </div>
  )
}

export default dashboard;