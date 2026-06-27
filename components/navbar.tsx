import Link from "next/link";
import Image from "next/image";
import { UserButton } from "@clerk/nextjs";
import {
  Timer,
  TimerOff,
  BarChart2,
  BookOpen,
  Pencil,
  PenTool,
  Menu,
  User,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  getElapsedMs,
  getTimerRemainingSecs,
  getSession,
} from "@/lib/focus-session";
import useTimerStore from "@/store/timerStore";
import { timerComm } from "@/lib/timer-communication";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { ModeToggle } from "./mode-toggle";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import axios from "axios";

interface NavbarProps {
  showToggle: boolean;
  linksInNewTab?: boolean;
}

const Navbar = ({ showToggle, linksInNewTab }: NavbarProps) => {
  const [isClient, setIsClient] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditUsernameOpen, setIsEditUsernameOpen] = useState(false);
  const [username, setUsername] = useState("");
  const [liveTime, setLiveTime] = useState("");
  const [isHovered, setIsHovered] = useState(false);
  const tickRef = useRef<number | null>(null);
  const { isRunning, setIsRunning, syncFromSession } = useTimerStore();
  const { theme } = useTheme();

  // Format elapsed ms → "1:23:45" or "12:34"
  const formatElapsed = (ms: number) => {
    const totalSecs = Math.floor(ms / 1000);
    const h = Math.floor(totalSecs / 3600);
    const m = Math.floor((totalSecs % 3600) / 60);
    const s = totalSecs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Format remaining secs → "1:23:45" or "12:34"
  const formatRemaining = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0)
      return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  // Handle username change
  const handleUsernameChange = async () => {
    try {
      await axios.patch("/api/profile", {
        username,
      });

      setIsEditUsernameOpen(false);
    } catch (error) {
      console.error(error);
    }
  };

  const computeLiveTime = () => {
    const session = getSession();
    if (!session) return "";
    if (session.type === "Stopwatch") {
      return formatElapsed(getElapsedMs(session));
    }
    if (session.type === "Timer") {
      return formatRemaining(getTimerRemainingSecs(session));
    }
    // Pomodoro: no reliable remaining time without the library — show elapsed in session
    return formatElapsed(getElapsedMs(session));
  };

  useEffect(() => {
    setIsClient(true);
    syncFromSession();

    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) setScrolled(isScrolled);
    };

    window.addEventListener("scroll", handleScroll);

    // BroadcastChannel: fast same-origin signal when timer changes
    const unsub = timerComm.subscribe(() => {
      syncFromSession();
    });

    // storage event: reliable cross-tab fallback — fires in OTHER tabs
    // whenever localStorage changes, no subscription timing issues
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "ally-focus-session") {
        syncFromSession();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("storage", handleStorage);
      unsub();
    };
  }, [scrolled]); // eslint-disable-line react-hooks/exhaustive-deps

  // Tick the live time every second, only while running
  useEffect(() => {
    if (!isRunning) {
      setLiveTime("");
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
      return;
    }
    // Compute immediately so there's no 1-second blank
    setLiveTime(computeLiveTime());
    tickRef.current = window.setInterval(() => {
      setLiveTime(computeLiveTime());
    }, 1000);
    return () => {
      if (tickRef.current !== null) {
        clearInterval(tickRef.current);
        tickRef.current = null;
      }
    };
  }, [isRunning]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync isFocusing status to the server
  useEffect(() => {
    const syncFocusStatus = async () => {
      try {
        await axios.put("/api/profile/focus", { isFocusing: isRunning });
      } catch (error) {
        console.error("Failed to sync focus status:", error);
      }
    };
    syncFocusStatus();
  }, [isRunning]);

  const getLogoSrc = () => {
    if (showToggle) {
      return theme === "dark" ? "/logo-dark.png" : "/logo-light.png";
    } else {
      return "/logo-dark.png";
    }
  };

  return (
    <div>
      <nav
        className={`flex fixed z-10 top-0 left-0 right-0 mb-20 items-center justify-between p-4 ${
          scrolled ? "bg-white/10 backdrop-blur-md shadow-lg" : "bg-transparent"
        } ${showToggle ? "text-gray-900 dark:text-white" : "text-white"}`}
      >
        <div className="flex items-center relative z-20">
          <button
            className="md:hidden p-2 z-20"
            onClick={(e) => {
              e.stopPropagation();
              setIsDropdownOpen((prev) => !prev);
            }}
          >
            <Menu size={24} />
          </button>

          <Link
            href="/"
            className="hover:opacity-80 transition-opacity"
            target={isRunning || linksInNewTab ? "_blank" : "_self"}
            rel={isRunning || linksInNewTab ? "noopener noreferrer" : undefined}
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
            <Link
              href="/dashboard"
              className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <BarChart2 size={18} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/focus"
              className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <BookOpen size={18} />
              <span>Focus</span>
            </Link>
            <Link
              href="/journal"
              className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
            >
              <PenTool size={18} />
              <span>Journal</span>
            </Link>
          </div>
        </div>

        <div className="flex items-center space-x-4 relative">
          {isClient && (
            <div
              className="text-green-600 dark:text-green-400 relative"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
            >
              {isRunning ? (
                <div className="relative">
                  <Timer size={24} />
                  <span
                    className="absolute top-7 right-0 w-3 h-3 bg-red-500 dark:bg-red-500 rounded-full border-2 border-white dark:border-gray-900"
                    style={{ transform: "translate(50%, -50%)" }}
                  />
                </div>
              ) : (
                <TimerOff size={24} />
              )}

              {/* Tooltip */}
              {isHovered && (
                <div
                  className="absolute right-0 top-8 z-50 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap pointer-events-none
                  bg-gray-900/90 text-white dark:bg-white/90 dark:text-gray-900
                  shadow-lg backdrop-blur-sm"
                >
                  {isRunning && liveTime ? liveTime : "No timers running"}
                </div>
              )}
            </div>
          )}

          {showToggle && <ModeToggle />}
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Action
                label="Edit display name"
                labelIcon={<Pencil />}
                onClick={() => setIsEditUsernameOpen(true)}
              />
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </nav>

      {isDropdownOpen && (
        <div
          className={`fixed top-16 left-0 z-30 bg-white/20 backdrop-blur-md rounded-lg shadow-lg p-4 space-y-4 ${
            showToggle ? "text-black" : "text-white"
          } dark:text-white`}
        >
          <Link
            href="/dashboard"
            className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <BarChart2 size={18} />
            <span>Dashboard</span>
          </Link>
          <Link
            href="/focus"
            className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <BookOpen size={18} />
            <span>Focus</span>
          </Link>
          <Link
            href="/journal"
            className="flex items-center space-x-1 hover:text-green-600 dark:hover:text-green-400 transition-colors"
          >
            <PenTool size={18} />
            <span>Journal</span>
          </Link>
        </div>
      )}

      <Dialog open={isEditUsernameOpen} onOpenChange={setIsEditUsernameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Display Name</DialogTitle>

            <DialogDescription>Pick a new display name.</DialogDescription>
          </DialogHeader>

          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditUsernameOpen(false)}
            >
              Cancel
            </Button>

            <Button onClick={handleUsernameChange}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="h-7"></div>
    </div>
  );
};

export default Navbar;
