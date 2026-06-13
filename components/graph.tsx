import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  ComposedChart,
  Line,
} from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";
import axios from "axios";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { LoaderCircle } from "lucide-react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";

import { addDays, format, setDate } from "date-fns";
import { Calendar as CalendarIcon, Minus, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

const chartConfig = {
  Study: {
    label: "Studying",
    color: "#22c55e",
  },
  Reading: {
    label: "Reading",
    color: "#fb7185",
  },
  Coding: {
    label: "Coding",
    color: "#3b82f6",
  },
  Meditation: {
    label: "Meditation",
    color: "#a855f7",
  },
  Other: {
    label: "Other",
    color: "#f59e0b",
  },
} satisfies ChartConfig;

const sampleGoalData = [
  {
    goal: 400,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 239,
  },
  {
    goal: 300,
  },
  {
    goal: 200,
  },
  {
    goal: 278,
  },
  {
    goal: 189,
  },
  {
    goal: 349,
  },
];

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  if (hours > 0) {
    return `${hours} hr ${minutes.toString().padStart(2, "0")} min ${seconds
      .toString()
      .padStart(2, "0")} sec`;
  } else if (minutes > 0) {
    return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`;
  } else {
    return `${seconds} sec`;
  }
};

const generateTicks = (maxValue: number) => {
  const tickIntervals = [
    300000, 600000, 900000, 1800000, 3600000, 5400000, 7200000, 9000000,
    10800000, 14400000, 18000000, 36000000, 54000000, 72000000, 90000000,
    108000000, 144000000, 18000000, 360000000,
  ]; // 5 min, 10 min, 15 min, 30 min, 1 hr, 1.5 hr, 2hr, 2.5hr, 3hr, 4hr, 5hr, 10, 15, 20, 25, 30, 40, 50, 100hr
  const ticks = [];

  for (
    let i = 0;
    i <= maxValue;
    i += tickIntervals.find((interval) => interval >= maxValue / 5)!
  ) {
    ticks.push(i);
  }

  return ticks;
};

const Graph = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [dropdownSelection, setDropdownSelection] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('ally-graph-range') || '30';
    }
    return '30';
  });
  const [byMonth, setByMonth] = useState<boolean>(false);
  const [dailyGoal, setDailyGoal] = useState<number>(180);

  // Initialize with UTC dates
  const now = new Date();
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(Date.UTC(2024, 8, 13, 0, 0, 0, 0)),
    to: new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        23,
        59,
        59,
        999
      )
    ),
  });

  // Memoized calculations
  const { maxTime, totalTime, ticks } = useMemo(() => {
    if (!chartData.length) return { maxTime: 0, totalTime: 0, ticks: [] };

    const max = Math.max(...chartData.map((data) => data.totalTime), 0);
    const total = chartData.reduce((acc, data) => acc + data.totalTime, 0);
    const generatedTicks = generateTicks(max);

    return { maxTime: max, totalTime: total, ticks: generatedTicks };
  }, [chartData]);

  // Memoized date range calculation
  const calculateDateRange = useCallback(() => {
    let start: Date, end: Date;
    let shouldByMonth = false;

    switch (dropdownSelection) {
      case "7":
        // Last 7 days in UTC
        const now7 = new Date();
        end = new Date(
          Date.UTC(
            now7.getUTCFullYear(),
            now7.getUTCMonth(),
            now7.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
        start = new Date(
          Date.UTC(
            now7.getUTCFullYear(),
            now7.getUTCMonth(),
            now7.getUTCDate() - 7,
            0,
            0,
            0,
            0
          )
        );
        break;
      case "week":
        // Current week in UTC (Sunday to Saturday)
        const nowWeek = new Date();
        const dayOfWeek = nowWeek.getUTCDay();
        start = new Date(
          Date.UTC(
            nowWeek.getUTCFullYear(),
            nowWeek.getUTCMonth(),
            nowWeek.getUTCDate() - dayOfWeek,
            0,
            0,
            0,
            0
          )
        );
        end = new Date(
          Date.UTC(
            nowWeek.getUTCFullYear(),
            nowWeek.getUTCMonth(),
            nowWeek.getUTCDate() - dayOfWeek + 6,
            23,
            59,
            59,
            999
          )
        );
        break;
      case "30":
        // Last 30 days in UTC
        const now30 = new Date();
        end = new Date(
          Date.UTC(
            now30.getUTCFullYear(),
            now30.getUTCMonth(),
            now30.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
        start = new Date(
          Date.UTC(
            now30.getUTCFullYear(),
            now30.getUTCMonth(),
            now30.getUTCDate() - 30,
            0,
            0,
            0,
            0
          )
        );
        break;
      case "month":
        // Current month in UTC
        const nowMonth = new Date();
        start = new Date(
          Date.UTC(
            nowMonth.getUTCFullYear(),
            nowMonth.getUTCMonth(),
            1,
            0,
            0,
            0,
            0
          )
        );
        end = new Date(
          Date.UTC(
            nowMonth.getUTCFullYear(),
            nowMonth.getUTCMonth() + 1,
            0,
            23,
            59,
            59,
            999
          )
        );
        break;
      case "year":
        // Current year in UTC - all 12 months
        const nowYear = new Date();
        const currentYear = nowYear.getUTCFullYear();
        start = new Date(Date.UTC(currentYear, 0, 1, 0, 0, 0, 0));
        end = new Date(Date.UTC(currentYear, 11, 31, 23, 59, 59, 999));
        shouldByMonth = true;
        break;
      case "alltime":
        // All time - from earliest activity to now
        // Set a very early date, backend will adjust to actual earliest
        start = new Date(Date.UTC(2000, 0, 1, 0, 0, 0, 0));
        const nowAlltime = new Date();
        end = new Date(
          Date.UTC(
            nowAlltime.getUTCFullYear(),
            nowAlltime.getUTCMonth(),
            nowAlltime.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
        shouldByMonth = true;
        break;
      case "custom":
        // Set to September 13, 2024 to present in UTC
        start = new Date(Date.UTC(2024, 8, 13, 0, 0, 0, 0));
        const nowCustom = new Date();
        end = new Date(
          Date.UTC(
            nowCustom.getUTCFullYear(),
            nowCustom.getUTCMonth(),
            nowCustom.getUTCDate(),
            23,
            59,
            59,
            999
          )
        );
        break;
      default:
        return;
    }

    setByMonth(shouldByMonth);
    setDate({ from: start, to: end });
  }, [dropdownSelection]);

  // Debounced data fetching logic handled by React Query naturally, we'll just add a slight delay via state if needed,
  // but react-query aborts previous requests if the key changes, which effectively debounces the fetch over the network.
  const { data: fetchedData, isPending: chartLoading } = useQuery({
    queryKey: ['graph', date?.from?.toISOString(), date?.to?.toISOString(), byMonth, dropdownSelection === "alltime"],
    queryFn: async ({ signal }) => {
      if (!date?.from || !date?.to) return null;
      const response = await axios.get("/api/graphs", {
        params: {
          startTime: date.from.toISOString(),
          endTime: date.to.toISOString(),
          byMonth: byMonth,
          allTime: dropdownSelection === "alltime",
        },
        signal,
      });
      return response.data;
    },
    enabled: !!date?.from && !!date?.to,
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    if (fetchedData) {
      setChartData(fetchedData.chartData);
      if (fetchedData.chartData[0]?.dailyGoal) {
        setDailyGoal(fetchedData.chartData[0].dailyGoal);
      }
    }
  }, [fetchedData]);

  // Effect for dropdown selection changes
  useEffect(() => {
    calculateDateRange();
  }, [dropdownSelection, calculateDateRange]);

  // Streak handling - moved to separate effect, runs less frequently
  useEffect(() => {
    if (!chartLoading && chartData.length > 0) {
      handleStreak();
    }
  }, [chartLoading]);

  // Streak logic is now fully server-side — the GET endpoint computes,
  // persists, and returns the authoritative streak on every call.
  // We just need to trigger it after chart data loads so the dashboard
  // streak box invalidates and reflects any changes.
  const handleStreak = useCallback(async () => {
    try {
      await fetch("/api/current-streak");
    } catch (error) {
      console.error("Error refreshing streak:", error);
    }
  }, []);

  const handleGoalChange = useCallback(
    async (adjustment: number) => {
      const newGoal = Math.max(30, Math.min(600, dailyGoal + adjustment));
      setDailyGoal(newGoal);

      // Don't await - fire and forget for better UX
      axios.post("/api/graphs", { goal: newGoal }).catch((error) => {
        console.error("Error updating goal:", error);
        // Optionally revert on error
        setDailyGoal(dailyGoal);
      });
    },
    [dailyGoal]
  );

  const minutesToStr = useCallback((time: number) => {
    const hours = time / 60;
    return `${hours} hours`;
  }, []);

  const formatYAxis = useCallback((milliseconds: number) => {
    const totalMins = milliseconds / 60000;
    if (totalMins === 0) return '0';
    if (totalMins < 60) return `${Math.round(totalMins)}m`;
    const hours = totalMins / 60;
    return Number.isInteger(hours) ? `${hours}h` : `${hours}h`;
  }, []);

  // Memoized tooltip component
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const weeklyAverage = payload[0]?.payload?.weeklyAverage;
      
      let windowSizeLabel = "Rolling";
      if (date?.from && date?.to) {
        const diffDays = Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays <= 31) {
          windowSizeLabel = "7-Day";
        } else if (diffDays <= 90) {
          windowSizeLabel = "14-Day";
        } else {
          windowSizeLabel = "30-Day";
        }
      }

      return (
        <div className="bg-gray-800 p-3 border border-gray-700 rounded-md shadow-lg">
          <p className="text-white text-xs font-semibold mb-1">{`Date: ${label}`}</p>
          <p className="text-green-500 text-xs">{`Total: ${formatTime(
            payload[0].payload.totalTime
          )}`}</p>
          {weeklyAverage !== undefined && (
            <p className="text-orange-500 text-xs mt-1">{`${windowSizeLabel} Avg: ${formatTime(
              weeklyAverage
            )}`}</p>
          )}
        </div>
      );
    }
    return null;
  }, [date]);

  return (
    <div className="h-full w-full flex flex-col">
      <div className="flex flex-row gap-2 flex-nowrap mb-4">
        <Select
          value={dropdownSelection}
          onValueChange={(value) => {
            setDropdownSelection(value);
            // Persist preference (skip 'custom' — date range not stored)
            if (value !== 'custom') {
              localStorage.setItem('ally-graph-range', value);
            }
          }}
        >
          <SelectTrigger className="w-[170px] bg-gray-950 text-white">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="bg-gray-950 text-white backdrop-blur-md">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="week">Current week</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="month">Current month</SelectItem>
            <SelectItem value="year">Current year</SelectItem>
            <SelectItem value="alltime">Every month</SelectItem>
            <SelectItem value="custom">Custom interval</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant="outline"
              className={cn(
                "w-[300px] justify-start text-left font-normal text-white bg-gray-950 border-gray-700",
                !date && "text-muted-foreground"
              )}
              onPointerDown={(e) => {
                if (e.button === 0 && dropdownSelection !== "custom") {
                  setDropdownSelection("custom");
                }
              }}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-white flex-shrink-0" />
              <span className="truncate">
                {date?.from ? (
                  date.to ? (
                    <>
                      {format(date.from, "LLL dd, y")} -{" "}
                      {format(date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pick a date</span>
                )}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 bg-gray-950 text-white"
            align="start"
          >
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  // Convert to UTC dates
                  const fromDate = new Date(range.from);
                  const toDate = new Date(range.to);
                  const utcFrom = new Date(
                    Date.UTC(
                      fromDate.getFullYear(),
                      fromDate.getMonth(),
                      fromDate.getDate(),
                      0,
                      0,
                      0,
                      0
                    )
                  );
                  const utcTo = new Date(
                    Date.UTC(
                      toDate.getFullYear(),
                      toDate.getMonth(),
                      toDate.getDate(),
                      23,
                      59,
                      59,
                      999
                    )
                  );
                  setDate({ from: utcFrom, to: utcTo });
                } else if (range?.from) {
                  const fromDate = new Date(range.from);
                  const utcFrom = new Date(
                    Date.UTC(
                      fromDate.getFullYear(),
                      fromDate.getMonth(),
                      fromDate.getDate(),
                      0,
                      0,
                      0,
                      0
                    )
                  );
                  setDate({ from: utcFrom, to: undefined });
                } else {
                  setDate(range);
                }
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>

        <Drawer>
          <DrawerTrigger asChild>
            <Button
              variant="outline"
              className="w-auto text-green-400 bg-gray-950 border-gray-700"
            >
              <span className="truncate">
                Daily Goal: {minutesToStr(dailyGoal)}
              </span>
            </Button>
          </DrawerTrigger>
          <DrawerContent className="bg-black text-white">
            <div className="mx-auto w-full max-w-sm">
              <DrawerHeader>
                <DrawerTitle className="text-green-500">
                  Daily Focus Goal
                </DrawerTitle>
                <DrawerDescription>
                  Set your daily focus goal.
                </DrawerDescription>
              </DrawerHeader>
              <div className="p-4 pb-0">
                <div className="flex items-center justify-center space-x-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full bg-gray-950 text-white border-gray-700"
                    onClick={() => handleGoalChange(-30)}
                    disabled={dailyGoal <= 30}
                  >
                    <Minus className="h-4 w-4" />
                    <span className="sr-only">Decrease</span>
                  </Button>
                  <div className="flex-1 text-center">
                    <div className="text-6xl font-bold tracking-tighter">
                      {minutesToStr(dailyGoal)}
                    </div>
                    <div className="text-[0.70rem] uppercase text-gray-400">
                      Per day
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-full bg-gray-950 text-white border-gray-700"
                    onClick={() => handleGoalChange(30)}
                    disabled={dailyGoal >= 600}
                  >
                    <Plus className="h-4 w-4" />
                    <span className="sr-only">Increase</span>
                  </Button>
                </div>
                <div className="mt-3 h-[120px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sampleGoalData}>
                      <Bar
                        dataKey="goal"
                        style={{
                          fill: "#22c55e",
                          opacity: 0.9,
                        }}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button>Set Goal</Button>
                </DrawerClose>
              </DrawerFooter>
            </div>
          </DrawerContent>
        </Drawer>

        <span className="hidden md:flex items-center border p-2 rounded-md text-sm text-white bg-gray-950 border-gray-700 whitespace-nowrap">
          Range Total: {Math.round(totalTime / 60000)} min
        </span>
      </div>

      <div className="flex-1 min-h-[300px] sm:min-h-[400px]">
        {chartLoading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="inline-block w-8 h-8 rounded-full border-4 border-gray-950 border-t-transparent animate-spin">
              <LoaderCircle />
            </div>
            <div className="mt-2 text-white">Fetching the latest data</div>
          </div>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="h-full w-full bg-gray-950 text-white"
          >
            <ComposedChart
              data={chartData}
              margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid vertical={false} stroke="#28272c" />
              <XAxis
                dataKey="date"
                tickLine={false}
                tickMargin={5}
                axisLine={false}
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                width={52}
                ticks={ticks}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} cursor={false} />
              {/* <ChartLegend content={<ChartLegendContent />} /> */}
              {Object.keys(chartConfig).map((key) => (
                <Bar
                  key={key}
                  dataKey={key}
                  stackId="a"
                  fill={chartConfig[key as keyof typeof chartConfig].color}
                  radius={0}
                  style={{ transition: "fill 0.3s ease" }}
                />
              ))}
              <Line
                dataKey="weeklyAverage"
                stroke="#ff7300"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
};

export default Graph;
