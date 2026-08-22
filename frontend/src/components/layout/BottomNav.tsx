import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, MapPin, PlusCircle, Users, User, Calendar } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated } = useAuthStore();

  const navItems = [
    { label: 'Explore', path: '/search', icon: Compass },
    { label: 'My Trips', path: '/trips', icon: MapPin },
    { label: 'Plan', path: '/trips/new', icon: PlusCircle, isPrimary: true },
    { label: 'Feed', path: '/community', icon: Users },
    { label: 'Profile', path: isAuthenticated ? '/profile' : '/login', icon: User },
  ];

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/trips') {
      return (
        location.pathname === '/trips' ||
        (location.pathname.startsWith('/trips/') &&
          !location.pathname.startsWith('/trips/new'))
      );
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200/80 px-2 py-1 shadow-lg">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          if (item.isPrimary) {
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex flex-col items-center -mt-5 group"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-to-tr from-brand-700 to-brand-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/40 group-active:scale-95 transition-transform">
                  <Icon className="h-6 w-6" />
                </div>
                <span className="text-[10px] font-bold text-brand-700 mt-1">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-1 px-3 rounded-xl transition-colors ${
                active ? 'text-brand-600 font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`h-5 w-5 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

