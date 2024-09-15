import { Bar, BarChart, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import axios from "axios";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

import { addDays, format, setDate } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Calendar } from "./ui/calendar";

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

const chartConfig = {
  time: {
    label: "Time focused",
    color: "#22c55e",
  },
} satisfies ChartConfig

const testChartData = [
 { date: "Aug 01", time: 2500005 },
 { date: "Aug 02", time: 4656554 },
 { date: "Aug 03", time: 5643521 },
 { date: "Aug 04", time: 5856585 },
 { date: "Aug 05", time: 12495449 },
 { date: "Aug 06", time: 3359292 },
 { date: "Aug 06", time: 3523421 },
 { date: "Aug 07", time: 5321354 },
 { date: "Aug 08", time: 5432544 },
 { date: "Aug 09", time: 6545333 },
 { date: "Aug 10", time: 9658584 },
 { date: "Aug 11", time: 2343352 }, 
 { date: "Aug 12", time: 5453564 },
 { date: "Aug 13", time: 14211334 },
 { date: "Aug 14", time: 12222222 },
 { date: "Aug 15", time: 13343234 },
 { date: "Aug 16", time: 23333231 }
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
  const [dropdownSelection, setDropdownSelection] = useState("30"); //7, week, 30, month, year

  const [date, setDate] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  })

  useEffect(() => {
  if (date?.from && date?.to) {
    handleClick();
  }
}, [date]);

  const handleClick = async () => {
    setChartLoading(true);
    try {
      const response = await axios.get("/api/graphs", {
        params: {
          startTime: date?.from? date.from.toISOString() : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString,
          endTime: date?.to? date.to.toISOString() : new Date(Date.now()).toISOString(),
        }    
      });
      console.log(response.data.chartData);
      setChartData(response.data.chartData);
      setChartLoading(false);
    } catch (error) {
      console.log("graph api handle click error", error);
    }
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

  const maxTime = Math.max(...chartData.map(data => data.time));

  const ticks = generateTicks(maxTime);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-gray-800 p-2 border border-gray-700 rounded">
          <p className="text-white">{`Date: ${label}`}</p>
          <p className="text-green-500">{`Time: ${formatTime(payload[0].value)}`}</p>
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
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
 
      <div>
        {chartLoading ? (
          <div className="flex flex-col justify-center items-center h-full">
            <div className="inline-block mt-48 w-8 h-8 rounded-full border-4 border-black border-t-transparent animate-spin">
              <LoaderCircle/>
            </div>
            <div className="mt-2">
              Fetching the latest data
            </div>
          </div>     
        ) : (
          <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 30, left: 30, bottom: 5 }}>
              <CartesianGrid vertical = {false} />
              <XAxis 
                dataKey="date"
                tickLine={false}
                tickMargin={5}
                axisLine={false}
              />
              <YAxis
                tickFormatter={formatYAxis}
                tickLine={false}
                axisLine={false}
                width={60}
                ticks = {ticks}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="time" fill="var(--color-time)" radius={2} />
            </BarChart>
          </ChartContainer>
        )}
      </div>
    </div>
  );
}
 
export default Graph;