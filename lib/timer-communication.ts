/**
 * Cross-tab communication for focus sessions.
 * Uses BroadcastChannel to notify other tabs of session lifecycle events.
 * On receiving a message, automatically syncs Zustand isRunning from localStorage.
 */

import { getSession } from '@/lib/focus-session';

export type TimerMessage =
  | { type: 'session-started' }
  | { type: 'session-stopped' }
  | { type: 'session-saved' }
  | { type: 'session-paused' }
  | { type: 'session-resumed' };

const TIMER_CHANNEL = 'timer-channel';

class TimerCommunication {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(msg: TimerMessage) => void> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.channel = new BroadcastChannel(TIMER_CHANNEL);
      this.channel.onmessage = (event: MessageEvent) => {
        const msg = event.data as TimerMessage;
        this.listeners.forEach(fn => fn(msg));

        // Re-dispatch as a window event so the dashboard (and any other
        // page listening on 'timer-saved') knows to re-fetch its data.
        if (msg.type === 'session-saved' || msg.type === 'session-stopped') {
          window.dispatchEvent(new Event('timer-saved'));
        }
      };
    }
  }

  broadcast(msg: TimerMessage) {
    this.channel?.postMessage(msg);
    // Also fire locally — BroadcastChannel doesn't echo to the sender tab,
    // so listeners on this same page won't hear it otherwise.
    if (typeof window !== 'undefined' && (msg.type === 'session-saved' || msg.type === 'session-stopped')) {
      window.dispatchEvent(new Event('timer-saved'));
    }
  }

  subscribe(fn: (msg: TimerMessage) => void): () => void {
    this.listeners.add(fn);
    return () => { this.listeners.delete(fn); };
  }
}

export const timerComm = new TimerCommunication();

/**
 * React hook for components that need to broadcast session events.
 * Also returns a helper to check if a session is active.
 */
export function useTimerBroadcast() {
  return {
    broadcast: timerComm.broadcast.bind(timerComm),
    subscribe: timerComm.subscribe.bind(timerComm),
    hasActiveSession: () => getSession() !== null,
  };
}