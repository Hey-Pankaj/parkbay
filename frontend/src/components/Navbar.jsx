import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  ShieldCheck, 
  Radio, 
  CalendarDays, 
  LayoutDashboard, 
  UserCircle, 
  LogOut, 
  Zap,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, onOpenAuthModal }) {
  const { user, isAdmin, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 bg-navy-950/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <div 
            onClick={() => setActiveTab('explore')} 
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Car className="w-6 h-6 text-navy-950" strokeWidth={2.5} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-mono">Park<span className="text-emerald-400">Bay</span></span>
              </div>
              <p className="text-[11px] text-slate-400 -mt-0.5">Automated Parking & Vision IoT</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => setActiveTab('explore')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'explore'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Car className="w-4 h-4" />
              Live Bays & Booking
            </button>

            <button
              onClick={() => setActiveTab('my-bookings')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'my-bookings'
                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <CalendarDays className="w-4 h-4" />
              My Bookings
            </button>

            {/* Admin-only panels */}
            {isAdmin && (
              <>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'admin'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-amber-400" />
                  Admin Center
                </button>

                <button
                  onClick={() => setActiveTab('iot-vision')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'iot-vision'
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Radio className="w-4 h-4 text-cyan-400 animate-pulse" />
                  IoT & Camera Vision
                </button>
              </>
            )}
          </nav>

          {/* User Controls */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-white/10">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5 justify-end">
                    {user.full_name}
                    {isAdmin ? (
                      <span className="px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded text-[10px]">
                        ADMIN
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 rounded text-[10px]">
                        DRIVER
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400">{user.email}</div>
                </div>

                <button
                  onClick={logout}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuthModal}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-semibold text-xs tracking-wide transition-all shadow-md shadow-emerald-500/20"
              >
                <UserCircle className="w-4 h-4" />
                Sign In / Register
              </button>
            )}
          </div>

        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="md:hidden flex items-center justify-around py-2 border-t border-white/5 bg-navy-950/90 text-xs">
        <button
          onClick={() => setActiveTab('explore')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'explore' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <Car className="w-4 h-4" />
          <span>Bays</span>
        </button>
        <button
          onClick={() => setActiveTab('my-bookings')}
          className={`flex flex-col items-center gap-1 ${activeTab === 'my-bookings' ? 'text-emerald-400' : 'text-slate-400'}`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Bookings</span>
        </button>
        {isAdmin && (
          <>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'admin' ? 'text-amber-400' : 'text-slate-400'}`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => setActiveTab('iot-vision')}
              className={`flex flex-col items-center gap-1 ${activeTab === 'iot-vision' ? 'text-cyan-400' : 'text-slate-400'}`}
            >
              <Radio className="w-4 h-4" />
              <span>IoT Sim</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
