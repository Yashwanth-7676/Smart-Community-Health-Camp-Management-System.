import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
} from 'recharts';

type AppointmentStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';

interface StatusData {
  name: AppointmentStatus;
  value: number;
}

interface AppointmentStatusChartProps {
  data?: StatusData[];
  darkMode?: boolean;
}

const STATUS_CONFIG: Record<AppointmentStatus, { color: string; label: string }> = {
  PENDING: { color: '#fbbf24', label: 'Pending' },
  CONFIRMED: { color: '#3b82f6', label: 'Confirmed' },
  COMPLETED: { color: '#22c55e', label: 'Completed' },
  CANCELLED: { color: '#f87171', label: 'Cancelled' },
};

const defaultData: StatusData[] = [
  { name: 'PENDING', value: 142 },
  { name: 'CONFIRMED', value: 285 },
  { name: 'COMPLETED', value: 634 },
  { name: 'CANCELLED', value: 58 },
];

const CustomTooltip: React.FC<TooltipProps<number, string>> = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const entry = payload[0];
    const status = entry.name as AppointmentStatus;
    const total = defaultData.reduce((s, d) => s + d.value, 0);
    const pct = ((entry.value as number) / total * 100).toFixed(1);
    return (
      <div className="bg-[#0f172a] border border-cyan-800 rounded-lg px-4 py-3 shadow-xl">
        <p className="font-semibold text-sm mb-1" style={{ color: STATUS_CONFIG[status]?.color }}>
          {STATUS_CONFIG[status]?.label ?? status}
        </p>
        <p className="text-white text-sm">Count: <span className="font-bold">{entry.value?.toLocaleString()}</span></p>
        <p className="text-slate-400 text-sm">Share: <span className="font-bold">{pct}%</span></p>
      </div>
    );
  }
  return null;
};

interface CustomLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: CustomLabelProps) => {
  if (percent < 0.05) return null;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={600}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const AppointmentStatusChart: React.FC<AppointmentStatusChartProps> = ({
  data = defaultData,
  darkMode = false,
}) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className={`w-full rounded-xl p-4 ${darkMode ? 'bg-[#0f172a]' : 'bg-white'} shadow-md`}>
      <h3 className={`text-base font-semibold mb-1 ${darkMode ? 'text-white' : 'text-slate-800'}`}>
        Appointment Status
      </h3>
      <p className={`text-xs mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
        Total: {total.toLocaleString()} appointments
      </p>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="48%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={3}
            dataKey="value"
            nameKey="name"
            labelLine={false}
            label={renderCustomLabel}
            isAnimationActive
            animationDuration={900}
            animationBegin={100}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={STATUS_CONFIG[entry.name]?.color ?? '#94a3b8'}
                stroke="transparent"
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={10}
            formatter={(value) => (
              <span className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                {STATUS_CONFIG[value as AppointmentStatus]?.label ?? value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export { AppointmentStatusChart };
export default AppointmentStatusChart;
