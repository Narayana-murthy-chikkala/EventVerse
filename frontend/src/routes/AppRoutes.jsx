import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ProtectedRoute from '../components/ProtectedRoute';

import Welcome from '../pages/Welcome';
import Home from '../pages/Home';
import Events from '../pages/Events';
import EventDetails from '../pages/EventDetails';
import Gallery from '../pages/Gallery';
import About from '../pages/About';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Dashboard from '../pages/Dashboard';
import Profile from '../pages/Profile';
import AdminDashboard from '../pages/AdminDashboard';
import ForgotPassword from '../pages/ForgotPassword';
import PaymentPage from '../pages/PaymentPage';
import GoogleSuccess from '../pages/GoogleSuccess';

const NotFound = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#020408] px-4 text-white">
    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white/5 border border-white/10 shadow-glass mb-6">
      <span className="text-4xl">🪔</span>
    </div>

    <h1 className="text-[5rem] md:text-[6rem] font-black tracking-tight mb-4 text-transparent bg-clip-text bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300">
      404
    </h1>

    <p className="text-lg text-white/60 mb-8 max-w-xl text-center">
      The path you are looking for has drifted beyond the aurora.
      Let us guide you back to the festival.
    </p>

    <Link
      to="/home"
      className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-400 text-white rounded-full font-semibold hover:shadow-glow-primary transition-all duration-300"
    >
      Return Home
    </Link>
  </div>
);

const AppRoutes = () => {
  const { user } = useAuth();
  const location = useLocation();

  const hideLayoutRoutes = ['/', '/google-success'];

  const shouldHideLayout = hideLayoutRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Navbar */}
      {!shouldHideLayout && <Navbar />}

      {/* Main Content */}
      <main className={`flex-1 ${shouldHideLayout ? '' : 'pt-16'}`}>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Welcome />} />

          <Route path="/home" element={<Home />} />

          <Route
            path="/login"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login />
              )
            }
          />

          <Route
            path="/register"
            element={
              user ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Register />
              )
            }
          />

          <Route
            path="/google-success"
            element={<GoogleSuccess />}
          />

          <Route path="/events" element={<Events />} />

          <Route
            path="/events/:id"
            element={<EventDetails />}
          />

          <Route path="/gallery" element={<Gallery />} />

          <Route path="/about-us" element={<About />} />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          {/* Protected User Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/profile"
              element={<Profile />}
            />

            <Route
              path="/payment/:registrationId"
              element={<PaymentPage />}
            />
          </Route>

          {/* Admin Routes */}
          <Route element={<ProtectedRoute adminOnly />}>
            <Route
              path="/admin"
              element={<AdminDashboard />}
            />
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer */}
      {!shouldHideLayout && <Footer />}
    </div>
  );
};

export default AppRoutes;