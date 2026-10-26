import React from 'react';
import { 
  Car, 
  ShieldCheck, 
  Radio, 
  Zap, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  QrCode,
  LayoutDashboard,
  Cpu,
  Database,
  Lock
} from 'lucide-react';

export default function LandingPage({ onGoToLogin, facilities, onSelectFacility }) {
  return (
    <div className="min-h-screen bg-navy-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-navy-950">
      
      {/* 1. BRANDED NAVBAR */}
      <header className="sticky top-0 z-50 bg-navy-950/85 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            
            {/* Logo */}
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/25 group-hover:scale-105 transition-transform">
                <Car className="w-6 h-6 text-navy-950" strokeWidth={2.5} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-extrabold tracking-tight text-white font-mono">
                    Park<span className="text-emerald-400">Bay</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 -mt-0.5">Smart Parking Management & Reservation</p>
              </div>
            </div>

            {/* Navigation links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-emerald-400 transition-colors">How It Works</a>
              <a href="#facilities" className="hover:text-emerald-400 transition-colors">Locations</a>
              <a href="#tech" className="hover:text-emerald-400 transition-colors">Architecture</a>
            </nav>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onGoToLogin('driver')}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 transition-all"
              >
                Driver Sign In
              </button>

              <button
                onClick={() => onGoToLogin('admin')}
                className="hidden sm:inline-flex px-4 py-2 rounded-xl text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all"
              >
                Admin Portal
              </button>

              <button
                onClick={() => onGoToLogin('driver')}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-navy-950 font-bold text-xs tracking-wide shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </div>
      </header>

      {/* 2. HERO SECTION WITH USER UPLOADED PARKING GARAGE BACKGROUND */}
      <section className="relative pt-24 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        
        {/* User uploaded smart car parking background image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-60 scale-105 pointer-events-none transition-transform duration-1000"
          style={{
            backgroundImage: `url('/parking-bg.jpg')`
          }}
        ></div>
        <div className="absolute inset-0 bg-gradient-to-b from-navy-950/60 via-navy-950/80 to-navy-950 pointer-events-none"></div>

        {/* Ambient Gradient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-emerald-500/20 via-teal-500/15 to-cyan-500/20 blur-[120px] pointer-events-none rounded-full"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-cyan-500/15 blur-[140px] pointer-events-none rounded-full"></div>

        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.15]">
            The Smart Parking Ecosystem <br />
            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
              Built for Modern Cities
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Eliminate endless circling and parking frustration. Check live bay availability, book EV-equipped slots in advance, and drive straight through barrier gates with automated camera plate recognition.
          </p>

          {/* Call-to-action buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <button
              onClick={() => onGoToLogin('driver')}
              className="flex items-center gap-2.5 px-7 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 hover:from-emerald-400 hover:to-teal-300 text-navy-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] transition-all"
            >
              <Car className="w-4 h-4" />
              <span>Launch Driver Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onGoToLogin('admin')}
              className="flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white border border-white/15 font-bold text-sm tracking-wide transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-amber-400" />
              <span>Facility Admin Portal</span>
            </button>
          </div>

          {/* Trust & Performance Metrics Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-12 max-w-4xl mx-auto text-left">
            
            <div className="bg-glass-card p-4 rounded-2xl border border-white/10">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">99.4%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">ANPR Vision Accuracy</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Automated barrier lifts</div>
            </div>

            <div className="bg-glass-card p-4 rounded-2xl border border-white/10">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-cyan-400">&lt; 30s</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Instant Slot Booking</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Zero waiting or paperwork</div>
            </div>

            <div className="bg-glass-card p-4 rounded-2xl border border-white/10">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-400">100%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">IoT Ultrasonic Sensing</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Sub-centimeter accuracy</div>
            </div>

            <div className="bg-glass-card p-4 rounded-2xl border border-white/10">
              <div className="text-2xl sm:text-3xl font-extrabold font-mono text-white">40%</div>
              <div className="text-xs text-slate-300 font-semibold mt-1">Time & Fuel Saved</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Guaranteed reserved space</div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. CORE FEATURES PILLARS */}
      <section id="features" className="py-20 bg-navy-900/40 border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
              ENGINEERED FOR URBAN PRECISION
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Four Pillars of Smart Parking
            </h2>
            <p className="text-sm text-slate-400">
              ParkBay merges advanced software availability algorithms with real hardware sensor telemetry and optical vision.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Pillar 1 */}
            <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-emerald-500/50 transition-all group space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Time-Based Slot Reservations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check slot availability for precise booking intervals. Automatic collision prevention guarantees no double-booking ever occurs.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-cyan-500/50 transition-all group space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover:scale-110 transition-transform">
                <Radio className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Camera ANPR Barrier Entry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                High-speed Optical Character Recognition reads vehicle license plates at the barrier gate, validating bookings and opening the gate automatically.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-amber-500/50 transition-all group space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">EV Charging & Slot Types</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Filter and reserve specialized spaces including Level-2 EV Fast Chargers, SUV bays, Accessible bays, and Compact commuter spaces.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="bg-glass-card p-6 rounded-3xl border border-white/10 hover:border-blue-500/50 transition-all group space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Central Admin Analytics</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Comprehensive oversight with real-time occupancy percentages, today's revenue calculations, bay status toggles, and audit logs.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 4. HOW IT WORKS WORKFLOW */}
      <section id="how-it-works" className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold uppercase tracking-widest text-cyan-400 font-mono">
              EFFORTLESS 3-STEP JOURNEY
            </span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              How ParkBay Works
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            
            {/* Step 1 */}
            <div className="bg-glass-card p-8 rounded-3xl border border-white/10 relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-emerald-400 font-mono text-xl font-bold flex items-center justify-center">
                01
              </div>
              <h3 className="font-bold text-white text-lg">Pick Facility & Slot</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Select from premium commercial and transit locations. View live floor plans of Block A & B and select an open green bay or use Auto-Assign.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-glass-card p-8 rounded-3xl border border-white/10 relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-cyan-400 font-mono text-xl font-bold flex items-center justify-center">
                02
              </div>
              <h3 className="font-bold text-white text-lg">Instant Reserve & Pay</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter vehicle license plate and choose your duration. The engine calculates base rates plus GST and generates a digital parking pass.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-glass-card p-8 rounded-3xl border border-white/10 relative space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 text-amber-400 font-mono text-xl font-bold flex items-center justify-center">
                03
              </div>
              <h3 className="font-bold text-white text-lg">Automated Camera Entry</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Drive up to the facility gate. The high-resolution ANPR camera verifies your vehicle plate in real-time and opens the boom barrier.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* 5. LOCATIONS PREVIEW */}
      <section id="facilities" className="py-20 bg-navy-900/30 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400 font-mono">
                LOCATIONS READY FOR BOOKING
              </span>
              <h2 className="text-3xl font-extrabold text-white tracking-tight mt-1">
                Featured Smart Facilities
              </h2>
            </div>

            <button
              onClick={() => onGoToLogin('driver')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-bold flex items-center gap-1.5 self-start sm:self-auto"
            >
              <span>Explore All Locations & Floor Plans</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {facilities.map((fac) => (
              <div
                key={fac.id}
                className="bg-glass-card border border-white/10 rounded-3xl overflow-hidden hover:border-white/25 transition-all group flex flex-col justify-between"
              >
                <div className="h-48 overflow-hidden relative">
                  <img
                    src={fac.image_url}
                    alt={fac.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-navy-950/80 backdrop-blur-md border border-white/10 text-xs font-bold font-mono text-emerald-400">
                    ₹{fac.base_rate_per_hour}/hr
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-white text-base group-hover:text-emerald-400 transition-colors">
                      {fac.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{fac.address}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-2">
                      {fac.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs text-emerald-400 font-mono font-bold">
                      {fac.available_slots ?? fac.total_slots} Bays Available
                    </span>

                    <button
                      onClick={() => onGoToLogin('driver')}
                      className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500 hover:text-navy-950 text-white border border-white/10 text-xs font-bold transition-all"
                    >
                      Book Bay
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. TECHNOLOGY ARCHITECTURE HIGHLIGHT */}
      <section id="tech" className="py-16 border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-slate-300 font-mono">
            <Cpu className="w-3.5 h-3.5 text-emerald-400" />
            <span>FULL PRODUCTION TECHNOLOGY STACK</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            Built with Scalable Modern Technologies
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-emerald-400 font-bold mb-1">React 18 + Vite</div>
              <div className="text-slate-400">Tailwind CSS & Lucide UI</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-cyan-400 font-bold mb-1">Python & Flask</div>
              <div className="text-slate-400">REST APIs & CORS</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-amber-400 font-bold mb-1">MySQL + SQLAlchemy</div>
              <div className="text-slate-400">Relational DDL & ORM</div>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl border border-white/10">
              <div className="text-blue-400 font-bold mb-1">Vision ANPR + IoT</div>
              <div className="text-slate-400">Barrier & Telemetry Engine</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CALL TO ACTION */}
      <section className="py-16 bg-gradient-to-b from-navy-900 to-navy-950 border-t border-white/10">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-3xl font-extrabold text-white">
            Ready to Experience Stress-Free Urban Parking?
          </h2>
          <p className="text-sm text-slate-300 max-w-xl mx-auto">
            Join drivers and facility managers on ParkBay. Select a bay, reserve in seconds, or sign in to your administrator dashboard.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onGoToLogin('driver')}
              className="px-8 py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-extrabold text-sm tracking-wide shadow-xl shadow-emerald-500/25 transition-all"
            >
              Sign In to ParkBay
            </button>
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-white/10 py-8 bg-navy-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">ParkBay</span>
            <span>• Smart Parking Management and Reservation System</span>
          </div>
          <div>© 2026 ParkBay. All rights reserved.</div>
        </div>
      </footer>

    </div>
  );
}
