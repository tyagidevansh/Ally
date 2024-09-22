import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent } from "@/components/ui/chart"
import axios from "axios";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { addDays, format, setDate } from "date-fns";
import { Calendar as CalendarIcon, Minus, Plus } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";

//make daily goal local storage or something

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

const chartConfig = {
  Study: {
    label: "Studying",
    color: "#22c55e",
  },
  Reading: {
    label: "Reading",
    color: "#3b82f6",
  },
  Coding: {
    label: "Coding",
    color: "#fb7185",
  }, 
  Meditation: {
    label: "Meditation",
    color: "#a855f7",
  }, 
  Other: {
    label: "Other",
    color: "#f59e0b"
  }
} satisfies ChartConfig

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
]

const formatTime = (time: number) => {
  const hours = Math.floor(time / 3600000);
  const minutes = Math.floor((time % 3600000) / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  if (hours > 0) {
    return `${hours} hr ${minutes.toString().padStart(2, "0")} min ${seconds.toString().padStart(2, "0")} sec`;
  } else if (minutes > 0) {
    return `${minutes} min ${seconds.toString().padStart(2, "0")} sec`;
  } else {
    return `${seconds} sec`;
  }
};

const generateTicks = (maxValue : number) => {
  const tickIntervals = [300000, 600000, 900000, 1800000, 3600000, 5400000, 7200000, 9000000, 10800000, 14400000, 18000000]; // 5 min, 10 min, 15 min, 30 min, 1 hr, 1.5 hr, 2hr, 2.5hr, 3hr, 4hr, 5hr
  const ticks = [];

  for (let i = 0; i <= maxValue; i += tickIntervals.find(interval => interval >= maxValue / 5)!) {
    ticks.push(i);
  }
  
  return ticks;
}

const Graph = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);
  const [dropdownSelection, setDropdownSelection] = useState<string>("30"); //7, week, 30, month, year
  const [byMonth, setByMonth] = useState<boolean>(false);
  const [dailyGoal, setDailyGoal] = useState<number>(180);

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  useEffect(() => {
    if (dropdownSelection !== "custom") {
      calculateDateRange();
    }
  }, [dropdownSelection]);

  useEffect(() => {
    if (date?.from && date?.to) {
      handleRequest();
    }
  }, [date]);

  useEffect(() => {
    if (!chartLoading) {
      handleStreak();
    }
  }, [chartLoading]);

  const handleStreak = async () => {
    try {
      const streakData = await fetch('/api/current-streak');
      const streakDataJson = await streakData.json();

      const updates: { streakStart?: number; streakLast?: number; bestStreak?: number } = {};

      const now = new Date();
      const localMidnight = new Date(now);
      localMidnight.setHours(0, 0, 0, 0); 

      const yesterdayMidnight = new Date(localMidnight);
      yesterdayMidnight.setDate(localMidnight.getDate() - 1);

      //check for streak changes at local midnight
      if (now >= localMidnight && streakDataJson.yesterdayTime < dailyGoal) {
        updates.streakStart = Date.now();
        updates.streakLast = Date.now(); // start a new streak today

      } else if (streakDataJson.todayTime >= dailyGoal) {
        //today's goal has been met, so update `streakLast`
        updates.streakLast = Date.now();

        //if the previous day's goal was not met, start a new streak today
        if (streakDataJson.yesterdayTime < dailyGoal) {
          updates.streakStart = Date.now();
        }
      }

      if (Object.keys(updates).length > 0) {
        await fetch('/api/current-streak', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });
      }

    } catch (error) {
      console.error("Error handling streak update:", error);
    }
  };

  
  const calculateDateRange = () => {
    let start: Date = new Date(), end: Date = new Date();
    setByMonth(false);

    switch (dropdownSelection) {
      case "7":
        end = new Date();
        start = addDays(end, -7);
        break;
      case "week":
        const now = new Date();
        const dayOfWeek = now.getDay();
        start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek); // start of the week
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6); //end of the week
        end.setHours(23, 59, 59, 999);
        break;
      case "30":
        end = new Date();
        start = addDays(end, -30);
        break;
      case "month":
        const currentMonth = new Date();
        start = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1); // start of the month
        end = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0); // end of the month
        break;
      case "year":
        const currentYear = new Date().getFullYear();
        start = new Date(currentYear, 0, 1);
        end = new Date(currentYear, 11, 31, 23, 59, 59, 999);
        setByMonth(true);
        break;
      case "custom":
        if (date?.to) {
          end = new Date(date.to);
          end.setHours(23, 59, 59, 999);
        } else {
          new Date();
        }
        start = date?.from || new Date();
        break;
      default:
        return;
    }

    setDate({ from: start, to: end });
  };

  const handleRequest = async () => {
    if (!date?.from || !date?.to) return;
    
    setChartLoading(true);
    
    try {
      const response = await axios.get("/api/graphs", {
        params: {
          startTime: date.from.toISOString(),
          endTime: new Date(date.to.setHours(23, 59, 59, 999)).toISOString(),
          byMonth: byMonth,
        },
      });
      setChartData(response.data.chartData);
      setDailyGoal(response.data.chartData[0].dailyGoal);
    } catch (error) {
      console.error("Error fetching chart data:", error);
    } finally {
      setChartLoading(false);
    }
  };

  const handleGoalChange = async (adjustment: number) => {
    const newGoal = Math.max(30, Math.min(600, dailyGoal + adjustment));
    setDailyGoal(newGoal);
    await axios.post('/api/graphs', { goal : newGoal});
  }

  const minutesToStr = (time: number) => {
    const hours = time / 60;

    return `${hours} hours`
  }

  const formatYAxis = (milliseconds: number) => {
    let timeStr = formatTime(milliseconds);
    
    for (let i = 1; i < timeStr.length; i++) {
      if (timeStr[i] === '0' && timeStr[i - 1] === '0') {
        timeStr = timeStr.slice(0, i-2);
      }
    }

    return timeStr;
  };

  const maxTime = Math.max(...chartData.map(data => data.totalTime));

  const ticks = generateTicks(maxTime);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {;
      return (
        <div className="bg-gray-800 p-2 border border-gray-700 rounded">
          <p className="text-white">{`Date: ${label}`}</p>
          <p className="text-green-500">{`Total: ${formatTime(payload[0].payload.totalTime)}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="h-full w-full">
      <div className="flex gap-2">
      <Select 
            value={dropdownSelection} 
            onValueChange={(value) => setDropdownSelection(value)}
          >
          <SelectTrigger className="w-[170px] ">
            <SelectValue placeholder="Last 30 days" />
          </SelectTrigger>
          <SelectContent className="bg-gray-950 backdrop-blur-md">
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="week">Current week</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="month">Current month</SelectItem>
            <SelectItem value="year">Current year</SelectItem>
            <SelectItem value="custom">Custom interval</SelectItem>            
          </SelectContent>
        </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "w-[300px] justify-start text-left font-normal",
              !date && "text-muted-foreground"
            )}
            disabled = {!(dropdownSelection === "custom")}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
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
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={(range) => {
              if (range?.to) {
                const toDate = new Date(range.to);
                toDate.setHours(23, 59, 59, 999); // Ensure the 'to' includes the whole day
                setDate({ from: range.from, to: toDate });
              } else {
                setDate(range);
              }
            }}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      <span className="border p-2 ml-5 rounded-md text-sm">Daily Goal : {minutesToStr(dailyGoal)}</span>
      
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant = "outline" className="text-green-500">Change</Button>
        </DrawerTrigger>
        <DrawerContent className="bg-black">
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
                  variant = "outline"
                  size = "icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick = {() => handleGoalChange(-30)}
                  disabled = {dailyGoal <= 30}
                >
                  <Minus className="h-4 w-4"/>
                  <span className="sr-only">Decrease</span>
                </Button>
                <div className="flex-1 text-center">
                  <div className="text-6xl font-bold tracking-tighter">
                    {minutesToStr(dailyGoal)}
                  </div>
                  <div className="text-[0.70rem] uppercase text-muted-foreground">
                    Per day
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 shrink-0 rounded-full"
                  onClick={() => handleGoalChange(30)}
                  disabled = {dailyGoal >= 600}
                >
                  <Plus className="h-4 w-4"/>
                  <span className="sr-only">Increase</span>
                </Button>
              </div>
              <div className="mt-3 h-[120px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sampleGoalData}>
                    <Bar
                      dataKey="goal"
                      style={
                        {
                          fill: "#22c55e",
                          opacity: 0.9,
                        } as React.CSSProperties
                      }
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
    </div>
 
      <div>
        {chartLoading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="inline-block mt-[20%] w-8 h-8 rounded-full border-4 border-black border-t-transparent animate-spin">
              <LoaderCircle />
            </div>
            <div className="mt-2">Fetching the latest data</div>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
              data={chartData} // Ensure chartData matches the expected format
              margin={{ top: 20, right: 30, left: 30, bottom: 5 }}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="date" tickLine={false} tickMargin={5} axisLine={false} />
              <YAxis
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                width={60}
                ticks={ticks}
              />
              <Tooltip content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              
              {Object.keys(chartConfig).map((key) => (
                <Bar
                  key={key}
                  dataKey={key} 
                  stackId="a" 
                  fill={chartConfig[key as keyof typeof chartConfig].color} 
                  radius={0}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}

      </div>
    </div>
  );
}
 
export default Graph;