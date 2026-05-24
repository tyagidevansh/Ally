'use client';

import { Flame } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface StreakData {
  currentStreak: number;
  bestStreak: number;
  streakStartDate: number;
  streakLastDate: number;
  todayTime: number;
  dailyGoal: number;
  allHabitsDone: boolean;
  todayHabitCount: number;
  completedHabitCount: number;
}

const CurrentStreak = () => {
  const { data: streakData, isLoading } = useQuery<StreakData>({
    queryKey: ['streak'],
    queryFn: async () => {
      const res = await fetch('/api/current-streak');
      if (!res.ok) throw new Error('Failed to fetch streak data');
      return res.json();
    },
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      timeZone: 'UTC',
    });
  };

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-gray-500 animate-pulse text-sm">Loading streak...</div>
      </div>
    );
  }

  const currentStreak = streakData?.currentStreak ?? 0;
  const bestStreak    = streakData?.bestStreak    ?? 0;

  return (
    <div className="h-full w-full">
      <div className="text-xl text-green-500 font-bold mb-2">Goal Streak</div>

      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-2">
          <Flame
            className="w-14 h-14"
            style={{ color: currentStreak > 0 ? '#f97316' : '#4b5563' }}
          />
        </div>

        <div className="flex flex-col items-center mb-2">
          <div className="text-5xl font-bold text-white">{currentStreak}</div>
          <div className="text-sm font-bold text-gray-300 mt-1">Day Streak</div>
        </div>

        {currentStreak > 0 && (
          <p className="text-gray-500 text-sm">
            {formatDate(streakData?.streakStartDate ?? 0)} – {formatDate(streakData?.streakLastDate ?? 0)}
          </p>
        )}

        <p className="mt-3 text-white font-medium">
          Longest Streak: {bestStreak}
        </p>

        {/* {streakData && streakData.todayTime < streakData.dailyGoal && (
          <p className="mt-2 text-xs text-gray-500">
            {Math.max(0, Math.round(streakData.dailyGoal - streakData.todayTime))} min focus remaining today
          </p>
        )} */}
      </div>
    </div>
  );
};

export default CurrentStreak;