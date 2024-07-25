'use client'

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/navbar";
import { ArrowRight } from "lucide-react";

const Home = () => {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  const handleClick = () => {
    if (isSignedIn) {
      router.push('/home');
    } else {
      router.push('/sign-in');
    }
  }

  return ( 
    <div className="bg-zinc-900 h-full">
      <Navbar/>
      <div className="text-6xl font-bold text-center justify-center p-9 mt-24 text-white">
        Achieve a little more everyday <br></br>
        with your own <span className="text-green-500">Ally</span>
      </div>
      <div className="text-2xl text-center justify-center text-white">
        Use Ally to track your life's stats and level up!
      </div>
      <div className="p-6 m-5 justify-center text-center">
        <Button onClick={handleClick} className="bg-green-500 font-bold">
          {isSignedIn ? "Go to Dashboard" : "Join Ally"}
          <ArrowRight className="ml-2 h-[20px]"/>
        </Button>
      </div>
      
    </div>
  );
}
 
export default Home;