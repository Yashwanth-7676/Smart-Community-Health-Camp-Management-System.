import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface RegistrationDataPoint {
  month: string;
  patients: number;
  returning?: number;
}

interface RegistrationChartProps {
  data?: RegistrationDataPoint[];
  darkMode?: boolean;
}

const defaultData: RegistrationDataPoint[] = [
  { month: 'Jan', patients: 340, returning: 120 },
  { month: 'Feb', patients: 420, returning: 160 },
  { month: 'Mar', patients: 510, returning: 200 },
  { month: 'Apr', patients: 480, returning: 190 },
  { month: 'May', patients: 620, returning: 250 },
  { month: 'Jun', patients: 740, returning: 310 },
  { month: 'Jul', patients: 680, returning: 280 },
  { month: 'Aug', patients: 810, returning: 340 },
  { month: 'Sep', patients: 760, returning: 300 },
  { month: 'Oct', patients: 920, returning: 390 },
  { month: 'Nov', patients: 870, returning: 360 },
  { month: 'Dec', patients: 1050, returning: 430 },
];

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-cyan-800 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-cyan-300 font-semibold text-sm mb-1">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name === 'patients' ? 'New Registrations' : 'Returning'}: {' '}
            <span className="font-bold">{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const RegistrationChart: React.FC<RegistrationChartProps> = ({
  data = defaultData,
  darkMode = false,
}) => {
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#1e3a6e33' : '#e2e8f0';

  return (
    <div className={`w-full rounded-xl p-4 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'} shadow-md`}>
      <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        Monthly Patient Registrations
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="patientGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.45} />
              <stop offset="95%" stopColor="#1e3a6e" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="returningGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="returning"
            name="returning"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#returningGradient)"
            dot={false}
            activeDot={{ r: 5, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
            isAnimationActive
            animationDuration={1200}
          />
          <Area
            type="monotone"
            dataKey="patients"
            name="patients"
            stroke="#06b6d4"
            strokeWidth={2.5}
            fill="url(#patientGradient)"
            dot={false}
            activeDot={{ r: 6, stroke: '#06b6d4', strokeWidth: 2, fill: '#fff' }}
            isAnimationActive
            animationDuration={1000}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex gap-4 mt-3 justify-end">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-cyan-400 inline-block" />
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>New</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-blue-500 inline-block" />
          <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Returning</span>
        </div>
      </div>
    </div>
  );
};

export { RegistrationChart };
export default RegistrationChart;
