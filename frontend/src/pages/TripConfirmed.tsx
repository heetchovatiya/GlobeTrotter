import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Hammer, List, Download } from 'lucide-react';
import { itineraryApi } from '../api/itinerary';
import { sharingApi } from '../api/sharing';
import { ItineraryResponse } from '../types';
import { TripTicketCard } from '../components/trip/TripTicketCard';
import { DownloadPlanButton } from '../components/trip/DownloadPlanButton';
import { Button } from '../components/common/Button';
import { Skeleton } from '../components/common/Skeleton';

export const TripConfirmed: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      try {
        const data = await itineraryApi.getItinerary(id);
        setItinerary(data);
        try {
          const share = await sharingApi.shareTrip(id);
          setShareUrl(share.share_url);
        } catch {
          setShareUrl(undefined);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading || !itinerary) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 pb-16">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-20">
      <div className="text-center space-y-3 pt-4">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto">
          <CheckCircle2 className="h-9 w-9" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Trip confirmed!</h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your travel plan is saved. Download your ticket-style summary or continue building the
          itinerary.
        </p>
      </div>

      <TripTicketCard itinerary={itinerary} shareUrl={shareUrl} />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to={`/trips/${id}/build`} className="sm:col-span-2">
          <Button
            variant="primary"
            size="lg"
            className="w-full shadow-md shadow-brand-500/20"
            rightIcon={<Hammer className="h-4 w-4" />}
          >
            Build full itinerary
          </Button>
        </Link>

        <div className="flex justify-center sm:justify-start">
          <DownloadPlanButton tripId={id!} variant="outline" size="md" />
        </div>

        <Link to={`/trips/${id}`} className="flex">
          <Button
            variant="outline"
            size="md"
            className="w-full"
            leftIcon={<List className="h-4 w-4" />}
          >
            View trip
          </Button>
        </Link>

        <Link to="/trips" className="sm:col-span-2 flex">
          <Button variant="ghost" size="md" className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Go to My Trips
          </Button>
        </Link>
      </div>

      <p className="text-center text-xs text-slate-400 flex items-center justify-center gap-1">
        <Download className="h-3.5 w-3.5" />
        Use Print / Save as PDF to keep an offline copy
      </p>
    </div>
  );
};
