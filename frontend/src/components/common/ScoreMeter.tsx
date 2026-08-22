import React from 'react';

interface ScoreMeterProps {
  label: string;
  value: number;
  max?: number;
  hint?: string;
  barClassName: string;
  valueClassName: string;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  label,
  value,
  max = 10,
  hint,
  barClassName,
  valueClassName,
}) => {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="space-y-1.5 min-w-0">
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
        <span className="truncate">{label}</span>
        <span className={`tabular-nums ${valueClassName}`}>
          {value}/{max}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${barClassName}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {hint && <p className="text-[10px] text-slate-400 truncate">{hint}</p>}
    </div>
  );
};
