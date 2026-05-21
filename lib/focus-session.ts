/**
 * Focus Session — single source of truth for active timer/stopwatch/pomodoro state.
 * Stored in localStorage so it survives page refreshes and is shared across tabs.
 */

const STORAGE_KEY = 'ally-focus-session';
const MAX_SESSION_AGE_MS = 5 * 60 * 60 * 1000; // 5 hours — auto-discard stale sessions

export type FocusSessionType = 'Stopwatch' | 'Timer' | 'Pomodoro';

export interface FocusSession {
  type: FocusSessionType;
  startedAt: number;           // Date.now() when session began
  activity: string;

  // Timer-specific
  timerDurationSecs?: number;  // total seconds the user selected

  // Pomodoro-specific
  pomodoroIntervalStart?: number; // start of current work interval (wall-clock)

  // Pause state
  isPaused: boolean;
  pausedAt?: number | null;
  totalPausedMs: number;
}

export function getSession(): FocusSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const session: FocusSession = JSON.parse(raw);
    // Self-healing: discard sessions older than MAX_SESSION_AGE_MS
    if (Date.now() - session.startedAt > MAX_SESSION_AGE_MS) {
      clearSession();
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: FocusSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

/** Get elapsed milliseconds for the session, accounting for pauses. */
export function getElapsedMs(session: FocusSession): number {
  if (session.isPaused && session.pausedAt) {
    return session.pausedAt - session.startedAt - session.totalPausedMs;
  }
  return Date.now() - session.startedAt - session.totalPausedMs;
}

/** For Timer: get remaining milliseconds. Returns 0 if expired. */
export function getTimerRemainingMs(session: FocusSession): number {
  if (!session.timerDurationSecs) return 0;
  const elapsed = getElapsedMs(session);
  return Math.max(0, session.timerDurationSecs * 1000 - elapsed);
}

/** For Timer: get remaining seconds (rounded down). */
export function getTimerRemainingSecs(session: FocusSession): number {
  return Math.floor(getTimerRemainingMs(session) / 1000);
}
