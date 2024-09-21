import { useEffect, useState } from "react";

interface streakData {
  streakStartDate: number;
  streakLastDate: number;
  bestStreak: number;
  todayTime : number;
  yesterdayTime : number;
}

const CurrentStreak = () => {
  const [streakData, setStreakData] = useState<streakData | null>(null);
  const [loaing, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/current-streak');
        const data = await res.json();
        setStreakData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching focus trend data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() =>{console.log("streak data", streakData);}, [streakData]);

  return ( 
    <div>
      hi
    </div>
  );
}
export default CurrentStreak;