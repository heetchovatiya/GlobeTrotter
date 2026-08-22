import React from 'react';
import { Link } from 'react-router-dom';
import { ItineraryDay, City } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { Button } from '../common/Button';
import { Price } from '../common/Price';
import { cityActivitiesUrl } from '../../utils/searchRoutes';
import {
  groupDaysByCity,
  resolveDayHeroImage,
  resolveSectionImage,
} from '../../utils/itineraryGrouping';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Compass,
  Home,
  MapPin,
  Plane,
} from 'lucide-react';
import { DEFAULT_CITY_IMAGE } from '../../constants/images';

interface ItineraryCityTimelineProps {
  days: ItineraryDay[];
  cities: City[];
  variant?: 'interactive' | 'readonly' | 'print';
  expandedDays?: number[];
  onToggleDay?: (dayNumber: number) => void;
  resolveExploreCityId?: (day: ItineraryDay) => number | undefined;
}

const sectionTypeIcon = (type: string) => {
  if (type === 'travel') return <Plane className="h-4 w-4 text-blue-500 shrink-0" />;
  if (type === 'stay') return <Home className="h-4 w-4 text-emerald-500 shrink-0" />;
  return <Compass className="h-4 w-4 text-amber-500 shrink-0" />;
};

export const ItineraryCityTimeline: React.FC<ItineraryCityTimelineProps> = ({
  days,
  cities,
  variant = 'interactive',
  expandedDays = [],
  onToggleDay,
  resolveExploreCityId,
}) => {
  const cityBlocks = groupDaysByCity(days, cities);
  const isPrint = variant === 'print';
  const isInteractive = variant === 'interactive';

  if (cityBlocks.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center text-sm text-slate-500">
        No itinerary days scheduled yet.
      </div>
    );
  }

  return (
    <div className={`space-y-10 ${isPrint ? 'space-y-6' : ''}`}>
      {cityBlocks.map((block, blockIdx) => (
        <section key={`${block.cityId ?? block.cityName}-${blockIdx}`} className="space-y-4">
          {/* City header */}
          <div
            className={`overflow-hidden rounded-3xl border border-slate-200/80 shadow-soft ${
              isPrint ? 'break-inside-avoid' : ''
            }`}
          >
            <div className={`relative ${isPrint ? 'h-32' : 'h-40 sm:h-48'}`}>
              <SafeImage
                src={block.cityImageUrl}
                fallback={DEFAULT_CITY_IMAGE}
                alt={block.cityName}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-300">
                  Stop {blockIdx + 1}
                </p>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">{block.cityName}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-200">
                  {block.country && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {block.country}
                    </span>
                  )}
                  <span>
                    {block.days.length} day{block.days.length === 1 ? '' : 's'}
                  </span>
                  <span>
                    <Price amount={block.totalCost} />
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Days in this city */}
          <div className="space-y-4 pl-0 sm:pl-2">
            {block.days.map((day) => {
              const isExpanded = isPrint || !isInteractive || expandedDays.includes(day.day_number);
              const exploreCityId = resolveExploreCityId?.(day) ?? block.cityId;
              const dayHero = resolveDayHeroImage(day, block.cityImageUrl);

              return (
                <div
                  key={day.date}
                  className={`rounded-3xl bg-white border border-slate-200/80 shadow-soft overflow-hidden ${
                    isPrint ? 'break-inside-avoid' : ''
                  }`}
                >
                  {isInteractive ? (
                    <button
                      type="button"
                      onClick={() => onToggleDay?.(day.day_number)}
                      className="w-full flex items-center justify-between p-5 sm:p-6 text-left hover:bg-slate-50/70 transition-colors gap-4"
                    >
                      <DayHeaderContent
                        day={day}
                        dayHero={dayHero}
                        exploreCityId={exploreCityId}
                        interactive
                      />
                      <div className="flex items-center gap-4 shrink-0">
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
                  ) : (
                    <div className="p-5 sm:p-6 flex items-center justify-between gap-4 border-b border-slate-100">
                      <DayHeaderContent day={day} dayHero={dayHero} exploreCityId={exploreCityId} />
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full shrink-0">
                        <Price amount={day.total_cost} />
                      </span>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="p-5 sm:p-6 pt-0 border-t border-slate-100 space-y-4">
                      {day.sections.length === 0 ? (
                        <EmptyDayState
                          cityName={day.city_name || block.cityName}
                          exploreCityId={exploreCityId}
                          interactive={isInteractive && !isPrint}
                        />
                      ) : (
                        day.sections.map((section, idx) => {
                          const sectionImage = resolveSectionImage(section, block.cityImageUrl);
                          return (
                            <div
                              key={section.id || idx}
                              className="rounded-2xl bg-slate-50/80 border border-slate-200/60 overflow-hidden"
                            >
                              <div className="flex flex-col sm:flex-row">
                                <div
                                  className={`relative shrink-0 ${
                                    isPrint ? 'h-24 w-full sm:w-28' : 'h-36 sm:h-auto sm:w-40'
                                  }`}
                                >
                                  <SafeImage
                                    src={sectionImage}
                                    fallback={block.cityImageUrl}
                                    alt={section.title}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                                <div className="flex-1 p-4 sm:p-5 space-y-2 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-start gap-2 min-w-0">
                                      {sectionTypeIcon(section.type)}
                                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                        {section.title}
                                      </h4>
                                    </div>
                                    <span className="text-xs font-bold text-slate-700 shrink-0">
                                      <Price amount={section.budget} />
                                    </span>
                                  </div>
                                  {section.notes && (
                                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                      {section.notes}
                                    </p>
                                  )}
                                  {section.activities && section.activities.length > 0 && (
                                    <div className="pt-2 space-y-1.5 border-t border-slate-200/60">
                                      {section.activities.map((act) => (
                                        <div
                                          key={act.id}
                                          className="flex items-center gap-2 text-xs text-slate-700"
                                        >
                                          {act.activity?.image_url && (
                                            <SafeImage
                                              src={act.activity.image_url}
                                              fallback={block.cityImageUrl}
                                              alt=""
                                              className="h-8 w-8 rounded-lg object-cover shrink-0"
                                            />
                                          )}
                                          <span className="font-semibold truncate">
                                            {act.custom_label || act.activity?.name}
                                          </span>
                                          {act.scheduled_time && (
                                            <span className="text-brand-600 font-bold shrink-0">
                                              {act.scheduled_time}
                                            </span>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
};

function DayHeaderContent({
  day,
  dayHero,
  exploreCityId,
  interactive = false,
}: {
  day: ItineraryDay;
  dayHero: string;
  exploreCityId?: number;
  interactive?: boolean;
}) {
  return (
    <div className="flex items-center gap-4 min-w-0">
      <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-xs">
        <SafeImage src={dayHero} fallback={DEFAULT_CITY_IMAGE} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg bg-brand-50 border border-brand-100 text-xs font-extrabold text-brand-700 px-1.5">
            D{day.day_number}
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 truncate">
            {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </h3>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <p className="text-xs text-slate-500 flex items-center gap-1 font-medium">
            <Calendar className="h-3 w-3 text-slate-400" />
            {day.sections.length} activit{day.sections.length === 1 ? 'y' : 'ies'}
          </p>
          {exploreCityId && interactive && (
            <Link
              to={cityActivitiesUrl(exploreCityId)}
              className="text-xs font-bold text-brand-600 hover:text-brand-700"
              onClick={(e) => e.stopPropagation()}
            >
              Explore →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyDayState({
  cityName,
  exploreCityId,
  interactive,
}: {
  cityName?: string;
  exploreCityId?: number;
  interactive: boolean;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center space-y-3">
      <p className="text-sm text-slate-600">Free day — no activities scheduled yet.</p>
      {interactive && exploreCityId && (
        <Link to={cityActivitiesUrl(exploreCityId)}>
          <Button size="sm" variant="outline" leftIcon={<Compass className="h-4 w-4" />}>
            Browse activities in {cityName}
          </Button>
        </Link>
      )}
    </div>
  );
}
