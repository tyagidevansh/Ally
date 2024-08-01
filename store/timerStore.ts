import { create } from "zustand"

const useTimerStore = create((set) => ({
  isRunning: false,
  setIsRunning: (value: boolean) => set({isRunning: value}),
}))

export default useTimerStore