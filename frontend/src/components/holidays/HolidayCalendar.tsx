import React, { useMemo, useState } from 'react';
import {
  buildMonthGrid,
  getHolidayOnDate,
  getHolidaysInMonth,
  getLongWeekends,
  isLongWeekendDate,
  toDateString,
  WEEKDAY_LABELS,
  LongWeekend,
  Holiday,
} from '../../utils/holidays';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { Badge } from '../common/Badge';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface HolidayCalendarProps {
  onDateSelect?: (dateStr: string, holiday?: Holiday, longWeekend?: LongWeekend) => void;
  onLongWeekendClick?: (longWeekend: LongWeekend) => void;
  initialMonth?: Date;
  showLegend?: boolean;
}

export const HolidayCalendar: React.FC<HolidayCalendarProps> = ({
  onDateSelect,
  onLongWeekendClick,
  initialMonth,
  showLegend = true,
}) => {
  const today = new Date();
  const [currentDate, setCurrentDate] = useState(
    initialMonth ?? new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const cells = useMemo(() => buildMonthGrid(year, month), [year, month]);
  const monthHolidays = useMemo(() => getHolidaysInMonth(year, month), [year, month]);
  const longWeekends = useMemo(() => getLongWeekends(year), [year]);

  const selectedHoliday = selectedDate ? getHolidayOnDate(selectedDate) : undefined;
  const selectedLongWeekend = selectedDate ? isLongWeekendDate(selectedDate, year) : undefined;

  const handleDayClick = (day: number) => {
    const dateStr = toDateString(year, month, day);
    setSelectedDate(dateStr);
    const holiday = getHolidayOnDate(dateStr);
    const lw = isLongWeekendDate(dateStr, year);
    onDateSelect?.(dateStr, holiday, lw);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {MONTH_NAMES[month]} {year}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month - 1, 1))}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(today.getFullYear(), today.getMonth(), 1))}
              className="px-2 py-1 text-[10px] font-bold text-brand-700 hover:bg-brand-50 rounded-lg"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {showLegend && (
          <div className="flex flex-wrap gap-3 mb-4 text-[10px] font-semibold text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Public holiday
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-teal-200 border border-teal-400" /> Long weekend
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded bg-slate-100 border border-slate-200" /> Weekend
            </span>
          </div>
        )}

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          {WEEKDAY_LABELS.map((d) => (
            <span key={d}>{d}</span>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/50" />;
            }

            const dateStr = toDateString(year, month, day);
            const holiday = getHolidayOnDate(dateStr);
            const longWeekend = isLongWeekendDate(dateStr, year);
            const dow = new Date(year, month, day).getDay();
            const isWeekend = dow === 0 || dow === 6;
            const isToday = dateStr === toDateString(today.getFullYear(), today.getMonth(), today.getDate());
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => handleDayClick(day)}
                className={`relative h-16 sm:h-20 rounded-xl p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all border ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20'
                    : holiday
                      ? 'border-amber-300 bg-amber-50/80 hover:border-amber-400'
                      : longWeekend
                        ? 'border-teal-200 bg-teal-50/60 hover:border-teal-400'
                        : isWeekend
                          ? 'border-slate-200 bg-slate-50/80 hover:bg-slate-100'
                          : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isToday ? 'text-brand-700' : isSelected ? 'text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                  {isToday && (
                    <span className="text-[8px] font-bold uppercase text-brand-600">Today</span>
                  )}
                </div>
                {holiday && (
                  <span className="w-full truncate text-[9px] sm:text-[10px] font-semibold text-amber-900 bg-amber-200/70 px-1 py-0.5 rounded-md line-clamp-1">
                    {holiday.name}
                  </span>
                )}
                {!holiday && longWeekend && (
                  <span className="w-full truncate text-[9px] font-semibold text-teal-800 px-0.5">
                    Long wknd
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft space-y-4">
        <div>
          <span className="text-xs font-semibold uppercase text-brand-600 tracking-wider">
            Holidays this month
          </span>
          <h4 className="text-lg font-bold text-slate-900 mt-0.5">{MONTH_NAMES[month]}</h4>
        </div>

        {monthHolidays.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No public holidays this month.</p>
        ) : (
          <ul className="space-y-2">
            {monthHolidays.map((h) => (
              <li
                key={h.date}
                className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-amber-50/80 border border-amber-100"
              >
                <div>
                  <p className="text-xs font-bold text-slate-900">{h.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {new Date(h.date + 'T00:00:00').toLocaleDateString('en-IN', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <Badge variant="warning" size="sm">
                  Holiday
                </Badge>
              </li>
            ))}
          </ul>
        )}

        {selectedDate && (
          <div className="pt-4 border-t border-slate-100 space-y-2">
            <p className="text-xs font-bold text-slate-700">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-IN', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {selectedHoliday && (
              <p className="text-xs text-amber-800 font-semibold">{selectedHoliday.name}</p>
            )}
            {selectedLongWeekend && (
              <button
                type="button"
                onClick={() => onLongWeekendClick?.(selectedLongWeekend)}
                className="w-full mt-2 flex items-center justify-center gap-2 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-2 rounded-xl transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Plan trip for this long weekend
              </button>
            )}
            {!selectedHoliday && !selectedLongWeekend && (
              <p className="text-xs text-slate-500">Regular day — still great for a getaway!</p>
            )}
          </div>
        )}

        <div className="pt-2">
          <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Long weekends in {year}</p>
          <ul className="space-y-1.5 max-h-40 overflow-y-auto">
            {longWeekends.slice(0, 8).map((lw) => (
              <li key={lw.id}>
                <button
                  type="button"
                  onClick={() => onLongWeekendClick?.(lw)}
                  className="w-full text-left text-[11px] text-slate-600 hover:text-brand-700 truncate"
                >
                  {lw.title}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
