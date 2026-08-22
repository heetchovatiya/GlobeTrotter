import React from 'react';
import { Link } from 'react-router-dom';
import { City } from '../../types';
import { SafeImage } from '../common/SafeImage';
import { DEFAULT_CITY_IMAGE } from '../../constants/images';
import { Star, MapPin, ArrowRight } from 'lucide-react';
import { costTierLabel, displayCostScore, displayPopularityScore } from '../../utils/currency';
import { ScoreMeter } from '../common/ScoreMeter';

interface CityCardProps {
  city: City;
}

export const CityCard: React.FC<CityCardProps> = ({ city }) => {
  const popularity = displayPopularityScore(city.popularity_score);
  const expense = displayCostScore(city.cost_index);
  const budgetLabel = costTierLabel(city.cost_index);

  return (
    <div className="group overflow-hidden rounded-2xl bg-white border border-slate-200/80 shadow-soft hover:shadow-card transition-all duration-300 flex flex-col">
      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
        <SafeImage
          src={city.image_url}
          fallback={DEFAULT_CITY_IMAGE}
          alt={city.name}
          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-3 right-3 rounded-full bg-slate-900/75 backdrop-blur-md px-2.5 py-1 flex items-center gap-1 text-white text-xs font-bold">
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          <span className="tabular-nums">{popularity}/10</span>
        </div>
        <div className="absolute bottom-3 left-3 rounded-xl bg-white/90 backdrop-blur-md px-2.5 py-1 flex items-center gap-1 text-slate-900 text-xs font-semibold">
          <MapPin className="h-3.5 w-3.5 text-brand-600" />
          <span>{city.country}</span>
        </div>
      </div>

      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between gap-4">
        <div>
          <h4 className="text-base font-bold text-slate-900 group-hover:text-brand-600 transition-colors line-clamp-1">
            {city.name}
          </h4>
          <p className="mt-1.5 text-xs text-slate-500 line-clamp-2 leading-relaxed">
            {city.description ||
              'Stunning destination offering rich cultural sights, local dining, and iconic attractions.'}
          </p>
        </div>

        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-3">
            <ScoreMeter
              label="Popular"
              value={popularity}
              barClassName="bg-amber-400"
              valueClassName="text-amber-600"
            />
            <ScoreMeter
              label="Expense"
              value={expense}
              hint={budgetLabel}
              barClassName="bg-emerald-500"
              valueClassName="text-emerald-600"
            />
          </div>

          <div className="flex items-center justify-end">
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
    </div>
  );
};
