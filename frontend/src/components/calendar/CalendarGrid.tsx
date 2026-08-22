import React, { useState } from 'react';
import { Trip, ItineraryDay } from '../../types';
import { ChevronLeft, ChevronRight, MapPin, Clock, Calendar as CalendarIcon } from 'lucide-react';

interface CalendarGridProps {
  trips?: Trip[];
  itineraryDays?: ItineraryDay[];
  onSelectDay?: (date: string) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  trips = [],
  itineraryDays = [],
  onSelectDay,
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 8, 1)); // Sep 2026 default for sample data
  const [selectedDate, setSelectedDate] = useState<string>('2026-09-10');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar dates
  const days = [];
  for (let i = 0; i < firstDayIndex; i++) {
    days.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d);
  }

  const getDateString = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const isTripDay = (dateStr: string) => {
    return trips.some((t) => {
      return dateStr >= t.start_date && dateStr <= t.end_date;
    });
  };

  const getTripForDay = (dateStr: string) => {
    return trips.find((t) => dateStr >= t.start_date && dateStr <= t.end_date);
  };

  const getDayItinerary = (dateStr: string) => {
    return itineraryDays.find((d) => d.date === dateStr);
  };

  const activeItinerary = getDayItinerary(selectedDate);
  const activeTrip = getTripForDay(selectedDate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Calendar Card */}
      <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-brand-600" />
            <h3 className="text-lg font-bold text-slate-900">
              {monthNames[month]} {year}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handlePrevMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {days.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/50" />;
            }

            const dateStr = getDateString(day);
            const trip = getTripForDay(dateStr);
            const hasItinerary = getDayItinerary(dateStr);
            const isSelected = selectedDate === dateStr;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  if (onSelectDay) onSelectDay(dateStr);
                }}
                className={`relative h-16 sm:h-20 rounded-xl p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all border ${
                  isSelected
                    ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-xs'
                    : trip
                    ? 'border-teal-200 bg-teal-50/50 hover:border-brand-400'
                    : 'border-slate-100 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`text-xs sm:text-sm font-bold ${
                      isSelected ? 'text-brand-700' : 'text-slate-700'
                    }`}
                  >
                    {day}
                  </span>
                  {hasItinerary && (
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  )}
                </div>

                {trip && (
                  <div className="w-full truncate text-[10px] font-semibold text-brand-800 bg-brand-200/60 px-1 py-0.5 rounded-md line-clamp-1">
                    {trip.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Schedule Inspector */}
      <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft flex flex-col justify-between">
        <div>
          <div className="pb-4 border-b border-slate-100">
            <span className="text-xs font-semibold uppercase text-brand-600 tracking-wider">
              Daily Schedule
            </span>
            <h4 className="text-lg font-bold text-slate-900 mt-0.5">
              {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </h4>
          </div>

          <div className="mt-4 space-y-3">
            {activeTrip && (
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Trip</span>
                <p className="text-sm font-bold text-slate-800">{activeTrip.name}</p>
              </div>
            )}

            {activeItinerary ? (
              <div className="space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  <span>{activeItinerary.city_name || 'Destination City'}</span>
                </div>

                <div className="space-y-2">
                  {activeItinerary.sections.map((sec, i) => (
                    <div
                      key={sec.id || i}
                      className="rounded-xl bg-white border border-slate-200 p-3 shadow-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900">{sec.title}</span>
                        <span className="text-[11px] font-bold text-emerald-600">
                          ${sec.budget}
                        </span>
                      </div>
                      {sec.notes && (
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {sec.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No scheduled activities for this date.
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          <span>Select any highlighted date to inspect plans.</span>
        </div>
      </div>
    </div>
  );
};

