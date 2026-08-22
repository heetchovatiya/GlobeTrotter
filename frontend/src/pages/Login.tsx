import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { useUIStore } from '../store/uiStore';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Compass, Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error } = useAuthStore();
  const { showToast } = useUIStore();

  const [email, setEmail] = useState('alex.morgan@example.com');
  const [password, setPassword] = useState('password123');

  const from = (location.state as any)?.from?.pathname || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      showToast('success', 'Welcome back to GlobeTrotter!');
      navigate(from, { replace: true });
    }
  };

  const handleDemoFill = (role: 'user' | 'admin') => {
    if (role === 'admin') {
      setEmail('admin@globetrotter.com');
      setPassword('adminPass123!');
    } else {
      setEmail('traveler@globetrotter.com');
      setPassword('secretPass123!');
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-brand-50/50 via-slate-50 to-slate-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 sm:p-10 rounded-3xl shadow-card border border-slate-100 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 items-center justify-center text-white shadow-lg shadow-brand-500/30">
            <Compass className="h-8 w-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign in to Globe<span className="text-brand-600">Trotter</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Access your personalized travel itineraries and budget plans
          </p>
        </div>

        {/* Demo Fast Logins */}
        <div className="rounded-2xl bg-slate-50 p-3 border border-slate-200/60 flex items-center justify-between text-xs">
          <span className="font-semibold text-slate-600 flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" /> Quick Demo Fill:
          </span>
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => handleDemoFill('admin')}
              className="px-2.5 py-1 rounded-lg bg-purple-100 text-purple-700 font-bold hover:bg-purple-200 transition-colors"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoFill('user')}
              className="px-2.5 py-1 rounded-lg bg-teal-100 text-teal-700 font-bold hover:bg-teal-200 transition-colors"
            >
              Explorer
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email or Username"
            type="email"
            required
            leftIcon={<Mail className="h-4 w-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />

          <Input
            label="Password"
            type="password"
            required
            leftIcon={<Lock className="h-4 w-4" />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full shadow-md shadow-brand-500/25"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="h-4 w-4" />}
          >
            Sign In
          </Button>
        </form>

        {/* Footer */}
        <div className="text-center pt-2 border-t border-slate-100 text-xs text-slate-500">
          Don't have an account yet?{' '}
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-700 underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  );
};

