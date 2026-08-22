import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import { ToastContainer } from './components/common/Toast';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { CreateTrip } from './pages/CreateTrip';
import { BuildItinerary } from './pages/BuildItinerary';
import { TripList } from './pages/TripList';
import { Profile } from './pages/Profile';
import { Search } from './pages/Search';
import { ItineraryView } from './pages/ItineraryView';
import { Community } from './pages/Community';
import { CalendarView } from './pages/CalendarView';
import { AdminPanel } from './pages/AdminPanel';
import { PublicTrip } from './pages/PublicTrip';

export function App() {
  const { checkAuth } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* Toast notifications portal */}
      <ToastContainer />

      {/* Top Navbar (hidden on dedicated auth pages for cleaner focus) */}
      {!isAuthPage && <Navbar />}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Routes>
          {/* Public Unauthenticated Routes */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search />} />
          <Route path="/community" element={<Community />} />
          <Route path="/calendar" element={<CalendarView />} />
          <Route path="/t/:slug" element={<PublicTrip />} />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/trips" element={<TripList />} />
            <Route path="/trips/new" element={<CreateTrip />} />
            <Route path="/trips/:id/build" element={<BuildItinerary />} />
            <Route path="/trips/:id" element={<ItineraryView />} />
            <Route path="/trips/:id/calendar" element={<CalendarView />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Role-Gated Admin Route */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      {/* Footer */}
      {!isAuthPage && <Footer />}

      {/* Mobile Bottom Navigation Bar (< 640px) */}
      {!isAuthPage && <BottomNav />}
    </div>
  );
}

export default App;

