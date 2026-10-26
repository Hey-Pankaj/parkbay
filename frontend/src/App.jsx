import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { api } from './services/api';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import ParkingLotView from './components/ParkingLotView';
import BookingModal from './components/BookingModal';
import WaitlistModal from './components/WaitlistModal';
import AuthModal from './components/AuthModal';
import MyBookingsPage from './pages/MyBookingsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import IoTVisionPage from './pages/IoTVisionPage';

import { 
  ShieldCheck, 
  Car, 
  Zap, 
  Radio, 
  Database, 
  Cpu, 
  ExternalLink 
} from 'lucide-react';

function getInitialStartTime() {
  const now = new Date();
  const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  return localIso;
}

function MainApp() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  
  // View states when unauthenticated: 'landing' | 'login'
  const [unauthView, setUnauthView] = useState('landing');
  const [loginInitialRole, setLoginInitialRole] = useState('driver');

  // Dashboard active tab: 'explore' | 'my-bookings' | 'iot-vision' | 'admin'
  const [activeTab, setActiveTab] = useState(isAdmin ? 'admin' : 'explore');
  
  // Facilities & Slots
  const [facilities, setFacilities] = useState([]);
  const [selectedFacility, setSelectedFacility] = useState(null);
  
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  
  const [startTime, setStartTime] = useState(getInitialStartTime);
  const [durationHours, setDurationHours] = useState(2);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Modals
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isWaitlistModalOpen, setIsWaitlistModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Sync default tab when user role changes
  useEffect(() => {
    if (user) {
      if (isAdmin) {
        // Admins only access 'admin', 'iot-vision', and 'explore' (no my-bookings)
        if (!['admin', 'iot-vision', 'explore'].includes(activeTab)) {
          setActiveTab('admin');
        }
      } else {
        // Driver / regular user strictly only accesses 'explore' or 'my-bookings'
        if (activeTab === 'admin' || activeTab === 'iot-vision') {
          setActiveTab('explore');
        }
      }
    }
  }, [user, isAdmin, activeTab]);

  // 1. Fetch Facilities
  useEffect(() => {
    fetchFacilities();
  }, []);

  const fetchFacilities = async () => {
    try {
      const res = await api.getFacilities();
      if (res.facilities && res.facilities.length > 0) {
        setFacilities(res.facilities);
        if (!selectedFacility) {
          setSelectedFacility(res.facilities[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching facilities:', err);
    }
  };

  // 2. Fetch Slots for selected facility and time window
  useEffect(() => {
    if (selectedFacility && isAuthenticated) {
      fetchFacilitySlots(selectedFacility.id, startTime, durationHours);
    }
  }, [selectedFacility, startTime, durationHours, isAuthenticated]);

  const fetchFacilitySlots = async (facilityId, start, hours) => {
    setIsLoadingSlots(true);
    try {
      const startDate = new Date(start);
      const endDate = new Date(startDate.getTime() + (hours * 3600000));
      const res = await api.getFacilitySlots(facilityId, startDate.toISOString(), endDate.toISOString());
      setSlots(res.slots || []);
    } catch (err) {
      console.error('Error fetching facility slots:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Background polling for real-time status when logged in
  useEffect(() => {
    if (!isAuthenticated || !selectedFacility) return;
    const timer = setInterval(() => {
      if (activeTab === 'explore') {
        const startDate = new Date(startTime);
        const endDate = new Date(startDate.getTime() + (durationHours * 3600000));
        api.getFacilitySlots(selectedFacility.id, startDate.toISOString(), endDate.toISOString())
          .then(res => {
            if (res.slots) setSlots(res.slots);
          })
          .catch(() => {});
      }
    }, 10000);
    return () => clearInterval(timer);
  }, [selectedFacility, startTime, durationHours, activeTab, isAuthenticated]);

  const handleSelectSlot = (slot) => {
    if (slot.busy || slot.status === 'maintenance') return;
    setSelectedSlot(slot);
    setIsBookingModalOpen(true);
  };

  const handleAutoAssign = () => {
    const available = slots.filter(s => !s.busy && s.status === 'available');
    if (available.length > 0) {
      setSelectedSlot(available[0]);
      setIsBookingModalOpen(true);
    } else {
      setIsWaitlistModalOpen(true);
    }
  };

  const handleBookingSuccess = (newBooking) => {
    if (selectedFacility) {
      fetchFacilitySlots(selectedFacility.id, startTime, durationHours);
    }
    fetchFacilities();
  };

  const handleGoToLogin = (role = 'driver') => {
    setLoginInitialRole(role);
    setUnauthView('login');
  };

  // =========================================================================
  // VIEW ROUTING
  // 1. If not authenticated: show Landing Page OR Login Page
  // 2. If authenticated: show Dashboard
  // =========================================================================

  if (!isAuthenticated) {
    if (unauthView === 'login') {
      return (
        <LoginPage
          onBackToLanding={() => setUnauthView('landing')}
          initialRole={loginInitialRole}
        />
      );
    }

    // Default: Branded Landing Page
    return (
      <LandingPage
        onGoToLogin={handleGoToLogin}
        facilities={facilities}
        onSelectFacility={(fac) => {
          setSelectedFacility(fac);
          handleGoToLogin('driver');
        }}
      />
    );
  }

  // Authenticated: Dashboard View
  return (
    <div className="min-h-screen flex flex-col bg-navy-950 text-slate-100 selection:bg-emerald-500 selection:text-navy-950">
      
      {/* Dashboard Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
      />

      {/* Main Dashboard Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Explore Bays & Live Floor Map Tab */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            
            {/* Dashboard Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-glass-card border border-white/10 rounded-3xl p-6 shadow-xl">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${isAdmin ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
                  <span className={`text-xs uppercase font-bold tracking-widest ${isAdmin ? 'text-amber-400' : 'text-emerald-400'} font-mono`}>
                    {isAdmin ? 'PARKBAY ADMINISTRATOR CONSOLE' : 'PARKBAY DRIVER DASHBOARD'}
                  </span>
                </div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Welcome back, {user?.full_name || (isAdmin ? 'Admin' : 'Driver')}!
                </h1>
                <p className="text-xs text-slate-400">
                  {isAdmin 
                    ? 'Oversee live bay occupancies, audit vehicle allotments, and manage user configurations.'
                    : 'Select your destination facility, adjust your duration, and reserve your bay.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {isAdmin ? (
                  <button
                    onClick={() => setActiveTab('admin')}
                    className="px-4 py-2 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/30 text-xs font-semibold transition-all"
                  >
                    Manage Allotments & Users
                  </button>
                ) : (
                  <button
                    onClick={() => setActiveTab('my-bookings')}
                    className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
                  >
                    View My Passes
                  </button>
                )}
              </div>
            </div>

            {/* Architectural Interactive Parking Map */}
            <ParkingLotView
              facilities={facilities}
              selectedFacility={selectedFacility}
              onSelectFacility={(fac) => setSelectedFacility(fac)}
              slots={slots}
              selectedSlot={selectedSlot}
              onSelectSlot={handleSelectSlot}
              startTime={startTime}
              setStartTime={setStartTime}
              durationHours={durationHours}
              setDurationHours={setDurationHours}
              isLoading={isLoadingSlots}
              onRefresh={() => fetchFacilitySlots(selectedFacility?.id, startTime, durationHours)}
              onAutoAssign={handleAutoAssign}
              onOpenWaitlistModal={() => setIsWaitlistModalOpen(true)}
            />
          </div>
        )}

        {/* My Bookings Page (Drivers only) */}
        {activeTab === 'my-bookings' && !isAdmin && (
          <MyBookingsPage
            onGoToExplore={() => setActiveTab('explore')}
          />
        )}

        {/* IoT Sensor & Camera Vision Page (Restricted to Facility Admin) */}
        {activeTab === 'iot-vision' && isAdmin && (
          <IoTVisionPage
            slots={slots}
            onRefreshSlots={() => {
              if (selectedFacility) fetchFacilitySlots(selectedFacility.id, startTime, durationHours);
            }}
          />
        )}

        {/* Admin Dashboard Page (Restricted to Facility Admin) */}
        {activeTab === 'admin' && isAdmin && (
          <AdminDashboardPage
            facilities={facilities}
            onRefreshFacilities={fetchFacilities}
          />
        )}

      </main>

      {/* Booking Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        slot={selectedSlot}
        facility={selectedFacility}
        startTime={startTime}
        durationHours={durationHours}
        onBookingSuccess={handleBookingSuccess}
      />

      {/* Waitlist Modal */}
      <WaitlistModal
        isOpen={isWaitlistModalOpen}
        onClose={() => setIsWaitlistModalOpen(false)}
        facility={selectedFacility}
      />

      {/* Auth Modal (if user wants to switch account from dashboard) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />

      {/* Dashboard Footer */}
      <footer className="border-t border-white/10 bg-navy-950/80 mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">ParkBay</span>
            <span>• Smart Parking Management & Reservation System</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <Database className="w-3.5 h-3.5" /> MySQL / SQLAlchemy
            </span>
            <span className="flex items-center gap-1 text-cyan-400">
              <Cpu className="w-3.5 h-3.5" /> Python Flask REST
            </span>
            <span className="flex items-center gap-1 text-blue-400">
              <Car className="w-3.5 h-3.5" /> React 18 + Tailwind
            </span>
            <span className="flex items-center gap-1 text-amber-400">
              <Radio className="w-3.5 h-3.5" /> IoT & ANPR Vision
            </span>
          </div>

          <div className="text-slate-500">
            © 2026 ParkBay. All rights reserved.
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
