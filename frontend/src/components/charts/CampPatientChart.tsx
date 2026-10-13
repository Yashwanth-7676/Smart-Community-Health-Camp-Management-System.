import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from 'recharts';

interface CampData {
  name: string;
  patients: number;
  capacity: number;
}

interface CampPatientChartProps {
  data?: CampData[];
  darkMode?: boolean;
}

const defaultData: CampData[] = [
  { name: 'Koramangala Camp', patients: 312, capacity: 400 },
  { name: 'Jayanagar Camp', patients: 285, capacity: 350 },
  { name: 'Hebbal Camp', patients: 198, capacity: 250 },
  { name: 'Whitefield Camp', patients: 430, capacity: 500 },
  { name: 'Yelahanka Camp', patients: 167, capacity: 300 },
  { name: 'Electronic City', patients: 375, capacity: 400 },
  { name: 'Bannerghatta Rd', patients: 220, capacity: 280 },
];

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const item = payload[0].payload as CampData;
    const pct = Math.round((item.patients / item.capacity) * 100);
    return (
      <div className="bg-[#0f172a] border border-cyan-800 rounded-lg px-4 py-3 shadow-xl min-w-[160px]">
        <p className="text-cyan-300 font-semibold text-sm mb-2 truncate">{label}</p>
        <p className="text-sm text-white">
          Patients: <span className="font-bold text-cyan-400">{item.patients}</span>
        </p>
        <p className="text-sm text-slate-400">
          Capacity: <span className="font-medium">{item.capacity}</span>
        </p>
        <p className="text-sm text-slate-400">
          Utilization: <span className={`font-bold ${pct > 85 ? 'text-red-400' : pct > 65 ? 'text-yellow-400' : 'text-green-400'}`}>{pct}%</span>
        </p>
      </div>
    );
  }
  return null;
};

const CampPatientChart: React.FC<CampPatientChartProps> = ({
  data = defaultData,
  darkMode = false,
}) => {
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#1e3a6e33' : '#e2e8f0';

  const getBarColor = (patients: number, capacity: number): string => {
    const pct = patients / capacity;
    if (pct > 0.85) return '#f87171';
    if (pct > 0.65) return '#fbbf24';
    return '#06b6d4';
  };

  return (
    <div className={`w-full rounded-xl p-4 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'} shadow-md`}>
      <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        Patients Per Camp
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#0e7490" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} />
          <XAxis
            type="number"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="name"
            tick={{ fill: axisColor, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={110}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(6,182,212,0.06)' }} />
          <Bar dataKey="patients" radius={[0, 6, 6, 0]} isAnimationActive animationDuration={1000}>
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={getBarColor(entry.patients, entry.capacity)}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-2 justify-end">
        {[
          { color: '#06b6d4', label: 'Normal' },
          { color: '#fbbf24', label: '>65%' },
          { color: '#f87171', label: '>85%' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: color }} />
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export { CampPatientChart };
export default CampPatientChart;
