'use client'

import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/navbar";
import Stopwatch from "@/components/stopwatch";
import Timer from "@/components/timer";
import Pomodoro from "@/components/pomodoro";

const Home = () => {
  const [selectedComponent, setSelectedComponent] = useState("Stopwatch");

  const renderComponent = () => {
    switch(selectedComponent) {
      case "Stopwatch":
        return <Stopwatch onChangeTimer={setSelectedComponent}/>;
      case "Timer":
        return <Timer onChangeTimer={setSelectedComponent}/>;
      case "Pomodoro":
        return <Pomodoro onChangeTimer={setSelectedComponent}/>;
      default:
        return <Stopwatch onChangeTimer={setSelectedComponent}/>;
    }
  };

  return (
    <div className="h-screen bg-zinc-50 dark:bg-zinc-900 flex flex-col">
      <Navbar />
      <div className="flex-1 grid grid-cols-4 grid-rows-2">
        <div className="col-span-1 row-span-1 border border-white order-1">
          To-do list
        </div>
        <div className="col-span-1 row-span-1 border border-white order-3">
          Journal
        </div>

        <div className="col-span-2 row-span-2 border border-white order-2">
          {renderComponent()}
          
        </div>

        <div className="col-span-1 row-span-1 border border-white order-4">
          Component 4
        </div>
        <div className="col-span-1 row-span-1 border border-white order-5">
          Last week's study graph
        </div>
      </div>
    </div>
  );
};

export default Home;