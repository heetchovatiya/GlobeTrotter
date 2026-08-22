import React, { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { itineraryApi } from '../api/itinerary';
import { sharingApi } from '../api/sharing';
import { citiesApi } from '../api/cities';
import { City, ItineraryResponse } from '../types';
import { TripPrintView } from '../components/trip/TripPrintView';
import { Skeleton } from '../components/common/Skeleton';
import { Button } from '../components/common/Button';
import '../styles/print.css';

export const TripPrint: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [itinerary, setItinerary] = useState<ItineraryResponse | null>(null);
  const [cities, setCities] = useState<City[]>([]);
  const [shareUrl, setShareUrl] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([itineraryApi.getItinerary(id), citiesApi.getCities()])
      .then(async ([data, cityList]) => {
        setItinerary(data);
        setCities(cityList);
        try {
          const share = await sharingApi.shareTrip(id);
          setShareUrl(share.share_url);
        } catch {
          /* optional */
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (loading || !itinerary) return;
    if (searchParams.get('auto') === '1') {
      const timer = setTimeout(() => window.print(), 400);
      return () => clearTimeout(timer);
    }
  }, [loading, itinerary, searchParams]);

  if (loading || !itinerary) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="pb-16">
      <div className="no-print max-w-3xl mx-auto flex items-center justify-between gap-4 mb-6">
        <Link to={`/trips/${id}`}>
          <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
            Back to trip
          </Button>
        </Link>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<Printer className="h-4 w-4" />}
          onClick={() => window.print()}
        >
          Print / Save PDF
        </Button>
      </div>

      <TripPrintView itinerary={itinerary} cities={cities} shareUrl={shareUrl} />
    </div>
  );
};
