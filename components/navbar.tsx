import Link from 'next/link';
import Image from 'next/image';
import { UserButton } from '@clerk/nextjs';
import { Timer, TimerOff, BarChart2, BookOpen, Dumbbell, PenTool } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTimerCommunication } from '@/lib/timer-communication';
import { ModeToggle } from './mode-toggle';

interface NavbarProps {
  showToggle: boolean;
}

const Navbar = ({ showToggle }: NavbarProps) => {
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { isRunning, runningCount } = useTimerCommunication();

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
    return document.body.classList.contains('dark') ? '/logo-light.png' : '/logo-dark.png';
  };

  return (
    <div>
      <nav
        className={`flex fixed z-10 top-0 left-0 right-0 mb-20 items-center justify-between p-4 text-gray-900 dark:text-white ${
          scrolled ? 'bg-white/10 backdrop-blur-md shadow-lg' : 'bg-transparent'
        }`}
      >
        <div className="flex items-center space-x-6">
          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            target={runningCount > 0 ? '_blank' : '_self'}
            rel={runningCount > 0 ? 'noopener noreferrer' : undefined}
          >
            <div className="relative w-16 h-10">
              <Image
                src={getLogoSrc()} 
                alt="Ally Logo"
                layout="fill"
                className="block"
              />
            </div>
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            target={runningCount > 0 ? '_blank' : '_self'}
            rel={runningCount > 0 ? 'noopener noreferrer' : undefined}
          >
            <BarChart2 size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/focus"
            className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            target={runningCount > 0 ? '_blank' : '_self'}
            rel={runningCount > 0 ? 'noopener noreferrer' : undefined}
          >
            <BookOpen size={18} />
            <span>Focus</span>
          </Link>
          <Link
            href="/journal"
            className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            target={runningCount > 0 ? '_blank' : '_self'}
            rel={runningCount > 0 ? 'noopener noreferrer' : undefined}
          >
            <PenTool size={18} />
            <span>Journal</span>
          </Link>
        </div>
        <div className="flex items-center space-x-4 relative">
          {isClient && (
            <div
              className="text-green-600 dark:text-green-400 relative"
              title={`${runningCount} timer${runningCount === 1 ? '' : 's'} running`}
            >
              {runningCount > 0 ? (
                <>
                  <Timer size={24} />
                  <span
                    className="absolute top-5 right-0 w-3 h-3 bg-red-500 dark:bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
                    style={{ transform: 'translate(50%, -50%)' }}
                  />
                </>
              ) : (
                <TimerOff size={24} />
              )}
            </div>
          )}

          {showToggle && <ModeToggle />}
          <UserButton />
        </div>
      </nav>
      <div className="h-7"></div>
    </div>
  );
};

export default Navbar;
