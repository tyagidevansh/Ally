'use client'

import Navbar from "@/components/navbar";
import Stopwatch from "@/components/stopwatch";

const Home = async () => {
  return (
    <div className="h-full bg-zinc-900">
      <Navbar/>
      <div>
        <Stopwatch/>
      </div>
    </div>
  );
}
 
export default Home