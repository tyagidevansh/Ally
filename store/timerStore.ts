import { create } from "zustand";
import { persist, StateStorage } from "zustand/middleware";

interface TimerStore {
  isRunning: boolean;
  setIsRunning: (value: boolean) => void;
  runningCount: number;
  setRunningCount: (value: number) => void;
  displayTime: number;
  setDisplayTime: (value: number) => void;
  startTime: number | null;
  setStartTime: (value: number | null) => void;
}

const useTimerStore = create<TimerStore>()(
  persist(
    (set) => ({
      isRunning: false,
      setIsRunning: (value: boolean) => set({ isRunning: value }),
      runningCount: 0,
      setRunningCount: (value: number) => set({ runningCount: Math.max(0, value) }),
      displayTime: 0,
      setDisplayTime: (value: number) => set({ displayTime: value }),
      startTime: null,
      setStartTime: (value: number | null) => set({ startTime: value }),
    }),
    {
      name: "timer-storage",
      getStorage: () => (typeof window !== "undefined" ? window.localStorage : undefined) as StateStorage,
    }
  )
);

export default useTimerStore;

//add functionality to click on the timer to make runningCount zero and have a dialog explain that