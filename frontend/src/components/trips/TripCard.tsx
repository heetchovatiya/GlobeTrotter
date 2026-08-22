import React from 'react';
import { Link } from 'react-router-dom';
import { Trip } from '../../types';
import { Badge } from '../common/Badge';
import { Calendar, MapPin, ArrowRight, DollarSign, Share2, Edit3 } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { sharingApi } from '../../api/sharing';

interface TripCardProps {
  trip: Trip;
  onDelete?: (id: number) => void;
  compact?: boolean;
}

export const TripCard: React.FC<TripCardProps> = ({ trip, compact = false }) => {
  const { showToast } = useUIStore();

  const getStatusBadge = (status: Trip['status']) => {
    switch (status) {
      case 'ongoing':
        return <Badge variant="success">Ongoing</Badge>;
      case 'upcoming':
        return <Badge variant="info">Upcoming</Badge>;
      case 'completed':
        return <Badge variant="default">Completed</Badge>;
      default:
        return <Badge variant="warning">Planning</Badge>;
    }
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const res = await sharingApi.shareTrip(trip.id);
      navigator.clipboard.writeText(res.share_url);
      showToast('success', 'Public share link copied to clipboard!');
    } catch {
      showToast('info', 'Share link generated!');
    }
  };

  const formattedDates = `${new Date(trip.start_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })} – ${new Date(trip.end_date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}`;

  if (compact) {
    return (
      <Link
        to={`/trips/${trip.id}`}
        className="group flex flex-col overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-200"
      >
        <div className="relative h-36 w-full overflow-hidden bg-slate-100">
          <img
            src={trip.cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=600&auto=format&fit=crop&q=80'}
            alt={trip.name}
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-2.5 right-2.5">
            {getStatusBadge(trip.status)}
          </div>
        </div>
        <div className="p-4 flex flex-col flex-1 justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-brand-600 transition-colors">
              {trip.name}
            </h4>
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              <span>{formattedDates}</span>
            </div>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-brand-600 font-semibold">
            <span>View Itinerary</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div className="group relative flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-200">
      {/* Cover Image */}
      <div className="relative h-48 md:h-auto md:w-72 flex-shrink-0 overflow-hidden bg-slate-100">
        <img
          src={trip.cover_photo_url || 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80'}
          alt={trip.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-3 left-3 md:hidden">
          {getStatusBadge(trip.status)}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-5 md:p-6 flex flex-col justify-between gap-4">
        <div>
          <div className="hidden md:flex items-center justify-between mb-2">
            {getStatusBadge(trip.status)}
            <button
              onClick={handleShare}
              title="Share Trip"
              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-50 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>
          </div>

          <Link to={`/trips/${trip.id}`}>
            <h3 className="text-lg md:text-xl font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {trip.name}
            </h3>
          </Link>

          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs font-medium text-slate-500">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-brand-500" />
              <span>{formattedDates}</span>
            </div>
            {trip.total_budget ? (
              <div className="flex items-center gap-1">
                <DollarSign className="h-4 w-4 text-emerald-500" />
                <span>Budget: ${trip.total_budget.toLocaleString()}</span>
              </div>
            ) : null}
          </div>

          <p className="mt-3 text-xs md:text-sm text-slate-600 line-clamp-2 leading-relaxed">
            {trip.description || 'Personalized trip itinerary curated with custom stops, activities, and daily schedules.'}
          </p>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 gap-2">
          <Link
            to={`/trips/${trip.id}/build`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Sections</span>
          </Link>

          <Link
            to={`/trips/${trip.id}`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-xl shadow-xs transition-all active:scale-95"
          >
            <span>View Full Itinerary</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

