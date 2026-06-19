'use client';

import { format } from 'date-fns';

interface BarChartData {
  date: number;
  expense: number;
}

interface BarChartProps {
  data: BarChartData[];
}

export default function BarChart({ data }: BarChartProps) {
  // Find max expense to scale bars
  const maxExpense = Math.max(...data.map((d) => d.expense), 100); // fallback min max to 100 minor units to avoid division by 0

  return (
    <div className="flex flex-col h-full justify-between">
      {/* Chart Bars */}
      <div className="flex items-end justify-between h-14 gap-1.5 px-1">
        {data.map((day, i) => {
          const isToday = i === 6; // last item is today
          // Scale height between 4px and 48px
          const barHeight = Math.max(4, (day.expense / maxExpense) * 48);

          return (
            <div key={day.date} className="flex flex-col items-center flex-1 group relative">
              {/* Tooltip on Hover */}
              <div className="absolute bottom-full mb-1 hidden group-hover:block bg-dark text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap z-20">
                ₱{(day.expense / 100).toFixed(2)}
              </div>

              {/* Bar Fill */}
              <div
                style={{ height: `${barHeight}px` }}
                className={`w-full rounded-t-full transition-all duration-300 ${
                  isToday ? 'bg-teal' : 'bg-border-mid'
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Labels */}
      <div className="flex justify-between mt-2 px-1 text-[9px] font-extrabold uppercase">
        {data.map((day, i) => {
          const isToday = i === 6;
          const dayName = format(new Date(day.date), 'EEEEE'); // Single letter: M, T, W...

          return (
            <span
              key={day.date}
              className={`flex-1 text-center ${
                isToday ? 'text-teal font-black' : 'text-muted'
              }`}
            >
              {dayName}
            </span>
          );
        })}
      </div>
    </div>
  );
}
