import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Trip, ItineraryDay, TripSection } from '../../types';
import { Price } from '../common/Price';
import { Button } from '../common/Button';
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Clock,
  Calendar as CalendarIcon,
  GripVertical,
  Edit3,
  List,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';
import {
  getHolidayOnDate,
  isLongWeekendDate,
  LongWeekend,
} from '../../utils/holidays';

interface CalendarGridProps {
  tripId?: number | string;
  trips?: Trip[];
  itineraryDays?: ItineraryDay[];
  onSelectDay?: (date: string) => void;
  onReorderSections?: (date: string, sections: TripSection[]) => Promise<void>;
  showHolidays?: boolean;
  onPlanHoliday?: (startDate: string, endDate: string, longWeekend?: LongWeekend) => void;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({
  tripId,
  trips = [],
  itineraryDays = [],
  onSelectDay,
  onReorderSections,
  showHolidays = false,
  onPlanHoliday,
}) => {
  const primaryTrip = tripId ? trips.find((t) => String(t.id) === String(tripId)) : trips[0];
  const initialDate = primaryTrip?.start_date
    ? new Date(primaryTrip.start_date + 'T00:00:00')
    : itineraryDays[0]?.date
      ? new Date(itineraryDays[0].date + 'T00:00:00')
      : new Date();

  const [viewMode, setViewMode] = useState<'calendar' | 'timeline'>('calendar');
  const [currentDate, setCurrentDate] = useState(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState(
    primaryTrip?.start_date || itineraryDays[0]?.date || ''
  );
  const [expandedDays, setExpandedDays] = useState<number[]>([1]);
  const [draggedSectionId, setDraggedSectionId] = useState<number | null>(null);
  const [localDays, setLocalDays] = useState<ItineraryDay[]>(itineraryDays);

  useEffect(() => {
    setLocalDays(itineraryDays);
    if (itineraryDays.length > 0) {
      setExpandedDays([itineraryDays[0].day_number]);
      if (!selectedDate) setSelectedDate(itineraryDays[0].date);
    }
  }, [itineraryDays]);

  useEffect(() => {
    if (primaryTrip?.start_date) {
      const start = new Date(primaryTrip.start_date + 'T00:00:00');
      setCurrentDate(new Date(start.getFullYear(), start.getMonth(), 1));
      setSelectedDate(primaryTrip.start_date);
    }
  }, [primaryTrip?.id, primaryTrip?.start_date]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const firstDayIndex = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarCells = useMemo(() => {
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDayIndex; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    return cells;
  }, [firstDayIndex, daysInMonth]);

  const getDateString = (day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const getTripForDay = (dateStr: string) =>
    trips.find((t) => dateStr >= t.start_date && dateStr <= t.end_date);

  const getDayItinerary = (dateStr: string) => localDays.find((d) => d.date === dateStr);

  const activeItinerary = getDayItinerary(selectedDate);
  const activeTrip = getTripForDay(selectedDate) || primaryTrip;
  const selectedHoliday = showHolidays && selectedDate ? getHolidayOnDate(selectedDate) : undefined;
  const selectedLongWeekend =
    showHolidays && selectedDate ? isLongWeekendDate(selectedDate, year) : undefined;

  const toggleDayExpansion = (dayNumber: number) => {
    setExpandedDays((prev) =>
      prev.includes(dayNumber) ? prev.filter((d) => d !== dayNumber) : [...prev, dayNumber]
    );
  };

  const handleSectionReorder = async (
    date: string,
    fromId: number,
    toId: number
  ) => {
    const day = localDays.find((d) => d.date === date);
    if (!day) return;

    const sections = [...day.sections];
    const fromIndex = sections.findIndex((s) => s.id === fromId);
    const toIndex = sections.findIndex((s) => s.id === toId);
    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) return;

    const [moved] = sections.splice(fromIndex, 1);
    sections.splice(toIndex, 0, moved);
    const reordered = sections.map((section, index) => ({
      ...section,
      order_index: index + 1,
    }));

    setLocalDays((prev) =>
      prev.map((d) => (d.date === date ? { ...d, sections: reordered } : d))
    );

    if (onReorderSections) {
      await onReorderSections(date, reordered);
    }
  };

  const renderSectionList = (date: string, sections: TripSection[], editable = true) => (
    <div className="space-y-2">
      {sections.map((sec) => (
        <div
          key={sec.id}
          draggable={editable}
          onDragStart={() => setDraggedSectionId(sec.id)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (draggedSectionId && draggedSectionId !== sec.id) {
              handleSectionReorder(date, draggedSectionId, sec.id);
            }
            setDraggedSectionId(null);
          }}
          onDragEnd={() => setDraggedSectionId(null)}
          className={`rounded-xl bg-white border p-3 shadow-xs space-y-1.5 ${
            draggedSectionId === sec.id ? 'border-brand-400 opacity-70' : 'border-slate-200'
          } ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 min-w-0">
              {editable && <GripVertical className="h-4 w-4 text-slate-300 mt-0.5 flex-shrink-0" />}
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-900 block truncate">{sec.title}</span>
                <span className="text-[10px] uppercase font-semibold text-slate-400">{sec.type}</span>
              </div>
            </div>
            <span className="text-[11px] font-bold text-emerald-600 flex-shrink-0">
              <Price amount={sec.budget || 0} />
            </span>
          </div>
          {sec.notes && (
            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{sec.notes}</p>
          )}
          {editable && tripId && (
            <Link
              to={`/trips/${tripId}/build`}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-brand-600 hover:text-brand-700"
            >
              <Edit3 className="h-3 w-3" />
              Quick edit in builder
            </Link>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Calendar
          </button>
          <button
            type="button"
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
              viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
            }`}
          >
            <List className="h-3.5 w-3.5" />
            Timeline
          </button>
        </div>

        {tripId && (
          <Link to={`/trips/${tripId}/build`}>
            <Button size="sm" variant="outline" leftIcon={<Edit3 className="h-4 w-4" />}>
              Edit Itinerary
            </Button>
          </Link>
        )}
      </div>

      {viewMode === 'timeline' ? (
        <div className="space-y-4">
          {localDays.map((day) => {
            const isExpanded = expandedDays.includes(day.day_number);
            return (
              <div
                key={day.date}
                className="rounded-2xl bg-white border border-slate-200/80 shadow-soft overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => toggleDayExpansion(day.day_number)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/70"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-sm font-extrabold text-brand-700">
                      D{day.day_number}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">
                        {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </h3>
                      {day.city_name && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3 text-brand-500" />
                          {day.city_name}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Price amount={day.total_cost} />
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-100 pt-4">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase mb-2">
                      Drag to reorder activities
                    </p>
                    {day.sections.length > 0 ? (
                      renderSectionList(day.date, day.sections)
                    ) : (
                      <p className="text-xs text-slate-500">No activities scheduled for this day.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-brand-600" />
                <h3 className="text-lg font-bold text-slate-900">
                  {monthNames[month]} {year}
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
                  onClick={() => setCurrentDate(new Date(year, month + 1, 1))}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {showHolidays && (
              <div className="flex flex-wrap gap-3 mb-4 text-[10px] font-semibold text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-violet-200 border border-violet-500" /> Planned trip
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> Holiday
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded bg-teal-200 border border-teal-400" /> Long weekend
                </span>
              </div>
            )}

            <div className="grid grid-cols-7 gap-1 text-center text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarCells.map((day, idx) => {
                if (day === null) {
                  return <div key={`empty-${idx}`} className="h-16 sm:h-20 rounded-xl bg-slate-50/50" />;
                }

                const dateStr = getDateString(day);
                const trip = getTripForDay(dateStr);
                const hasItinerary = getDayItinerary(dateStr);
                const isSelected = selectedDate === dateStr;
                const holiday = showHolidays ? getHolidayOnDate(dateStr) : undefined;
                const longWeekend = showHolidays ? isLongWeekendDate(dateStr, year) : undefined;

                return (
                  <button
                    key={dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(dateStr);
                      onSelectDay?.(dateStr);
                    }}
                    className={`relative h-16 sm:h-20 rounded-xl p-1.5 sm:p-2 text-left flex flex-col justify-between transition-all border ${
                      isSelected
                        ? 'border-brand-600 bg-brand-50/80 ring-2 ring-brand-500/20 shadow-xs'
                        : trip
                          ? 'border-violet-300 bg-violet-50/80 hover:border-violet-400'
                          : holiday
                            ? 'border-amber-300 bg-amber-50/70 hover:border-amber-400'
                            : longWeekend
                              ? 'border-teal-200/80 bg-teal-50/40 hover:border-teal-400'
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
                      <div className="flex items-center gap-0.5">
                        {holiday && (
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" title={holiday.name} />
                        )}
                        {hasItinerary && (
                          <span className="h-1.5 w-1.5 rounded-full bg-violet-500" />
                        )}
                      </div>
                    </div>
                    {trip && (
                      <div className="w-full truncate text-[10px] font-semibold text-violet-900 bg-violet-200/70 px-1 py-0.5 rounded-md line-clamp-1">
                        {trip.name}
                      </div>
                    )}
                    {!trip && holiday && (
                      <div className="w-full truncate text-[9px] font-semibold text-amber-900 bg-amber-200/60 px-1 py-0.5 rounded-md line-clamp-1">
                        {holiday.name}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-slate-200/80 p-5 sm:p-6 shadow-soft flex flex-col">
            <div className="pb-4 border-b border-slate-100">
              <span className="text-xs font-semibold uppercase text-brand-600 tracking-wider">
                Expandable Day View
              </span>
              <h4 className="text-lg font-bold text-slate-900 mt-0.5">
                {selectedDate
                  ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : 'Select a date'}
              </h4>
            </div>

            <div className="mt-4 space-y-3 flex-1">
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
                    <span>{activeItinerary.city_name || 'Destination'}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-400 uppercase">
                    Drag to reorder · Quick edit available
                  </p>
                  {renderSectionList(selectedDate, activeItinerary.sections)}
                </div>
              ) : (
                <div className="py-6 text-center space-y-3">
                  <p className="text-slate-400 text-xs">No scheduled activities for this date.</p>
                  {showHolidays && selectedHoliday && (
                    <p className="text-xs font-semibold text-amber-800">{selectedHoliday.name}</p>
                  )}
                  {showHolidays && onPlanHoliday && (selectedHoliday || selectedLongWeekend) && (
                    <button
                      type="button"
                      onClick={() =>
                        onPlanHoliday(
                          selectedLongWeekend?.startDate ?? selectedDate,
                          selectedLongWeekend?.endDate ?? selectedDate,
                          selectedLongWeekend ?? undefined
                        )
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-3 py-2 rounded-xl"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Plan your trip
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              <span>Select a highlighted date to expand the daily plan.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
