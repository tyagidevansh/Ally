import { create } from "zustand";
import { getSession } from "@/lib/focus-session";

interface TimerStore {
  isRunning: boolean;
  setIsRunning: (value: boolean) => void;
  /** Re-derive isRunning from the localStorage focus session */
  syncFromSession: () => void;
}

const useTimerStore = create<TimerStore>()((set) => ({
  isRunning: false,
  setIsRunning: (value: boolean) => set({ isRunning: value }),
  syncFromSession: () => {
    const session = getSession();
    set({ isRunning: session !== null });
  },
}));

export default useTimerStore;