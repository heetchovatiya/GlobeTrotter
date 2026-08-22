import React from 'react';
import { ItineraryResponse } from '../../types';
import { Price } from '../common/Price';
import { TripTicketCard } from './TripTicketCard';
import { formatTripDuration } from '../../utils/validation';

interface TripPrintViewProps {
  itinerary: ItineraryResponse;
  shareUrl?: string;
}

export const TripPrintView: React.FC<TripPrintViewProps> = ({ itinerary, shareUrl }) => {
  const { trip, days, budget } = itinerary;
  const duration = formatTripDuration(trip.start_date, trip.end_date);

  return (
    <div className="print-view max-w-3xl mx-auto bg-white text-slate-900 p-6 sm:p-10 space-y-8">
      <TripTicketCard itinerary={itinerary} shareUrl={shareUrl} />

      {trip.description && (
        <section>
          <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-2">Overview</h3>
          <p className="text-sm text-slate-700 leading-relaxed">{trip.description}</p>
        </section>
      )}

      <section>
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">
          Day-by-day plan ({duration})
        </h3>
        <div className="space-y-4">
          {days.map((day) => (
            <div key={day.date} className="break-inside-avoid border border-slate-200 rounded-xl p-4">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-slate-900">
                  Day {day.day_number} —{' '}
                  {new Date(day.date + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </h4>
                {day.city_name && (
                  <span className="text-xs font-semibold text-brand-700">{day.city_name}</span>
                )}
              </div>
              {day.sections.length === 0 ? (
                <p className="text-xs text-slate-400">No sections scheduled.</p>
              ) : (
                <ul className="space-y-2">
                  {day.sections.map((section) => (
                    <li
                      key={`${day.date}-${section.id}-${section.title}`}
                      className="flex flex-wrap justify-between gap-2 text-sm border-b border-slate-100 pb-2 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">{section.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{section.type}</p>
                        {section.notes && (
                          <p className="text-xs text-slate-500 mt-0.5">{section.notes}</p>
                        )}
                      </div>
                      <span className="text-xs font-bold text-emerald-700 whitespace-nowrap">
                        <Price amount={section.budget || 0} />
                      </span>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 text-xs font-semibold text-slate-600">
                Day total: <Price amount={day.total_cost} />
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="break-inside-avoid">
        <h3 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Budget summary</h3>
        <table className="w-full text-sm border-collapse">
          <tbody>
            <tr className="border-b border-slate-200">
              <td className="py-2 font-medium">Total planned</td>
              <td className="py-2 text-right font-bold">
                <Price amount={budget.total_budget} />
              </td>
            </tr>
            <tr className="border-b border-slate-200">
              <td className="py-2 font-medium">Spent</td>
              <td className="py-2 text-right font-bold">
                <Price amount={budget.total_spent} />
              </td>
            </tr>
            <tr>
              <td className="py-2 font-medium">Remaining</td>
              <td className="py-2 text-right font-bold text-emerald-700">
                <Price amount={budget.remaining_budget} />
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <footer className="text-center text-[10px] text-slate-400 pt-4 border-t border-slate-200">
        Printed from GlobeTrotter · {new Date().toLocaleString()}
      </footer>
    </div>
  );
};
