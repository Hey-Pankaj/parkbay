import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Car, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Radio, 
  Zap, 
  Lock, 
  HeartHandshake,
  CreditCard,
  Check
} from 'lucide-react';

export default function ProfilePage({ onGoToExplore, onGoToBookings }) {
  const { user, updateUserProfile, isAdmin } = useAuth();

  // Personal Information State
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [city, setCity] = useState(user?.city || 'Bengaluru');
  const [address, setAddress] = useState(user?.address || 'Plot 42, Brigade Road, Ashok Nagar');
  const [emergencyContact, setEmergencyContact] = useState(user?.emergency_contact || '+91 98450 11223');
  
  // Vehicle & FastPass Information
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicle_number || 'KA01MJ4321');
  const [vehicleType, setVehicleType] = useState(user?.vehicle_type || 'sedan');
  const [vehicleModel, setVehicleModel] = useState(user?.vehicle_model || 'Tata Nexon EV');
  const [fastagId, setFastagId] = useState(user?.fastag_id || 'IND-FTAG-99824');

  // Preferences
  const [anprAutoOpen, setAnprAutoOpen] = useState(user?.anpr_auto_open !== false);
  const [smsAlerts, setSmsAlerts] = useState(user?.sms_alerts !== false);
  const [evPriority, setEvPriority] = useState(user?.ev_priority !== false);

  // Status & Notifications
  const [isSaving, setIsSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ text: '', type: '' });

  // Sync state if user context updates externally
  useEffect(() => {
    if (user) {
      if (user.full_name) setFullName(user.full_name);
      if (user.email) setEmail(user.email);
      if (user.phone) setPhone(user.phone);
      if (user.city) setCity(user.city);
      if (user.address) setAddress(user.address);
      if (user.emergency_contact) setEmergencyContact(user.emergency_contact);
      if (user.vehicle_number) setVehicleNumber(user.vehicle_number);
      if (user.vehicle_type) setVehicleType(user.vehicle_type);
      if (user.vehicle_model) setVehicleModel(user.vehicle_model);
      if (user.fastag_id) setFastagId(user.fastag_id);
    }
  }, [user]);

  const handleReset = () => {
    setFullName(user?.full_name || '');
    setEmail(user?.email || '');
    setPhone(user?.phone || '+91 98765 43210');
    setCity(user?.city || 'Bengaluru');
    setAddress(user?.address || 'Plot 42, Brigade Road, Ashok Nagar');
    setEmergencyContact(user?.emergency_contact || '+91 98450 11223');
    setVehicleNumber(user?.vehicle_number || 'KA01MJ4321');
    setVehicleType(user?.vehicle_type || 'sedan');
    setVehicleModel(user?.vehicle_model || 'Tata Nexon EV');
    setFastagId(user?.fastag_id || 'IND-FTAG-99824');
    setStatusMsg({ text: 'Form reset to saved profile values.', type: 'info' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setStatusMsg({ text: 'Full Name cannot be empty.', type: 'error' });
      return;
    }

    setIsSaving(true);
    setStatusMsg({ text: '', type: '' });

    try {
      const updatedData = {
        id: user?.id,
        full_name: fullName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        address: address.trim(),
        emergency_contact: emergencyContact.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        vehicle_type: vehicleType,
        vehicle_model: vehicleModel.trim(),
        fastag_id: fastagId.trim(),
        anpr_auto_open: anprAutoOpen,
        sms_alerts: smsAlerts,
        ev_priority: evPriority
      };

      await updateUserProfile(updatedData);
      setStatusMsg({ text: 'Personal Information saved successfully! Your profile details are now up to date.', type: 'success' });
    } catch (err) {
      console.error(err);
      setStatusMsg({ text: err.message || 'Failed to update profile. Please try again.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  // Generate initials for avatar
  const getInitials = (name) => {
    if (!name) return 'PB';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-5xl mx-auto pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-glass-card border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-emerald-500/10 via-cyan-500/5 to-transparent blur-3xl pointer-events-none rounded-full"></div>
        
        <div className="flex items-center gap-5 relative z-10">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-cyan-500 p-0.5 shadow-xl shadow-emerald-500/20">
            <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
              <span className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 font-mono">
                {getInitials(fullName)}
              </span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold tracking-wider ${
                isAdmin 
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' 
                  : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
              }`}>
                {isAdmin ? 'FACILITY ADMINISTRATOR' : 'VERIFIED DRIVER'}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> FastPass Verified
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              {fullName || 'Driver Account'}
            </h1>
            <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-3">
              <span>{email}</span>
              <span>•</span>
              <span className="font-mono">{phone}</span>
              <span>•</span>
              <span>{city}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 self-start sm:self-center">
          {onGoToBookings && !isAdmin && (
            <button
              onClick={onGoToBookings}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all"
            >
              My Bookings
            </button>
          )}
          {onGoToExplore && (
            <button
              onClick={onGoToExplore}
              className="px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold transition-all"
            >
              Book a Bay
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {statusMsg.text && (
        <div className={`p-4 rounded-2xl border flex items-center justify-between text-xs font-medium animate-fadeIn ${
          statusMsg.type === 'success' 
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' 
            : statusMsg.type === 'info'
            ? 'bg-cyan-500/15 border-cyan-500/40 text-cyan-300'
            : 'bg-red-500/15 border-red-500/40 text-red-300'
        }`}>
          <div className="flex items-center gap-2">
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            ) : statusMsg.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            )}
            <span>{statusMsg.text}</span>
          </div>
          <button 
            onClick={() => setStatusMsg({ text: '', type: '' })}
            className="text-slate-400 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Profile Form */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SECTION 1: Personal Information */}
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Personal Information</h2>
                <p className="text-xs text-slate-400">Update your primary identity, contact details and address</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-mono bg-white/5 border border-white/10 text-slate-300">
              Identity & Contact
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Full Name */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-emerald-400" />
                <span>Full Name</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Pankaj Rana, Aarav Sharma"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Displayed on your booking passes and facility parking permits.</p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>Email Address</span>
                <span className="text-rose-400">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Used for OTP verification, digital gate receipts and invoicing.</p>
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                <span>Primary Phone (with Country Code)</span>
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Receives barrier entry pass SMS and bay occupancy notifications.</p>
            </div>

            {/* City */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>City & Region</span>
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="e.g. Bengaluru, Karnataka"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Helps automatically prioritize closest parking terminals.</p>
            </div>

            {/* Complete Address */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                <span>Address / Area Details</span>
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Plot / Street / Area details (e.g. Plot 42, Brigade Road, Ashok Nagar)"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
            </div>

            {/* Emergency Contact */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
                <span>Emergency Contact Number</span>
              </label>
              <input
                type="text"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98450 11223"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
              />
              <p className="text-[11px] text-slate-500 mt-1">Contacted in case of vehicle towing, lighting alerts, or parking bay incidents.</p>
            </div>
          </div>
        </div>

        {/* SECTION 2: Vehicle & ANPR FastPass Details */}
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Car className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Primary Vehicle & FastPass</h2>
                <p className="text-xs text-slate-400">Configure your license plate for automatic boom-barrier recognition</p>
              </div>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[11px] font-mono bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
              ANPR Vision Ready
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Vehicle Plate Number */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vehicle Registration Plate</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  placeholder="KA01MJ4321"
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-amber-300 font-mono tracking-wider font-bold focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
                />
                <span className="absolute right-3 top-2.5 px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300 border border-white/10">
                  IND
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Recognized by overhead ANPR cameras at terminal entry/exit gates.</p>
            </div>

            {/* Vehicle Type */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                <span>Vehicle Category</span>
              </label>
              <select
                value={vehicleType}
                onChange={(e) => setVehicleType(e.target.value)}
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              >
                <option value="sedan">Standard Sedan / Hatchback</option>
                <option value="suv">SUV / Premium Cruiser</option>
                <option value="ev">Electric Vehicle (Level-2 Charging Bay)</option>
                <option value="compact">Compact / City Mini</option>
                <option value="accessible">Accessible / Ramp Direct Access</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-1">Used by AI algorithm to filter suitable slot widths and EV ports.</p>
            </div>

            {/* Vehicle Model */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-cyan-400" />
                <span>Make & Model</span>
              </label>
              <input
                type="text"
                value={vehicleModel}
                onChange={(e) => setVehicleModel(e.target.value)}
                placeholder="e.g. Tata Nexon EV, Hyundai Creta"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>

            {/* FASTag ID */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                <span>FASTag / RFID Tag ID (Optional)</span>
              </label>
              <input
                type="text"
                value={fastagId}
                onChange={(e) => setFastagId(e.target.value.toUpperCase())}
                placeholder="IND-FTAG-99824"
                className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Smart Bay Preferences */}
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 sm:p-8 shadow-xl space-y-5">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Smart Bay Automation</h2>
              <p className="text-xs text-slate-400">Control automated hardware triggers and digital barrier interactions</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* ANPR Auto Open */}
            <div className="flex items-center justify-between p-4 bg-navy-950/60 border border-white/10 rounded-2xl">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400" />
                  <span>Instant ANPR Barrier Opening</span>
                </div>
                <p className="text-xs text-slate-400">Automatically open entry boom-barrier upon plate recognition without scanning QR ticket.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={anprAutoOpen} 
                  onChange={(e) => setAnprAutoOpen(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* EV Charger Priority */}
            <div className="flex items-center justify-between p-4 bg-navy-950/60 border border-white/10 rounded-2xl">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>EV Charger Recommendation Priority</span>
                </div>
                <p className="text-xs text-slate-400">Automatically suggest bays with Level-2 charging sockets during booking selection.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={evPriority} 
                  onChange={(e) => setEvPriority(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>

            {/* SMS Gate Notifications */}
            <div className="flex items-center justify-between p-4 bg-navy-950/60 border border-white/10 rounded-2xl">
              <div className="space-y-0.5">
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Phone className="w-4 h-4 text-cyan-400" />
                  <span>SMS Real-time Booking Alerts</span>
                </div>
                <p className="text-xs text-slate-400">Receive 15-minute slot expiry warnings and instant gate unlock notifications on your mobile phone.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={smsAlerts} 
                  onChange={(e) => setSmsAlerts(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Buttons / Actions Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={handleReset}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/5 text-slate-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Changes</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-navy-950 text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/25 disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                <span>Saving Personal Information...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save Personal Information</span>
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}

