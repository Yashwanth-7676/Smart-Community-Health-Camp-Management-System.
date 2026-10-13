import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

interface LineConfig {
  dataKey: string;
  label: string;
  color: string;
  dashed?: boolean;
}

interface ReferenceLineConfig {
  y: number;
  label: string;
  color?: string;
}

interface TrendLineChartProps {
  data?: Record<string, string | number>[];
  lines?: LineConfig[];
  referenceLines?: ReferenceLineConfig[];
  xDataKey?: string;
  darkMode?: boolean;
  title?: string;
}

const defaultData = [
  { week: 'W1', registrations: 180, appointments: 140, completions: 120 },
  { week: 'W2', registrations: 220, appointments: 185, completions: 160 },
  { week: 'W3', registrations: 195, appointments: 170, completions: 145 },
  { week: 'W4', registrations: 280, appointments: 240, completions: 210 },
  { week: 'W5', registrations: 310, appointments: 265, completions: 235 },
  { week: 'W6', registrations: 290, appointments: 250, completions: 220 },
  { week: 'W7', registrations: 350, appointments: 300, completions: 275 },
  { week: 'W8', registrations: 410, appointments: 355, completions: 320 },
];

const defaultLines: LineConfig[] = [
  { dataKey: 'registrations', label: 'Registrations', color: '#06b6d4' },
  { dataKey: 'appointments', label: 'Appointments', color: '#3b82f6' },
  { dataKey: 'completions', label: 'Completions', color: '#22c55e' },
];

const defaultReferenceLines: ReferenceLineConfig[] = [
  { y: 300, label: 'Target', color: '#fbbf24' },
];

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0f172a] border border-cyan-800 rounded-lg px-4 py-3 shadow-xl">
        <p className="text-cyan-300 font-semibold text-sm mb-2">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: <span className="font-bold">{entry.value?.toLocaleString()}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const TrendLineChart: React.FC<TrendLineChartProps> = ({
  data = defaultData,
  lines = defaultLines,
  referenceLines = defaultReferenceLines,
  xDataKey = 'week',
  darkMode = false,
  title = 'Trend Analysis',
}) => {
  const axisColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? '#1e3a6e33' : '#e2e8f0';

  return (
    <div className={`w-full rounded-xl p-4 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'} shadow-md`}>
      <h3 className={`text-base font-semibold mb-4 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        {title}
      </h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey={xDataKey}
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={{ stroke: gridColor }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: axisColor, fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{value}</span>
            )}
          />
          {referenceLines.map((rl, i) => (
            <ReferenceLine
              key={i}
              y={rl.y}
              stroke={rl.color ?? '#fbbf24'}
              strokeDasharray="6 3"
              label={{
                value: rl.label,
                position: 'right',
                fill: rl.color ?? '#fbbf24',
                fontSize: 10,
              }}
            />
          ))}
          {lines.map((line) => (
            <Line
              key={line.dataKey}
              type="monotone"
              dataKey={line.dataKey}
              name={line.label}
              stroke={line.color}
              strokeWidth={2}
              strokeDasharray={line.dashed ? '6 3' : undefined}
              dot={{ r: 3, fill: line.color, stroke: 'transparent' }}
              activeDot={{ r: 5, stroke: line.color, strokeWidth: 2, fill: '#fff' }}
              isAnimationActive
              animationDuration={1000}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export { TrendLineChart };
export default TrendLineChart;
