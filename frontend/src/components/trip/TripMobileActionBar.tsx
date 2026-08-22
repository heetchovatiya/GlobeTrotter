import React from 'react';
import { Share2, Download, Hammer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../common/Button';
import { DownloadPlanButton } from '../trip/DownloadPlanButton';

interface TripMobileActionBarProps {
  tripId: number | string;
  onShare: () => void;
}

export const TripMobileActionBar: React.FC<TripMobileActionBarProps> = ({ tripId, onShare }) => {
  return (
    <div className="sm:hidden fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-30 px-3">
      <div className="flex items-center gap-2 rounded-2xl bg-white/95 backdrop-blur-lg border border-slate-200/80 shadow-elevated p-2">
        <DownloadPlanButton tripId={tripId} variant="outline" size="sm" />
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          leftIcon={<Share2 className="h-4 w-4" />}
          onClick={onShare}
        >
          Share
        </Button>
        <Link to={`/trips/${tripId}/build`} className="flex-1">
          <Button variant="primary" size="sm" className="w-full" leftIcon={<Hammer className="h-4 w-4" />}>
            Edit
          </Button>
        </Link>
      </div>
    </div>
  );
};
