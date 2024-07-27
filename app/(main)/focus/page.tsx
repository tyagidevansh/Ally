"use client";

import Stopwatch from "@/components/stopwatch";

const Focus = () => {
  return (  
    <div className="h-screen bg-zinc-900 flex flex-col">
      <Stopwatch autoStart={true}/>
    </div>
  );
}
 
export default Focus;