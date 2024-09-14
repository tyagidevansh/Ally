import { Bar, BarChart, XAxis, YAxis, Tooltip } from "recharts"
import { ChartConfig, ChartContainer } from "@/components/ui/chart"
import axios from "axios";
import { useEffect, useState } from "react";
import { LoaderCircle } from "lucide-react";

const chartConfig = {
  time: {
    label: "Time focused",
    color: "#22c55e",
  },
} satisfies ChartConfig

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

const Graph = () => {
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState<boolean>(true);

  useEffect(() => {handleClick()}, [])

  const handleClick = async () => {
    setChartLoading(true);
    try {
      const response = await axios.get("/api/graphs", {
        params: {
          startTime: new Date("September 12, 2024 00:00:00").toISOString(),
          endTime: new Date("September 25, 2024 11:59:59").toISOString(),
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
    const timeStr = formatTime(milliseconds)
    console.log("raw time: ", milliseconds);
    console.log("format time ouput ", timeStr);
    return timeStr;
  };

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
      {chartLoading ? (
        <div className="flex flex-col justify-center items-center h-full">
          <div className="inline-block w-8 h-8 rounded-full border-4 border-green-500 border-t-transparent animate-spin">
            <LoaderCircle/>
          </div>
          <div className="mt-2">
            Fetching the latest data
          </div>
        </div>     
      ) : (
        <ChartContainer config={chartConfig} className="h-full w-full">
          <BarChart accessibilityLayer data={chartData} margin={{ top: 20, right: 30, left: 60, bottom: 5 }}>
            <XAxis 
              dataKey="date"
              tickLine={false}
              tickMargin={8}
              axisLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tickLine={false}
              axisLine={false}
              width={60}
            />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="time" fill="var(--color-time)" radius={2} />
          </BarChart>
        </ChartContainer>
      )}
    </div>
  );
}
 
export default Graph;