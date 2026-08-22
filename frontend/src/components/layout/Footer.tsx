import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, Heart, Globe, Shield, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 pb-20 sm:pb-8 pt-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
          {/* Col 1 Brand */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-brand-500 flex items-center justify-center text-white">
                <Compass className="h-5 w-5" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Globe<span className="text-brand-400">Trotter</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Personalized multi-city travel planning, collaborative itineraries, and seamless budget management powered by FastAPI & React.
            </p>
          </div>

          {/* Col 2 Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/search" className="hover:text-white transition-colors">Destinations & Cities</Link></li>
              <li><Link to="/search?type=adventure" className="hover:text-white transition-colors">Adrenaline & Activities</Link></li>
              <li><Link to="/community" className="hover:text-white transition-colors">Travelers Community</Link></li>
              <li><Link to="/calendar" className="hover:text-white transition-colors">Calendar Timeline</Link></li>
            </ul>
          </div>

          {/* Col 3 Itineraries */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Itineraries</h4>
            <ul className="space-y-2 text-xs">
              <li><Link to="/trips/new" className="hover:text-white transition-colors">Create New Trip</Link></li>
              <li><Link to="/trips" className="hover:text-white transition-colors">My Ongoing & Upcoming Trips</Link></li>
              <li><Link to="/t/trip-share-1-alpine" className="hover:text-white transition-colors">Featured Shared Itinerary</Link></li>
              <li><Link to="/profile" className="hover:text-white transition-colors">Profile & Preferences</Link></li>
            </ul>
          </div>

          {/* Col 4 Tech & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">Architecture</h4>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs space-y-1.5 text-slate-300">
              <div className="flex items-center gap-1.5 text-brand-400 font-semibold">
                <Shield className="h-3.5 w-3.5" />
                <span>FastAPI + PostgreSQL</span>
              </div>
              <p className="text-[11px] text-slate-400">
                JWT Auth, SQLAlchemy ORM, Zustand state management, and Recharts analytics.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <p>© {new Date().getFullYear()} GlobeTrotter Inc. Built with love for worldwide explorers.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Globe className="h-3.5 w-3.5 text-brand-400" /> English (US)
            </span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

