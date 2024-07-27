'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Stopwatch from "@/components/stopwatch";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Timer from "@/components/timer";
import Pomodoro from "@/components/pomodoro";

const Home = () => {
  const [selectedComponent, setSelectedComponent] = useState("Stopwatch");

  const renderComponent = () => {
    switch(selectedComponent) {
      case "Stopwatch":
        return <Stopwatch/>;
      case "Timer":
        return <Timer/>;
      case "Pomodoro":
        return <Pomodoro/>;
      default:
        return <Stopwatch/>;
    }
  };


  return (
    <div className="h-screen bg-zinc-900 flex flex-col">
      <Navbar />
      <div className="flex-1 grid grid-cols-4 grid-rows-2">
        <div className="col-span-1 row-span-1 border border-white order-1">
          Component 1
        </div>
        <div className="col-span-1 row-span-1 border border-white order-3">
          Component 2
        </div>

        <div className="col-span-2 row-span-2 border border-white order-2">
          <Select onValueChange={(value) => setSelectedComponent(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Change timer" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Stopwatch">Stopwatch</SelectItem>
              <SelectItem value="Timer">Timer</SelectItem>
              <SelectItem value="Pomodoro">Pomodoro</SelectItem>
            </SelectContent>
          </Select>

          {renderComponent()}

        </div>

        <div className="col-span-1 row-span-1 border border-white order-4">
          Component 4
        </div>
        <div className="col-span-1 row-span-1 border border-white order-5">
          Component 5
        </div>
      </div>
    </div>
  );
};

export default Home;
