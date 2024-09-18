'use client'

import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/navbar";
import Stopwatch from "@/components/stopwatch";
import Timer from "@/components/timer";
import Pomodoro from "@/components/pomodoro";
import MusicPlayer from "@/components/music-player";
import Slider from "react-slick";
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import useTimerStore from "@/store/timerStore";
import { useTimerCommunication } from "@/lib/timer-communication";

type Environment = {
  image: string;
  music: string;
  name: string; 
};

const environments: Environment[] = [
  {image: "https://media.giphy.com/media/3diu2dFNpV8AnozJ3V/giphy.gif", music: "rUxyKA_-grg", name: "Dusk"},
  {image: "https://media.giphy.com/media/Basrh159dGwKY/giphy.gif", music: "S_MOd40zlYU", name: "Dark ambience"},
  {image: "https://media.giphy.com/media/xWMPYx55WNhX136T0V/giphy.gif", music: "S_MOd40zlYU", name: "Sunrise"},
  {image: "https://media.giphy.com/media/6GazCZqvW67VPN5SEd/giphy.gif", music: "S_MOd40zlYU", name: "Dawn"},
  {image: "https://media.giphy.com/media/pVGsAWjzvXcZW4ZBTE/giphy.gif", music: "S_MOd40zlYU", name: "number 5"},
  {image: "https://media.giphy.com/media/5e25aUTZPcI94uMZgv/giphy.gif", music: "S_MOd40zlYU", name: "Sunrise"},
  {image: "https://media.giphy.com/media/5ngV4MB0UnYc2loCHT/giphy.gif", music: "S_MOd40zlYU", name: "Sunrise"},

];

const Home = () => {
  const [selectedComponent, setSelectedComponent] = useState("Timer");
  const [quote, setQuote] = useState("");
  const [currentEnv, setCurrentEnv] = useState<Environment>(environments[0]);
  const sliderRef = useRef<any>(null);
  const { setRunningCount, setIsRunning } = useTimerStore() as { setRunningCount: (value: number) => void, setIsRunning: (value: boolean) => void };
  const {isRunning, runningCount, broadcastTimerUpdate} = useTimerCommunication();

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    afterChange: (index: number) => setCurrentEnv(environments[index]),
    arrows: false,
    fade: true,
  };

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

  useEffect(() => {
    getRandomQuote();
  }, []);

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
    <div className="h-screen flex flex-col relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Slider ref= {sliderRef} {...settings}>
          {environments.map((env, index) => (
            <div key={index} className="h-screen">
              <div 
                className="absolute inset-0" 
                style={{
                  backgroundImage: `url('${env.image}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                }}
              ></div>
            </div>
          ))}
        </Slider>
      </div>

      <div className="absolute inset-0 bg-black opacity-50 z-10"></div>

      <div className="relative z-20 flex flex-col h-full">
        <Navbar />
        
        <div className="flex-1 grid grid-cols-10 gap-6 p-4">
          <div className="col-span-3 row-auto ml-10 mt-16 bg-white/10 rounded-xl backdrop-blur-md">
            {renderComponent()}
          </div>
          <div className="col-span-2 order-2 ml-10 mt-10 p-4">
            <MusicPlayer videoId={currentEnv.music} title = {currentEnv.name}/>
            <div className="flex flex-row justify-end m-2 ">
              <Button onClick={() => sliderRef.current.slickPrev()} className="bg-white/10 backdrop-blur-md text-white hover:bg-white/30">
                <ChevronLeft/>
              </Button>
              <Button onClick={() => sliderRef.current.slickNext()} className="ml-2 bg-white/10 backdrop-blur-md text-white hover:bg-white/30">
                <ChevronRight/>
              </Button>
            </div>

          </div>
          <div className="col-span-5 mt-auto ml-36 p-4">
            <p className="text-white text-center text-xl">"{quote}"</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;