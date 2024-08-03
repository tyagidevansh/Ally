import { create } from "zustand"

const useTimerStore = create((set) => ({
  isRunning: false,
  setIsRunning: (value: boolean) => set({isRunning: value}),
  displayTime: 0,
  setDisplayTime: (value: number) => set({displayTime: value}),
}))

export default useTimerStore