import React from 'react';
import { Link } from 'react-router-dom';
import { City } from '../../types';
import { Star, MapPin, DollarSign, ArrowRight } from 'lucide-react';

interface CityCardProps {
  city: City;
}

export const CityCard: React.FC<CityCardProps> = ({ city }) => {
  return (
    <div className="group overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <img
          src={city.image_url}
          alt={city.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 rounded-full bg-slate-900/70 backdrop-blur-md px-2.5 py-1 flex items-center gap-1 text-white text-xs font-bold">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span>{city.popularity_score}</span>
        </div>
        <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 backdrop-blur-md px-2.5 py-1 flex items-center gap-1 text-slate-900 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5 text-brand-600" />
          <span>{city.country}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-3">
        <div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {city.name}
          </h4>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {city.description || 'Stunning destination offering rich cultural sights, local dining, and iconic attractions.'}
          </p>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1 text-xs text-slate-600 font-medium">
            <span>Cost index:</span>
            <span className="text-emerald-600 font-bold">
              {'$'.repeat(city.cost_index)}
            </span>
          </div>

          <Link
            to={`/search?city_id=${city.id}`}
            className="inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:text-brand-700 group-hover:translate-x-0.5 transition-transform"
          >
            <span>Explore</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};

