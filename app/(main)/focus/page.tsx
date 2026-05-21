'use client'

import { useEffect, useRef, useState } from "react";
import { getSession } from "@/lib/focus-session";
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

type Environment = {
  image: string;
  music: string;
  name: string; 
};

//persist the state of activity between reloads
//notifications for pomodoro and stopwatch
//is there a max time for stopwatch?

const environments: Environment[] = [
  {image: "https://media.giphy.com/media/3diu2dFNpV8AnozJ3V/giphy.gif", music: "S_MOd40zlYU", name: "Dusk"},
  {image: "https://media.giphy.com/media/Basrh159dGwKY/giphy.gif", music: "Saj2lY-zPl4", name: "Nightfall"},
  {image: "https://media.giphy.com/media/xWMPYx55WNhX136T0V/giphy.gif", music: "5jaT_8hy3Vg", name: "Sunrise"},
  {image: "https://media.giphy.com/media/6GazCZqvW67VPN5SEd/giphy.gif", music: "2jhs18qEtnE", name: "Dawn"},
  {image: "https://media.giphy.com/media/pVGsAWjzvXcZW4ZBTE/giphy.gif", music: "d2VdpHxmbPE", name: "Rain"},
  {image: "https://media.giphy.com/media/5e25aUTZPcI94uMZgv/giphy.gif", music: "4xDzrJKXOOY", name: "Punk"},
  {image: "https://media.giphy.com/media/5ngV4MB0UnYc2loCHT/giphy.gif", music: "UO-8am5GWoI", name: "Snowfall"},

];

const Home = () => {
  const [selectedComponent, setSelectedComponent] = useState<string>(() => {
    const session = getSession();
    return session?.type ?? "Stopwatch";
  });
  const [quote, setQuote] = useState("");
  const [currentEnv, setCurrentEnv] = useState<Environment>(environments[0]);
  const sliderRef = useRef<any>(null);

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
    <div className="h-[100dvh] flex flex-col relative overflow-hidden">
      {/* Background slider */}
      <div className="absolute inset-0 z-0">
        <Slider ref={sliderRef} {...settings}>
          {environments.map((env, index) => (
            <div key={index} className="h-[100dvh]">
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
      <div className="absolute inset-0 bg-black opacity-20 z-10"></div>

      {/* Main content layer */}
      <div className="relative z-20 flex flex-col h-full">
        <Navbar showToggle={false} linksInNewTab={true} />
        
        <div className="flex-1 min-h-0 flex flex-col md:grid md:grid-cols-10 px-4 pt-14 pb-2 md:py-4">
          
          {/* Desktop: column acts as flex container to vertically center the panel. 
               The panel itself is auto-height so the dark box wraps content tightly. */}
          <div className="md:col-span-3 flex-1 min-h-0 md:flex md:flex-col md:justify-center md:ml-10 md:mt-0 overflow-hidden">
            <div className="md:bg-white/10 rounded-xl md:backdrop-blur-md md:py-8">
              {renderComponent()}
            </div>
          </div>

          <div className="hidden md:flex col-span-5 items-end justify-center pb-6">
            <p className="text-white text-center text-xl italic opacity-90">"{quote}"</p>
          </div>
          
          {/* Music / environment controls */}
          <div className="flex-shrink-0 py-2 md:py-0 md:col-span-2 md:flex md:items-start md:justify-end md:mt-16 md:mr-4">
            <div className="flex flex-row items-center justify-center gap-4">
              <Button 
                onClick={() => sliderRef.current.slickPrev()} 
                className="bg-white/10 backdrop-blur-md text-white hover:bg-white/30 h-12 w-12 flex items-center justify-center"
              >
                <ChevronLeft />
              </Button>
              
              <div className="w-24 min-w-24">
                <MusicPlayer videoId={currentEnv.music} title={currentEnv.name} />
              </div>
                       
              <Button 
                onClick={() => sliderRef.current.slickNext()} 
                className="bg-white/10 backdrop-blur-md text-white hover:bg-white/30 h-12 w-12 flex items-center justify-center"
              >
                <ChevronRight />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;