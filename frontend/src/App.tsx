import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/authStore';

// Layout Components
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { Footer } from './components/layout/Footer';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { AdminRoute } from './components/layout/AdminRoute';
import { UserOnlyRoute } from './components/layout/UserOnlyRoute';
import { AdminRedirect } from './components/layout/AdminRedirect';
import { AdminNavbar } from './components/layout/AdminNavbar';
import { ToastContainer } from './components/common/Toast';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
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
import { TripConfirmed } from './pages/TripConfirmed';
import { TripPrint } from './pages/TripPrint';
import { TravelLedger } from './pages/TravelLedger';

export function App() {
  const { checkAuth, isAuthenticated, isAdmin, user } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAuthPage =
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/forgot-password';

  const isPrintPage = /\/trips\/\d+\/print$/.test(location.pathname);
  const isAdminUser = isAuthenticated && (isAdmin || user?.role === 'admin');
  const showTravelerChrome = !isAuthPage && !isPrintPage && !isAdminUser;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-brand-500 selection:text-white">
      {/* Toast notifications portal */}
      <ToastContainer />

      {/* Top Navbar */}
      {isAuthPage || isPrintPage ? null : isAdminUser ? <AdminNavbar /> : <Navbar />}

      {/* Main Content Area */}
      <main
        className={`flex-1 w-full mx-auto ${isPrintPage ? 'max-w-none px-0 pt-0' : 'max-w-7xl px-4 sm:px-6 lg:px-8 pt-6'}`}
      >
        <Routes>
          {/* Public traveler routes — admins are redirected to /admin */}
          <Route
            path="/"
            element={
              <AdminRedirect>
                <Dashboard />
              </AdminRedirect>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/search"
            element={
              <AdminRedirect>
                <Search />
              </AdminRedirect>
            }
          />
          <Route
            path="/community"
            element={
              <AdminRedirect>
                <Community />
              </AdminRedirect>
            }
          />
          <Route
            path="/calendar"
            element={
              <AdminRedirect>
                <CalendarView />
              </AdminRedirect>
            }
          />
          <Route path="/t/:slug" element={<PublicTrip />} />

          {/* Traveler-only protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<UserOnlyRoute />}>
              <Route path="/trips" element={<TripList />} />
              <Route path="/trips/new" element={<CreateTrip />} />
              <Route path="/trips/:id/confirmed" element={<TripConfirmed />} />
              <Route path="/trips/:id/print" element={<TripPrint />} />
              <Route path="/trips/:id/build" element={<BuildItinerary />} />
              <Route path="/trips/:id" element={<ItineraryView />} />
              <Route path="/trips/:id/calendar" element={<CalendarView />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/ledger" element={<TravelLedger />} />
            </Route>
          </Route>

          {/* Admin-only */}
          <Route element={<AdminRoute />}>
            <Route path="/admin" element={<AdminPanel />} />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to={isAdminUser ? '/admin' : '/'} replace />} />
        </Routes>
      </main>

      {showTravelerChrome && <Footer />}
      {showTravelerChrome && <BottomNav />}
    </div>
  );
}

export default App;

