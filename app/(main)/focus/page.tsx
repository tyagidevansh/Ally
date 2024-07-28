'use client'

import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Stopwatch from "@/components/stopwatch";

const Focus = () => {
  const searchParams = useSearchParams();
  const initialActivity = searchParams.get('activity') || 'Study';

  return (  
    <div className="h-screen bg-zinc-900 flex flex-col">
      <Stopwatch 
        autoStart={true} 
        onChangeTimer={() => {}} 
        initialActivity={initialActivity}
      />
    </div>
  );
}
 
export default Focus;