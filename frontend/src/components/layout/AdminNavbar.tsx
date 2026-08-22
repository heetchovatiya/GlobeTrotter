import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../common/Button';
import { Compass, LogOut, ShieldCheck } from 'lucide-react';

export const AdminNavbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900 text-white border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/admin" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center shadow-md">
              <Compass className="h-5 w-5 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-extrabold tracking-tight leading-none">
                Globe<span className="text-purple-300">Trotter</span>
              </span>
              <span className="text-[10px] uppercase font-bold text-purple-400 tracking-wider flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" /> Admin Panel
              </span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-xs text-slate-400">{user?.email}</span>
            <Button
              size="sm"
              variant="outline"
              className="border-slate-600 text-white hover:bg-slate-800 bg-transparent"
              leftIcon={<LogOut className="h-4 w-4" />}
              onClick={handleLogout}
            >
              Sign out
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
