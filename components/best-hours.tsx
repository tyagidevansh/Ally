import { useEffect, useState } from "react";
import { LineChart, Line, XAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const BestHours = () => {
  interface ChartData {
    hour: string;
    productivity: number;
  }
  
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const response = await fetch('/api/productive-hours');
      const responseJSON = await response.json();

      const chartData = Object.keys(responseJSON).map((hour, index) => ({
        hour: `${hour}:00`,
        productivity: Math.round(responseJSON[hour] * 100)
      }));
      setData(chartData);
      setLoading(false);
    };

    fetchData();
  }, []); 

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const nextHour = `${parseInt(label.split(":")[0]) + 1}:00`;
      return (
        <div className="bg-gray-800 p-2 border border-gray-700 rounded">
          <p className="text-white text-sm">{`${label} - ${nextHour}`}</p>
          <p className="text-green-500 text-sm">{`Productivity: ${payload[0].value}`}</p>
        </div>
      );
    }

    return null;
  };

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="w-full h-full" style={{ maxHeight: 'calc(100vh / 3)' }}>
      <div className="text-green-500 font-bold mb-4 text-xl">
        Most Productive Hours
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <LineChart data={data}>
          <XAxis 
            dataKey="hour" 
            angle={-50} 
            textAnchor="end" 
            tick={{ fill: '#7b7884', fontSize: 12}} 
            height={45}
          />
          <CartesianGrid stroke="#28272c" horizontal={true} vertical={false} />
          <Tooltip content={<CustomTooltip />} />
          <Line type="monotone" dataKey="productivity" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default BestHours;
