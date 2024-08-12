'use client'

import { use, useState } from "react";
import Navbar from "@/components/navbar";
import Stopwatch from "@/components/stopwatch";
import Timer from "@/components/timer";
import Pomodoro from "@/components/pomodoro";

const Home = () => {
  const [selectedComponent, setSelectedComponent] = useState("Stopwatch");
  const [quote, setQuote] = useState("");

  const quotes = [
    "The future depends on what you do today",
    "The only way to achieve the impossible is to believe it is possible",
    "Push yourself, because no one else is going to do it for you",
    "Success is not final, failure is not fatal",
    "You don't have to be great to start, but you have to start to be great",
    "Don't limit your challenges. Challenge your limits",
    "Small daily improvements over time lead to stunning results"
  ];

  const getRandomQuote = () => {
    const randomQuote = Math.floor(Math.random() * quotes.length);
    setQuote(quotes[randomQuote]);
  };

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
    getRandomQuote();
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      <div 
        className="absolute inset-0 z-0" 
        style={{
          backgroundImage: "url('https://media.giphy.com/media/Basrh159dGwKY/giphy.gif')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      ></div>

      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

      <div className="relative z-20 flex flex-row h-full">
        <Navbar />
        
        <div className="flex-1 grid grid-cols-10 grid-rows-6 mt-5">
          <div className="col-span-3 row-span-5 order-1 ml-5 mt-8 bg-white/10 rounded-xl backdrop-blur-md">
            {renderComponent()}
          </div>
          <div className="col-span-2 row-span-1 order-2 bg-white/10 rounded-xl">
            {quote}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

