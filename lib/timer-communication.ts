import useTimerStore from '@/store/timerStore';

const TIMER_CHANNEL = 'timer-channel';

class TimerCommunication {
  private channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel(TIMER_CHANNEL);
    this.channel.onmessage = this.handleMessage;
  }

  private handleMessage = (event: MessageEvent) => {
  const { type, data } = event.data;
  if (type === 'timer-update') {
    const { isRunning, displayTime, startTime, runningCount } = data;
    useTimerStore.getState().setIsRunning(isRunning);
    useTimerStore.getState().setDisplayTime(displayTime);
    useTimerStore.getState().setStartTime(startTime);
    useTimerStore.getState().setRunningCount(runningCount);  
  }
};


  broadcastTimerUpdate() {
    const { isRunning, displayTime, startTime, runningCount } = useTimerStore.getState();
    this.channel.postMessage({
      type: 'timer-update',
      data: { isRunning, displayTime, startTime, runningCount },
    });
  }
}

export const timerCommunication = new TimerCommunication();

export function useTimerCommunication() {
  const isRunning = useTimerStore((state) => state.isRunning);
  const displayTime = useTimerStore((state) => state.displayTime);
  const startTime = useTimerStore((state) => state.startTime);
  const runningCount = useTimerStore((state) => state.runningCount);

  return {
    isRunning,
    displayTime,
    startTime,
    runningCount,
    broadcastTimerUpdate: timerCommunication.broadcastTimerUpdate.bind(timerCommunication),
  };
}