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
        console.log(data);
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

  const currentMonthPercent = (currentMonth.total / currentMonth.expectedTotal) * 100;
  
  const previousMonthPercent = (previousMonth.total / currentMonth.expectedTotal) * 100;
  const previousMonthAtCurrentDayPercent = (previousMonth.timeAtCurrentDay / currentMonth.expectedTotal) * 100;

  const twoMonthsAgoPercent = (twoMonthsAgo.total / currentMonth.expectedTotal) * 100;
  const twoMonthsAgoAtCurrentDayPercent = (twoMonthsAgo.timeAtCurrentDay / currentMonth.expectedTotal) * 100;

  return (
    <div className="bg-black p-4 rounded-lg overflow-hidden h-full flex flex-col">
      <h2 className="text-xl text-white mb-4">Focus Trend</h2>
      <div className="space-y-4">
        <div className="text-white">
          <p>Current Month</p>
          <div className="relative w-full h-4 bg-gray-700 rounded-lg">
            <div
              className="absolute top-0 left-0 h-4 bg-green-500 rounded-lg"
              style={{ width: `${currentMonthPercent}%` }}
            />
            <p className="absolute top-1/2 transform -translate-y-1/2 text-left ml-2 text-xs text-gray-900">
              So far: {Math.round(currentMonth.total)} min
            </p>
            <p className="absolute top-1/2 transform -translate-y-1/2 right-0 text-xs text-gray-400">
              Expected: {Math.round(currentMonth.expectedTotal)} min
            </p>
          </div>
        </div>

        <div className="text-white">
          <p>Previous Month</p>
          <div className="relative w-full h-4 bg-gray-700 rounded-lg">
            <div
              className="absolute top-0 left-0 h-4 bg-gray-500 rounded-lg"
              style={{ width: `${previousMonthPercent}%` }}
            />
            <div
              className="absolute top-0 h-4 bg-green-400 rounded-full"
              style={{ left: `${previousMonthAtCurrentDayPercent}%`, width: '4px' }}
            />
            <p className="absolute top-1/2 transform -translate-y-1/2 right-0 text-xs text-gray-400">
              Total: {Math.round(previousMonth.total)} min
            </p>
          </div>
        </div>

        <div className="text-white">
          <p>Two Months Ago</p>
          <div className="relative w-full h-4 bg-gray-700 rounded-lg">
            <div
              className="absolute top-0 left-0 h-4 bg-gray-500 rounded-lg"
              style={{ width: `${twoMonthsAgoPercent}%` }}
            />
            <div
              className="absolute top-0 h-4 bg-green-400 rounded-full"
              style={{ left: `${twoMonthsAgoAtCurrentDayPercent}%`, width: '4px' }}
            />
            <p className="absolute top-1/2 transform -translate-y-1/2 right-0 text-xs text-gray-400">
              Total: {Math.round(twoMonthsAgo.total)} min
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FocusTrend;
