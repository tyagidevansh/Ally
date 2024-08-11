import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { ModeToggle } from '@/components/mode-toggle';
import useTimerStore from '@/store/timerStore'
import { Timer, TimerOff, BarChart2, BookOpen, Dumbbell, PenTool } from 'lucide-react';
import { useEffect, useState } from 'react';

const Navbar = () => {
  const { isRunning } = useTimerStore() as { isRunning: boolean };
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [scrolled]);

  return (
    <div>
    <nav className={`flex fixed top-0 left-0 right-0 mb-20 items-center justify-between p-4 bg-transparent text-white
      ${scrolled ? 'bg-purple-900/70 backdrop-blur-md shadow-lg' : 'bg-transparent'}
    "`}>
      <div className="flex items-center space-x-6">
        <Link href="/" className="hover:opacity-80 transition-opacity">
          <div className="relative w-16 h-10">
            <Image
              src="/logo-light.png"
              alt="Ally Logo"
              layout="fill"
              className="block"
            />
          </div>
        </Link>
        
        <Link href="/dashboard" className="flex items-center space-x-1 hover:text-green-400 transition-colors">
          <BarChart2 size={18} />
          <span>Dashboard</span>
        </Link>
        <Link href="/study" className="flex items-center space-x-1 hover:text-green-400 transition-colors">
          <BookOpen size={18} />
          <span>Study</span>
        </Link>
        <Link href="/workout" className="flex items-center space-x-1 hover:text-green-400 transition-colors">
          <Dumbbell size={18} />
          <span>Workout</span>
        </Link>
        <Link href="/journal" className="flex items-center space-x-1 hover:text-green-400 transition-colors">
          <PenTool size={18} />
          <span>Journal</span>
        </Link>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="text-green-400">
          {isRunning ? <Timer size={24} /> : <TimerOff size={24} />}
        </div>
        <ModeToggle />
        <UserButton />
      </div>
    </nav>
    <div className="h-7"></div>
    </div>
  );
};

export default Navbar;