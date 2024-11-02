import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { Timer, TimerOff, BarChart2, BookOpen, PenTool, Menu } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTimerCommunication } from '@/lib/timer-communication';
import useTimerStore from "@/store/timerStore";
import { ModeToggle } from './mode-toggle';
import { useTheme } from 'next-themes';
import { Button } from './ui/button';

interface NavbarProps {
  showToggle: boolean;
}

const Navbar = ({ showToggle }: NavbarProps) => {
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isRunning, runningCount, broadcastTimerUpdate } = useTimerCommunication();
  const {setRunningCount} = useTimerStore();
  const { theme } = useTheme();

  useEffect(() => {
    setIsClient(true);

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

  const getLogoSrc = () => {
    if (showToggle) {
      return theme === 'dark' ? '/logo-dark.png' : '/logo-light.png';
    } else {
      return '/logo-dark.png'
    }
    
  };

  return (
    <div>
      <nav
        className={`flex fixed z-10 top-0 left-0 right-0 mb-20 items-center justify-between p-4 ${
          scrolled ? 'bg-white/10 backdrop-blur-md shadow-lg' : 'bg-transparent'
        } ${showToggle ? 'text-gray-900 dark:text-white' : 'text-white'}`}
      >
        <div className="flex items-center relative z-20">
          <button
            className="md:hidden p-2 z-20"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen((prev) => !prev)
            }}
          >
            <Menu size={24} />
          </button>

          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            target={runningCount > 0 ? '_blank' : '_self'}
            rel={runningCount > 0 ? 'noopener noreferrer' : undefined}
          >
            <div className="relative w-16 h-10 md:mr-6">
              <Image
                src={getLogoSrc()} 
                alt="Ally Logo"
                layout="fill"
                className="block"
              />
            </div>
          </Link>

          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <BarChart2 size={18} />
              <span>Dashboard</span>
            </Link>
            <Link href="/focus" className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <BookOpen size={18} />
              <span>Focus</span>
            </Link>
            <Link href="/journal" className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
              <PenTool size={18} />
              <span>Journal</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4 relative">
          {isClient && (
            <div
              className="text-green-600 dark:text-green-400 relative"
              title={`${runningCount} timer${runningCount === 1 ? '' : 's'} running.\nClick to reset count to 0 \n(without stopping any timers)`}
            >
              {runningCount > 0 ? (
                <Button 
                  className='text-green-600 p-0 bg-transparent'
                  onClick={() => {setRunningCount(0); broadcastTimerUpdate();}}
                >
                  <Timer size={24} />
                  <span className="absolute top-7 right-0 w-3 h-3 bg-red-500 dark:bg-red-500 rounded-full border-2 border-white dark:border-gray-900" style={{ transform: 'translate(50%, -50%)' }} />
                </Button>
              ) : (
                <TimerOff size={24} />
              )}
            </div>
          )}

          {showToggle && <ModeToggle />}
          <UserButton />
        </div>
      </nav>

      {isDropdownOpen && (
        <div
          className={`fixed top-16 left-0 z-30 bg-white/20 backdrop-blur-md rounded-lg shadow-lg p-4 space-y-4 ${
            showToggle ? 'text-black' : 'text-white'
          } dark:text-white`}
        >          
          <Link href="/dashboard" className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <BarChart2 size={18} />
            <span>Dashboard</span>
          </Link>
          <Link href="/focus" className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <BookOpen size={18} />
            <span>Focus</span>
          </Link>
          <Link href="/journal" className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors">
            <PenTool size={18} />
            <span>Journal</span>
          </Link>
        </div>
      )}

      <div className="h-7"></div>
    </div>
  );
};

export default Navbar;
