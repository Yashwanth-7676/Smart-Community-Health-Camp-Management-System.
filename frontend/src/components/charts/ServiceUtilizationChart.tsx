import React from 'react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
  TooltipProps,
} from 'recharts';

interface ServiceData {
  service: string;
  utilized: number;
  capacity: number;
}

interface ServiceUtilizationChartProps {
  data?: ServiceData[];
  darkMode?: boolean;
}

const defaultData: ServiceData[] = [
  { service: 'General Medicine', utilized: 88, capacity: 100 },
  { service: 'Dental', utilized: 62, capacity: 100 },
  { service: 'Eye Care', utilized: 74, capacity: 100 },
  { service: 'Pediatrics', utilized: 81, capacity: 100 },
  { service: 'Gynecology', utilized: 55, capacity: 100 },
  { service: 'Mental Health', utilized: 38, capacity: 100 },
  { service: 'Cardiology', utilized: 67, capacity: 100 },
  { service: 'Dermatology', utilized: 70, capacity: 100 },
];

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-cyan-800 rounded-lg px-3 py-2 shadow-xl">
        <p className="text-cyan-300 font-semibold text-xs mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value}%</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const ServiceUtilizationChart: React.FC<ServiceUtilizationChartProps> = ({
  data = defaultData,
  darkMode = false,
}) => {
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#1e3a6e' : '#e2e8f0';

  return (
    <div className={`w-full rounded-xl p-4 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'} shadow-md`}>
      <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        Service Utilization
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data}>
          <PolarGrid stroke={gridColor} />
          <PolarAngleAxis
            dataKey="service"
            tick={{ fill: axisColor, fontSize: 10 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: axisColor, fontSize: 9 }}
            tickCount={5}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Radar
            name="Utilized"
            dataKey="utilized"
            stroke="#06b6d4"
            fill="#06b6d4"
            fillOpacity={0.28}
            strokeWidth={2}
            isAnimationActive
            animationDuration={900}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
};

export { ServiceUtilizationChart };
export default ServiceUtilizationChart;
