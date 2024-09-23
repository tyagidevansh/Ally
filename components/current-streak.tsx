import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface StreakData {
  streakStartDate: number;
  streakLastDate: number;
  bestStreak: number;
  todayTime: number;
  yesterdayTime: number;
  dailyGoal: number;
}

interface PostStreakData {
  streakStart?: number;
  streakLast?: number;
  bestStreak?: number;
}

const CurrentStreak = () => {
  const [streakData, setStreakData] = useState<StreakData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [currentStreak, setCurrentStreak] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/current-streak');
        const data: StreakData = await res.json();
        setStreakData(data);
        setLoading(false);
        calculateStreak(data);
      } catch (error) {
        console.error('Error fetching streak data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const calculateStreak = (data: StreakData) => {
    const { streakStartDate, streakLastDate, todayTime, dailyGoal, bestStreak } = data;
    const today = new Date().setHours(0, 0, 0, 0);
    const streakStart = new Date(streakStartDate).setHours(0, 0, 0, 0);
    const streakLast = new Date(streakLastDate).setHours(0, 0, 0, 0);

    let currentStreak = 0;

    if (streakStart === today && streakLast === today) {
      if (todayTime >= dailyGoal) {
        currentStreak = 1;
      }
    } 
    else {
      const daysBetween = Math.floor((today - streakStart) / (1000 * 60 * 60 * 24));
      currentStreak = daysBetween + 1;

      if (todayTime >= dailyGoal) {
        updateStreakData({
          streakLast: Date.now(),
        });
      }
    }

    setCurrentStreak(currentStreak);

    if (currentStreak > bestStreak) {
      updateStreakData({
        bestStreak: currentStreak,
        streakLast: Date.now(),
      });
    }
  };

  const updateStreakData = async (data: PostStreakData) => {
    try {
      const res = await fetch('/api/current-streak', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        throw new Error('Failed to update streak');
      }
    } catch (error) {
      console.error('Error updating streak data:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-full w-full" style={{ maxHeight: 'calc(100vh / 3)' }}>
      <div className="text-xl text-green-500 font-bold mb-2">Goal Streak</div>

      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center mb-2">
          <Flame className="text-orange-500 w-14 h-14" /> 
        </div>

        <div className="flex flex-col items-center mb-2">
          <div className="text-5xl font-bold text-white">{currentStreak}</div>
          <div className="text-sm font-bold text-gray-300 mt-1">Day Streak</div>
        </div>

        <p className="text-gray-500 text-sm">
          {formatDate(streakData?.streakStartDate || 0)} – {formatDate(streakData?.streakLastDate || 0)}
        </p>

        <p className="mt-3 text-white font-medium">
          Longest Streak: {Math.max(streakData?.bestStreak || 0, currentStreak)}
        </p>
      </div>
    </div>
  );
};

export default CurrentStreak;
