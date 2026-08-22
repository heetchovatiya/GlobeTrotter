import React, { useMemo, useState } from 'react';
import { ItineraryDay, Stop, City, TripSection } from '../../types';
import { Price } from '../common/Price';
import { Button } from '../common/Button';
import { ALLOCATION_LABELS, sectionEffectiveTotal } from '../../utils/budgetAllocation';
import { Home, Plane, Compass, Plus, Pencil } from 'lucide-react';

interface ItineraryExpensePanelProps {
  days: ItineraryDay[];
  stops: Stop[];
  cities: City[];
  tripStart: string;
  tripEnd: string;
  onAddStayTrip: () => void;
  onAddTransportTrip: () => void;
  onAddStayCity: (stopId: number) => void;
  onAddTransportCity: (stopId: number) => void;
  onEditSection: (section: TripSection) => void;
}

function collectSections(days: ItineraryDay[]): TripSection[] {
  const seen = new Map<number, TripSection>();
  for (const day of days) {
    for (const section of day.sections) {
      if (!seen.has(section.id)) seen.set(section.id, section);
    }
  }
  return Array.from(seen.values()).sort((a, b) => a.order_index - b.order_index);
}

function activityTotal(section: TripSection): number {
  return (section.activities || []).reduce(
    (sum, act) => sum + (act.cost_override ?? act.activity?.cost ?? 0),
    0
  );
}

export const ItineraryExpensePanel: React.FC<ItineraryExpensePanelProps> = ({
  days,
  stops,
  cities,
  tripStart,
  tripEnd,
  onAddStayTrip,
  onAddTransportTrip,
  onAddStayCity,
  onAddTransportCity,
  onEditSection,
}) => {
  const sections = useMemo(() => collectSections(days), [days]);
  const staySections = sections.filter((s) => s.type === 'stay');
  const travelSections = sections.filter((s) => s.type === 'travel');
  const activitySections = sections.filter((s) => s.type === 'activity');

  const tripWideSections = useMemo(
    () => sections.filter((s) => s.budget_allocation === 'trip_total'),
    [sections]
  );

  const cityBlocks = useMemo(() => {
    const sorted = [...stops].sort((a, b) => a.order_index - b.order_index);
    return sorted.map((stop) => {
      const city = cities.find((c) => c.id === stop.city_id);
      const citySections = sections.filter(
        (s) => s.stop_id === stop.id && s.budget_allocation !== 'trip_total'
      );
      return { stop, cityName: city?.name || `Stop ${stop.order_index}`, citySections };
    });
  }, [stops, cities, sections]);

  const [expandedCity, setExpandedCity] = useState<number | null>(cityBlocks[0]?.stop.id ?? null);

  const stopById = useMemo(() => new Map(stops.map((s) => [s.id, s])), [stops]);

  const sectionTotal = (section: TripSection) =>
    sectionEffectiveTotal(section, {
      tripStart,
      tripEnd,
      stop: stopById.get(section.stop_id),
    });

  const stayTotal = staySections.reduce((s, x) => s + sectionTotal(x), 0);
  const transportTotal = travelSections.reduce((s, x) => s + sectionTotal(x), 0);
  const activitiesTotal =
    activitySections.reduce((s, x) => s + sectionTotal(x), 0) +
    sections.reduce((s, x) => s + activityTotal(x), 0);

  return (
    <section className="rounded-3xl bg-white border border-slate-200/80 shadow-soft overflow-hidden">
      <div className="p-5 sm:p-6 border-b border-slate-100">
        <h2 className="text-base sm:text-lg font-bold text-slate-900">Itinerary expenses</h2>
        <p className="text-xs text-slate-500 mt-1">
          Stay & transport blocks split across days. Activity costs come from scheduled activities.
        </p>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-[10px] font-bold uppercase text-emerald-700">Stay</p>
            <p className="text-sm font-extrabold text-emerald-900 mt-0.5">
              <Price amount={stayTotal} zeroAsFree={false} />
            </p>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-[10px] font-bold uppercase text-blue-700">Transport</p>
            <p className="text-sm font-extrabold text-blue-900 mt-0.5">
              <Price amount={transportTotal} zeroAsFree={false} />
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-3">
            <p className="text-[10px] font-bold uppercase text-amber-700">Activities</p>
            <p className="text-sm font-extrabold text-amber-900 mt-0.5">
              <Price amount={activitiesTotal} zeroAsFree={false} />
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Home className="h-4 w-4" />}
            onClick={onAddStayTrip}
          >
            Add stay (full trip)
          </Button>
          <Button
            size="sm"
            variant="outline"
            leftIcon={<Plane className="h-4 w-4" />}
            onClick={onAddTransportTrip}
          >
            Add transport (full trip)
          </Button>
        </div>

        {tripWideSections.length > 0 && (
          <div className="mt-4 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Full trip expenses
            </p>
            {tripWideSections.map((section) => (
              <SectionExpenseRow
                key={section.id}
                section={section}
                tripStart={tripStart}
                tripEnd={tripEnd}
                stop={stopById.get(section.stop_id)}
                onEdit={onEditSection}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-5 py-3 bg-slate-50/80 border-b border-slate-100">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
          By city
        </p>
      </div>

      <div className="divide-y divide-slate-100">
        {cityBlocks.map(({ stop, cityName, citySections }) => (
          <div key={stop.id}>
            <button
              type="button"
              onClick={() => setExpandedCity(expandedCity === stop.id ? null : stop.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/80"
            >
              <span className="text-sm font-bold text-slate-900">{cityName}</span>
              <span className="text-xs text-slate-500">
                {citySections.length} expense block{citySections.length === 1 ? '' : 's'}
              </span>
            </button>
            {expandedCity === stop.id && (
              <div className="px-5 pb-4 space-y-3">
                <div className="flex gap-2">
                  <Button size="sm" variant="ghost" onClick={() => onAddStayCity(stop.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Stay
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => onAddTransportCity(stop.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Transport
                  </Button>
                </div>
                {citySections.length === 0 ? (
                  <p className="text-xs text-slate-500">No expense blocks for this city yet.</p>
                ) : (
                  citySections.map((section) => (
                    <SectionExpenseRow
                      key={section.id}
                      section={section}
                      tripStart={tripStart}
                      tripEnd={tripEnd}
                      stop={stop}
                      onEdit={onEditSection}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

function SectionExpenseRow({
  section,
  tripStart,
  tripEnd,
  stop,
  onEdit,
}: {
  section: TripSection;
  tripStart: string;
  tripEnd: string;
  stop?: Stop;
  onEdit: (section: TripSection) => void;
}) {
  const actTotal = activityTotal(section);
  const allocation = section.budget_allocation || 'spread_dates';
  const effective = sectionEffectiveTotal(section, { tripStart, tripEnd, stop });
  const isPerDay = allocation === 'per_day';
  const canEdit = section.type === 'stay' || section.type === 'travel';
  const Icon =
    section.type === 'stay' ? Home : section.type === 'travel' ? Plane : Compass;

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-3 space-y-1">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <Icon className="h-4 w-4 shrink-0 mt-0.5 text-brand-500" />
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-900 truncate">{section.title}</p>
            <p className="text-[10px] text-slate-500 capitalize">{section.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && (
            <button
              type="button"
              onClick={() => onEdit(section)}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-white hover:text-brand-600 border border-transparent hover:border-slate-200 transition-colors"
              title="Edit expense"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          )}
          <span className="text-xs font-bold text-slate-800">
            <Price amount={effective + actTotal} zeroAsFree={false} />
          </span>
        </div>
      </div>
      <p className="text-[10px] text-slate-500">{ALLOCATION_LABELS[allocation]}</p>
      {isPerDay && (section.budget || 0) > 0 && (
        <p className="text-[10px] text-slate-600">
          <Price amount={section.budget || 0} zeroAsFree={false} />/day → total{' '}
          <Price amount={effective} zeroAsFree={false} />
        </p>
      )}
      {actTotal > 0 && (
        <p className="text-[10px] text-amber-700">
          Includes <Price amount={actTotal} zeroAsFree={false} /> from activities
        </p>
      )}
    </div>
  );
}
