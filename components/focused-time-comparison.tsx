'use client';

import { useEffect, useState } from 'react';

interface FocusTimeData {
  currentMonth: {
    total: number;
    expectedTotal: number;
  };
  previousMonth: {
    total: number;
    timeAtCurrentDay: number;
  };
  twoMonthsAgo: {
    total: number;
    timeAtCurrentDay: number;
  };
}

const FocusTrend = () => {
  const [focusData, setFocusData] = useState<FocusTimeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/focused-time-comparison');
        const data = await res.json();
        setFocusData(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching focus trend data:', error);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!focusData) {
    return <div>Error loading data.</div>;
  }

  const { currentMonth, previousMonth, twoMonthsAgo } = focusData;

  const largestTotal = Math.max(
    currentMonth.total,
    previousMonth.total,
    twoMonthsAgo.total,
    currentMonth.expectedTotal
  );

  const currentMonthPercent = (currentMonth.total / largestTotal) * 100;
  const previousMonthPercent = (previousMonth.total / largestTotal) * 100;
  const previousMonthAtCurrentDayPercent = (previousMonth.timeAtCurrentDay / largestTotal) * 100;
  const twoMonthsAgoPercent = (twoMonthsAgo.total / largestTotal) * 100;
  const twoMonthsAgoAtCurrentDayPercent = (twoMonthsAgo.timeAtCurrentDay / largestTotal) * 100;

  return (
    <div className="bg-transparent rounded-lg h-full flex flex-col" style={{ maxHeight: 'calc(100vh / 3)' }}>
      <h2 className="text-xl font-bold text-green-500 mb-2">Focus Trend</h2>
      <div className="space-y-3">
        <div className="text-white text-sm">
          <p className="mb-1">This Month</p>
          <div className="relative w-full h-4 bg-gray-700 rounded-lg">
            <div className="absolute top-0 left-0 h-4 bg-green-500 rounded-lg" style={{ width: `${currentMonthPercent}%` }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <p>So far: {Math.round(currentMonth.total)} min</p>
            <p>Expected: {Math.round(currentMonth.expectedTotal)} min</p>
          </div>
        </div>

        <div className="text-white text-sm">
          <p className="mb-1">Previous Month</p>
          <div className="relative w-full h-4 bg-gray-700 rounded-lg">
            <div className="absolute top-0 left-0 h-4 bg-green-500 rounded-lg" style={{ width: `${previousMonthPercent}%` }} />
            <div className="absolute top-0 h-4 bg-white rounded-full" style={{ left: `${previousMonthAtCurrentDayPercent}%`, width: '8px', height: '8px', transform: 'translateY(50%) translateX(-50%)' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <p>By this day: {Math.round(previousMonth.timeAtCurrentDay)} min</p>
            <p>Total: {Math.round(previousMonth.total)} min</p>
          </div>
        </div>

        <div className="text-white text-sm">
          <p className="mb-1">Two Months Ago</p>
          <div className="relative w-full h-4 bg-gray-700 rounded-lg">
            <div className="absolute top-0 left-0 h-4 bg-gray-500 rounded-lg" style={{ width: `${twoMonthsAgoPercent}%` }} />
            <div className="absolute top-0 h-4 bg-white rounded-full" style={{ left: `${twoMonthsAgoAtCurrentDayPercent}%`, width: '8px', height: '8px', transform: 'translateY(50%) translateX(-50%)' }} />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <p>By this day: {Math.round(twoMonthsAgo.timeAtCurrentDay)} min</p>
            <p>Total: {Math.round(twoMonthsAgo.total)} min</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTrend;