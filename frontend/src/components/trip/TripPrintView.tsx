import React from 'react';
import { City, ItineraryResponse } from '../../types';
import { Price } from '../common/Price';
import { TripTicketCard } from './TripTicketCard';
import { ItineraryCityTimeline } from './ItineraryCityTimeline';
import { formatTripDuration } from '../../utils/validation';

interface TripPrintViewProps {
  itinerary: ItineraryResponse;
  cities: City[];
  shareUrl?: string;
}

export const TripPrintView: React.FC<TripPrintViewProps> = ({ itinerary, cities, shareUrl }) => {
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
          Itinerary by city ({duration})
        </h3>
        <ItineraryCityTimeline days={days} cities={cities} variant="print" />
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
