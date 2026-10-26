import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Building2, 
  PlusCircle, 
  Wrench, 
  CheckCircle2, 
  XCircle, 
  IndianRupee, 
  Zap, 
  Clock, 
  Search, 
  RotateCw,
  SlidersHorizontal,
  Car,
  Users,
  Shield,
  ShieldAlert,
  UserCheck,
  UserPlus,
  Trash2,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  Sparkles,
  MapPin,
  ExternalLink,
  ChevronRight,
  Eye,
  X
} from 'lucide-react';

export default function AdminDashboardPage({ facilities = [], onRefreshFacilities }) {
  const { user: currentAdmin } = useAuth();
  
  // Navigation tabs: 'overview' | 'allotments' | 'users' | 'provisioning'
  const [adminTab, setAdminTab] = useState('overview');

  // Core Data
  const [stats, setStats] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Selected User for Inspecting Bookings Modal
  const [inspectingUser, setInspectingUser] = useState(null);

  // Allotments Search & Filter
  const [allotmentSearch, setAllotmentSearch] = useState('');
  const [allotmentStatusFilter, setAllotmentStatusFilter] = useState('all');
  const [allotmentFacilityFilter, setAllotmentFacilityFilter] = useState('all');
  const [allotmentUserFilter, setAllotmentUserFilter] = useState('all');

  // Users Configurations Search & Filter
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');

  // Modals
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);

  // New Slot Form State
  const [newSlotFacilityId, setNewSlotFacilityId] = useState(facilities[0]?.id || 1);
  const [newSlotCode, setNewSlotCode] = useState('C-01');
  const [newSlotBlock, setNewSlotBlock] = useState('C');
  const [newSlotType, setNewSlotType] = useState('standard');
  const [newSlotRate, setNewSlotRate] = useState(40);
  const [newSlotHasEV, setNewSlotHasEV] = useState(false);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    role: 'driver',
    password: ''
  });
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, bookingsRes, usersRes] = await Promise.all([
        api.getAdminStats(),
        api.getBookings(),
        api.getUsers()
      ]);
      setStats(statsRes);
      setAllBookings(bookingsRes.bookings || []);
      setUsersList(usersRes.users || []);
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // ALLOTMENTS ACTIONS
  // ==========================================
  const handleAdminRelease = async (bookingId) => {
    try {
      const res = await api.releaseBooking(bookingId);
      setActionNotice(res.message || `Booking #${bookingId} vacated & bay released!`);
      fetchAdminData();
      if (onRefreshFacilities) onRefreshFacilities();
    } catch (err) {
      alert(err.message || 'Failed to release allotment.');
    }
  };

  // Filtered Allotments
  const filteredAllotments = allBookings.filter((b) => {
    const query = allotmentSearch.toLowerCase();
    const matchesSearch = 
      b.vehicle_number?.toLowerCase().includes(query) ||
      b.booking_ref?.toLowerCase().includes(query) ||
      b.driver_name?.toLowerCase().includes(query) ||
      b.slot_code?.toLowerCase().includes(query);

    const matchesStatus = allotmentStatusFilter === 'all' || b.booking_status === allotmentStatusFilter;
    const matchesFacility = allotmentFacilityFilter === 'all' || String(b.facility_id) === String(allotmentFacilityFilter);
    const matchesUser = allotmentUserFilter === 'all' || String(b.user_id) === String(allotmentUserFilter);

    return matchesSearch && matchesStatus && matchesFacility && matchesUser;
  });

  const activeAllotmentsCount = allBookings.filter(b => b.booking_status === 'active').length;
  const confirmedAllotmentsCount = allBookings.filter(b => b.booking_status === 'confirmed').length;

  // Filtered Users
  const filteredUsers = usersList.filter((u) => {
    const query = userSearch.toLowerCase();
    const matchesSearch = 
      u.full_name?.toLowerCase().includes(query) ||
      u.email?.toLowerCase().includes(query) ||
      u.phone?.toLowerCase().includes(query);

    const matchesRole = userRoleFilter === 'all' || u.role === userRoleFilter;
    return matchesSearch && matchesRole;
  });

  const totalDriversCount = usersList.filter(u => u.role === 'driver').length;
  const totalAdminsCount = usersList.filter(u => u.role === 'admin').length;

  // Compute Area / Facility Breakdown dynamically if not from API
  const areaBreakdown = stats?.area_breakdown || (facilities.length > 0 ? facilities : [
    { id: 1, name: "ParkBay Central Galleria", city: "Bengaluru", address: "Plot 42, Brigade Road, Ashok Nagar", total_slots: 24, base_rate_per_hour: 40 },
    { id: 2, name: "ParkBay Tech Park Hub", city: "Bengaluru", address: "Block 3, Outer Ring Road, Bellandur", total_slots: 20, base_rate_per_hour: 35 },
    { id: 3, name: "ParkBay Airport Express", city: "Bengaluru", address: "Terminal 1 Arrivals, Devanahalli", total_slots: 16, base_rate_per_hour: 60 }
  ]).map(f => {
    const fBookings = allBookings.filter(b => Number(b.facility_id) === Number(f.id));
    const active = fBookings.filter(b => b.booking_status === 'active').length;
    const count = fBookings.length;
    const slots = f.total_slots || 20;
    const avail = Math.max(0, slots - active);
    const rev = fBookings.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0);
    return {
      facility_id: f.id,
      name: f.name,
      city: f.city || 'Bengaluru',
      area: f.address || f.name,
      total_slots: slots,
      total_bookings: count,
      active_bookings: active,
      available_slots: avail,
      occupancy_rate_pct: Math.round((active / slots) * 100),
      revenue: Math.round(rev)
    };
  });

  // User Configurations Actions
  const handleToggleRole = async (targetUser) => {
    if (targetUser.id === currentAdmin?.id) {
      alert("You cannot modify your own administrator role.");
      return;
    }
    const nextRole = targetUser.role === 'admin' ? 'driver' : 'admin';
    if (!window.confirm(`Change ${targetUser.full_name}'s role to ${nextRole.toUpperCase()}?`)) return;

    try {
      await api.updateUserRole(targetUser.id, nextRole);
      setActionNotice(`User ${targetUser.full_name} is now updated to ${nextRole.toUpperCase()}.`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (targetUser) => {
    if (targetUser.id === currentAdmin?.id) {
      alert("You cannot delete your own administrator account.");
      return;
    }
    if (!window.confirm(`Delete user account "${targetUser.full_name}"? This cannot be undone.`)) return;

    try {
      await api.deleteUser(targetUser.id);
      setActionNotice(`User account ${targetUser.email} has been deleted.`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to delete user.');
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.full_name || !newUserForm.email) {
      alert('Please enter user name and email.');
      return;
    }
    setIsSubmittingUser(true);
    try {
      await api.createUser(newUserForm);
      setIsCreateUserOpen(false);
      setNewUserForm({ full_name: '', email: '', phone: '', role: 'driver', password: '' });
      setActionNotice(`User account created successfully!`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to create user.');
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleAddSlotSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingSlot(true);
    try {
      await api.addSlot({
        facility_id: Number(newSlotFacilityId),
        slot_code: newSlotCode.trim().toUpperCase(),
        block: newSlotBlock.trim().toUpperCase(),
        slot_type: newSlotType,
        hourly_rate: Number(newSlotRate),
        has_ev_charger: newSlotHasEV
      });
      setIsAddSlotOpen(false);
      setActionNotice(`Bay ${newSlotCode} provisioned successfully!`);
      fetchAdminData();
      if (onRefreshFacilities) onRefreshFacilities();
    } catch (err) {
      alert(err.message || 'Failed to create parking slot.');
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  // Inspecting user's bookings (either from inspectingUser.bookings or allBookings filtered by user_id)
  const inspectingUserBookings = inspectingUser 
    ? (inspectingUser.bookings && inspectingUser.bookings.length > 0 
        ? inspectingUser.bookings 
        : allBookings.filter(b => b.user_id === inspectingUser.id || b.driver_name === inspectingUser.full_name))
    : [];

  return (
    <div className="space-y-8">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & EXECUTIVE OVERVIEW                                        */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
            <span className="text-xs uppercase font-bold tracking-widest text-amber-400 font-mono">
              PARKBAY MASTER ADMIN CONSOLE
            </span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5 mt-1">
            <LayoutDashboard className="w-7 h-7 text-amber-400" />
            Central Facility & User Governance
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Live multi-area booking breakdown, total user reservations tracking, and bay occupancy audit.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsCreateUserOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs shadow-md transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Create User
          </button>

          <button
            onClick={() => setIsAddSlotOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-bold text-xs shadow-md transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Provision Bay
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refresh All Dashboard Data"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Action Notification Alert */}
      {actionNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button onClick={() => setActionNotice('')} className="underline opacity-80 hover:opacity-100 font-semibold text-[11px] ml-4">
            Dismiss
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TOP METRIC CARDS                                                       */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        <div className="bg-glass-card p-4 rounded-2xl border border-white/10 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400">
            <span>Total Bookings</span>
            <Car className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-white mt-1.5">
            {stats?.total_bookings || allBookings.length}
          </div>
          <div className="text-[11px] text-amber-400/90 font-medium mt-1">Across all areas</div>
        </div>

        <div className="bg-glass-card p-4 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-rose-400">
            <span>Live Parked</span>
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse"></span>
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-rose-400 mt-1.5">
            {stats?.occupied_slots ?? activeAllotmentsCount}
          </div>
          <div className="text-[11px] text-rose-300/80 font-medium mt-1">Active vehicles now</div>
        </div>

        <div className="bg-glass-card p-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-emerald-400">
            <span>Available Bays</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-400 mt-1.5">
            {stats?.available_slots ?? '--'}
          </div>
          <div className="text-[11px] text-emerald-300/80 font-medium mt-1">Open drive-in bays</div>
        </div>

        <div className="bg-glass-card p-4 rounded-2xl border border-cyan-500/20 bg-cyan-500/5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-cyan-400">
            <span>Registered Users</span>
            <Users className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-400 mt-1.5">
            {usersList.length}
          </div>
          <div className="text-[11px] text-cyan-300/80 font-medium mt-1">{totalDriversCount} drivers • {totalAdminsCount} admins</div>
        </div>

        <div className="bg-glass-card p-4 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-lg col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-amber-400">
            <span>Total Revenue</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl sm:text-3xl font-black font-mono text-amber-400 mt-1.5">
            ₹{stats?.today_revenue ? stats.today_revenue.toLocaleString() : '5,640'}
          </div>
          <div className="text-[11px] text-amber-300/80 font-medium mt-1">Collected payments</div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SECTION: 📍 NUMBER OF BOOKINGS BY AREA / FACILITY                     */}
      {/* ========================================================================= */}
      <div className="bg-glass-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">Bookings & Live Occupancy by Area</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Specific breakdown of reservation volumes, active vehicles, and capacities for each facility area.
            </p>
          </div>

          <div className="text-xs text-slate-400">
            Click any area to filter allotments below
          </div>
        </div>

        {/* Area Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {areaBreakdown.map((area) => {
            const isSelected = String(allotmentFacilityFilter) === String(area.facility_id);

            return (
              <div 
                key={area.facility_id}
                onClick={() => {
                  setAllotmentFacilityFilter(isSelected ? 'all' : String(area.facility_id));
                  setAdminTab('allotments');
                }}
                className={`cursor-pointer p-4 rounded-2xl border transition-all relative overflow-hidden group ${
                  isSelected 
                    ? 'bg-amber-400/10 border-amber-400/50 shadow-lg shadow-amber-400/10' 
                    : 'bg-white/5 border-white/10 hover:border-amber-400/30 hover:bg-white/[0.07]'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-white text-sm group-hover:text-amber-300 transition-colors">
                      {area.name}
                    </h3>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-500" />
                      <span>{area.area}</span>
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded-xl text-xs font-mono font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30 shrink-0">
                    {area.total_bookings} Bookings
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4 space-y-1.5">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">Live Occupancy</span>
                    <span className="font-mono font-semibold text-rose-400">
                      {area.active_bookings} / {area.total_slots} bays ({area.occupancy_rate_pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-navy-950 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(8, area.occupancy_rate_pct))}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-3 mt-3 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Available Bays</span>
                    <div className="font-mono font-bold text-emerald-400 text-sm">{area.available_slots} Free</div>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold">Revenue</span>
                    <div className="font-mono font-bold text-white text-sm">₹{area.revenue?.toLocaleString() || '--'}</div>
                  </div>
                </div>

                <div className="mt-3 text-right">
                  <span className="text-[11px] font-semibold text-amber-400 group-hover:underline inline-flex items-center gap-1">
                    {isSelected ? 'Viewing this Area' : 'Filter Bookings in this Area'}
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. DASHBOARD SECTION TABS                                                 */}
      {/* ========================================================================= */}
      <div className="flex border-b border-white/10 gap-2">
        <button
          onClick={() => setAdminTab('overview')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            adminTab === 'overview'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Unified Overview</span>
        </button>

        <button
          onClick={() => setAdminTab('allotments')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            adminTab === 'allotments'
              ? 'border-amber-400 text-amber-400 bg-amber-400/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Car className="w-4 h-4" />
          <span>Live Allotments & Bookings</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-400/20 text-amber-300">
            {allBookings.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('users')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            adminTab === 'users'
              ? 'border-emerald-400 text-emerald-400 bg-emerald-400/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Users & Their Bookings</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-400/20 text-emerald-300">
            {usersList.length}
          </span>
        </button>

        <button
          onClick={() => setAdminTab('provisioning')}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all ${
            adminTab === 'provisioning'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-400/5'
              : 'border-transparent text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Bay Provisioning</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 5. SECTION: 👥 USERS & THEIR BOOKINGS                                     */}
      {/* ========================================================================= */}
      {(adminTab === 'overview' || adminTab === 'users') && (
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-bold text-white">Users Configuration & Personal Bookings Log</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect every registered user, view all individual bookings made by each user, and configure roles.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search user name, email, phone..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="bg-navy-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-400 w-56"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-navy-950/80 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="all">All Roles ({usersList.length})</option>
                <option value="driver">Drivers ({totalDriversCount})</option>
                <option value="admin">Administrators ({totalAdminsCount})</option>
              </select>

              <button
                onClick={() => setIsCreateUserOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs shadow-md transition-all"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Add User
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">User Profile</th>
                  <th className="py-3 px-3">Contact Email & Phone</th>
                  <th className="py-3 px-3">Current Role</th>
                  <th className="py-3 px-3">User's Total Bookings</th>
                  <th className="py-3 px-3">Registered Date</th>
                  <th className="py-3 px-3 text-right">User Actions & Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-slate-500">
                      No user accounts found matching query.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const isSelf = u.id === currentAdmin?.id;
                    const isUserAdmin = u.role === 'admin';
                    const bookingCount = u.total_bookings ?? (u.bookings ? u.bookings.length : 0);

                    return (
                      <tr key={u.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs uppercase ${
                              isUserAdmin ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40' : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/40'
                            }`}>
                              {u.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-semibold text-white flex items-center gap-1.5">
                                {u.full_name}
                                {isSelf && (
                                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-[9px] text-slate-300">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400 font-mono">UID #{u.id}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="text-white flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{u.email}</span>
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                            <Phone className="w-3 h-3 text-slate-500" />
                            <span>{u.phone || '--'}</span>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          {isUserAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                              <Shield className="w-3 h-3" />
                              ADMIN
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                              <Car className="w-3 h-3" />
                              DRIVER
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="font-mono font-bold text-white text-sm">
                            {bookingCount} Bookings
                          </div>
                          {u.active_bookings > 0 && (
                            <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                              {u.active_bookings} active right now
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-400 text-[11px] font-mono">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }) : 'Jan 2026'}
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Inspect User Bookings Button */}
                            <button
                              onClick={() => setInspectingUser(u)}
                              className="px-3 py-1 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[11px] font-semibold transition-all flex items-center gap-1"
                              title="Inspect all bookings made by this user"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Bookings ({bookingCount})</span>
                            </button>

                            {/* Role Switch */}
                            <button
                              onClick={() => handleToggleRole(u)}
                              disabled={isSelf}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-semibold border transition-all ${
                                isSelf
                                  ? 'opacity-30 cursor-not-allowed border-white/5 text-slate-500'
                                  : isUserAdmin
                                  ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border-rose-500/30'
                                  : 'bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border-amber-400/30'
                              }`}
                            >
                              {isUserAdmin ? 'Make Driver' : 'Make Admin'}
                            </button>

                            {/* Delete Button */}
                            <button
                              onClick={() => handleDeleteUser(u)}
                              disabled={isSelf}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isSelf ? 'opacity-20 cursor-not-allowed text-slate-600' : 'text-slate-400 hover:text-rose-400 hover:bg-rose-500/10'
                              }`}
                              title="Delete user"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. SECTION: 🚗 CENTRAL ALLOTMENTS & VEHICLE AUDIT TABLE                   */}
      {/* ========================================================================= */}
      {(adminTab === 'overview' || adminTab === 'allotments') && (
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-amber-400" />
                <h2 className="text-lg font-bold text-white">All Bay Allotments & Active Vehicles</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit every parked bay, vehicle plate, driver contact, and perform manual releases.
              </p>
            </div>

            {/* Allotment Filter & Search Bar */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search plate, ref, driver, bay..."
                  value={allotmentSearch}
                  onChange={(e) => setAllotmentSearch(e.target.value)}
                  className="bg-navy-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-52"
                />
              </div>

              {/* Area / Facility Filter */}
              <select
                value={allotmentFacilityFilter}
                onChange={(e) => setAllotmentFacilityFilter(e.target.value)}
                className="bg-navy-950/80 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Areas / Facilities</option>
                {facilities.map(f => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>

              {/* User Filter */}
              <select
                value={allotmentUserFilter}
                onChange={(e) => setAllotmentUserFilter(e.target.value)}
                className="bg-navy-950/80 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Users</option>
                {usersList.map(u => (
                  <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={allotmentStatusFilter}
                onChange={(e) => setAllotmentStatusFilter(e.target.value)}
                className="bg-navy-950/80 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Statuses ({allBookings.length})</option>
                <option value="active">Active (Parked)</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Active Filter Pills if filtered */}
          {(allotmentFacilityFilter !== 'all' || allotmentUserFilter !== 'all' || allotmentStatusFilter !== 'all') && (
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-500">Active filters:</span>
              {allotmentFacilityFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                  Area: {facilities.find(f => String(f.id) === String(allotmentFacilityFilter))?.name || allotmentFacilityFilter}
                  <button onClick={() => setAllotmentFacilityFilter('all')} className="ml-1 font-bold">×</button>
                </span>
              )}
              {allotmentUserFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 flex items-center gap-1">
                  User: {usersList.find(u => String(u.id) === String(allotmentUserFilter))?.full_name || allotmentUserFilter}
                  <button onClick={() => setAllotmentUserFilter('all')} className="ml-1 font-bold">×</button>
                </span>
              )}
              {allotmentStatusFilter !== 'all' && (
                <span className="px-2 py-0.5 rounded-lg bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  Status: {allotmentStatusFilter}
                  <button onClick={() => setAllotmentStatusFilter('all')} className="ml-1 font-bold">×</button>
                </span>
              )}
              <button 
                onClick={() => {
                  setAllotmentFacilityFilter('all');
                  setAllotmentUserFilter('all');
                  setAllotmentStatusFilter('all');
                }} 
                className="underline text-slate-400 hover:text-white ml-2 text-[11px]"
              >
                Reset All Filters
              </button>
            </div>
          )}

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Allotment Ref</th>
                  <th className="py-3 px-3">Facility Area & Bay</th>
                  <th className="py-3 px-3">Vehicle Plate</th>
                  <th className="py-3 px-3">Driver / User</th>
                  <th className="py-3 px-3">Duration & Window</th>
                  <th className="py-3 px-3">Fee Paid</th>
                  <th className="py-3 px-3">Live Status</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredAllotments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-10 text-center text-slate-500">
                      No bay allotments match your filter query.
                    </td>
                  </tr>
                ) : (
                  filteredAllotments.map((b) => (
                    <tr key={b.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-3 px-3">
                        <span className="font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                          {b.booking_ref}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-white">{b.facility_name || 'ParkBay Facility'}</div>
                        <div className="text-[11px] text-emerald-400 font-mono font-bold flex items-center gap-1 mt-0.5">
                          <span>Bay {b.slot_code || 'A-01'}</span>
                          {b.slot_type === 'ev_charging' && (
                            <span className="text-[9px] px-1 bg-emerald-500/20 text-emerald-300 rounded">EV</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="license-plate px-2 py-0.5 rounded text-[11px] font-bold inline-block shadow-sm">
                          {b.vehicle_number}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-white">
                        <div className="font-medium">{b.driver_name}</div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-500" />
                          <span>{b.driver_phone || 'Driver Phone'}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                        <div>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} → {new Date(b.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                        <div className="text-slate-500 text-[10px]">({b.total_hours} hrs booked)</div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-white font-mono">₹{b.paid_amount || b.estimated_amount}</div>
                        <div className="text-[10px] text-emerald-400 uppercase font-semibold">UPI Paid</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          b.booking_status === 'active'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse'
                            : b.booking_status === 'confirmed'
                            ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                            : b.booking_status === 'completed'
                            ? 'bg-slate-700/50 text-slate-400'
                            : 'bg-rose-500/20 text-rose-300'
                        }`}>
                          {b.booking_status === 'active' ? '● PARKED (ACTIVE)' : b.booking_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        {b.booking_status === 'active' && (
                          <button
                            onClick={() => handleAdminRelease(b.id)}
                            className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-[11px] font-semibold transition-all shadow-sm"
                            title="Force checkout & free bay"
                          >
                            Vacate Bay
                          </button>
                        )}
                        {b.booking_status === 'confirmed' && (
                          <span className="text-slate-500 text-[11px]">Upcoming</span>
                        )}
                        {['completed', 'cancelled'].includes(b.booking_status) && (
                          <span className="text-slate-500 text-[11px]">Archived</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SECTION: 🏗️ BAY PROVISIONING                                           */}
      {/* ========================================================================= */}
      {adminTab === 'provisioning' && (
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-cyan-400" />
                <h2 className="text-lg font-bold text-white">Facility Bay Provisioning & Inventory</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Add parking bays, configure EV fast charging outlets, and review facility capacities.
              </p>
            </div>

            <button
              onClick={() => setIsAddSlotOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-cyan-400/20 transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              Provision New Bay
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {facilities.map((f) => (
              <div key={f.id} className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-sm">{f.name}</h3>
                    <p className="text-[11px] text-slate-400">{f.address}, {f.city}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-white/5">
                  <div>
                    <span className="text-slate-400 text-[10px]">Total Capacity:</span>
                    <div className="font-mono font-bold text-white">{f.total_slots || 24} Bays</div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-[10px]">Base Rate:</span>
                    <div className="font-mono font-bold text-amber-400">₹{f.base_rate_per_hour}/hr</div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setNewSlotFacilityId(f.id);
                    setIsAddSlotOpen(true);
                  }}
                  className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-3.5 h-3.5 text-amber-400" />
                  Add Bay to this Facility
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. MODAL: INSPECT SPECIFIC USER'S COMPLETE BOOKINGS RECORD                 */}
      {/* ========================================================================= */}
      {inspectingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-2xl bg-navy-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 flex items-center justify-center font-bold text-sm uppercase">
                  {inspectingUser.full_name?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Bookings History: {inspectingUser.full_name}</span>
                    <span className={`px-2 py-0.2 rounded-full text-[10px] font-bold uppercase ${
                      inspectingUser.role === 'admin' ? 'bg-amber-400/20 text-amber-300' : 'bg-emerald-400/20 text-emerald-300'
                    }`}>
                      {inspectingUser.role}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {inspectingUser.email} • {inspectingUser.phone || 'No phone'} • UID #{inspectingUser.id}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setInspectingUser(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Metrics of this user */}
            <div className="grid grid-cols-3 gap-3 p-3.5 rounded-2xl bg-white/5 border border-white/5 text-xs">
              <div>
                <span className="text-slate-400">Total Bookings Made:</span>
                <div className="font-bold font-mono text-white text-base mt-0.5">{inspectingUserBookings.length}</div>
              </div>
              <div>
                <span className="text-slate-400">Currently Active:</span>
                <div className="font-bold font-mono text-emerald-400 text-base mt-0.5">
                  {inspectingUserBookings.filter(b => b.booking_status === 'active').length}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Total Spent:</span>
                <div className="font-bold font-mono text-amber-400 text-base mt-0.5">
                  ₹{inspectingUserBookings.reduce((sum, b) => sum + (Number(b.paid_amount) || 0), 0)}
                </div>
              </div>
            </div>

            {/* Table of user's individual bookings */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Complete Reservation Audit</h4>
              
              {inspectingUserBookings.length === 0 ? (
                <div className="py-8 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/5">
                  This user has not placed any bookings yet.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-navy-950/90 text-slate-400 font-semibold uppercase text-[10px]">
                      <tr>
                        <th className="py-2.5 px-3">Ref</th>
                        <th className="py-2.5 px-3">Facility Area</th>
                        <th className="py-2.5 px-3">Bay</th>
                        <th className="py-2.5 px-3">Vehicle</th>
                        <th className="py-2.5 px-3">Duration</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {inspectingUserBookings.map((b) => (
                        <tr key={b.id || b.booking_ref} className="hover:bg-white/5">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-400">{b.booking_ref}</td>
                          <td className="py-2.5 px-3 text-white font-medium">{b.facility_name || 'ParkBay Facility'}</td>
                          <td className="py-2.5 px-3 font-mono text-emerald-400 font-bold">{b.slot_code || 'A-01'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold">{b.vehicle_number}</td>
                          <td className="py-2.5 px-3 text-slate-300 font-mono text-[11px]">{b.total_hours} hrs</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-white">₹{b.paid_amount || b.total_amount}</td>
                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              b.booking_status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : b.booking_status === 'confirmed'
                                ? 'bg-cyan-500/20 text-cyan-300'
                                : 'bg-slate-700/50 text-slate-400'
                            }`}>
                              {b.booking_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectingUser(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs transition-colors"
              >
                Close Audit
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. MODAL: CREATE USER ACCOUNT                                             */}
      {/* ========================================================================= */}
      {isCreateUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-navy-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-emerald-400" />
              Create New User Account
            </h3>

            <form onSubmit={handleCreateUserSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={newUserForm.full_name}
                  onChange={(e) => setNewUserForm({ ...newUserForm, full_name: e.target.value })}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. ramesh@example.com"
                  value={newUserForm.email}
                  onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={newUserForm.phone}
                    onChange={(e) => setNewUserForm({ ...newUserForm, phone: e.target.value })}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Role Configuration</label>
                  <select
                    value={newUserForm.role}
                    onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="driver">Driver</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Initial Password (Optional)</label>
                <input
                  type="password"
                  placeholder="Leave empty for default (password123)"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUser}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs shadow-md transition-all"
                >
                  {isSubmittingUser ? 'Saving...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 10. MODAL: PROVISION NEW BAY                                              */}
      {/* ========================================================================= */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-navy-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Provision New Parking Bay
            </h3>

            <form onSubmit={handleAddSlotSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Facility Area</label>
                <select
                  value={newSlotFacilityId}
                  onChange={(e) => setNewSlotFacilityId(e.target.value)}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name} ({f.address})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Slot Code (e.g. C-01)</label>
                  <input
                    type="text"
                    required
                    value={newSlotCode}
                    onChange={(e) => setNewSlotCode(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Zone Block</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    value={newSlotBlock}
                    onChange={(e) => setNewSlotBlock(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Bay Type</label>
                  <select
                    value={newSlotType}
                    onChange={(e) => setNewSlotType(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="ev_charging">EV Fast Charging</option>
                    <option value="suv">SUV / XL</option>
                    <option value="compact">Compact</option>
                    <option value="accessible">Accessible</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Rate (₹/hour)</label>
                  <input
                    type="number"
                    min={10}
                    max={500}
                    value={newSlotRate}
                    onChange={(e) => setNewSlotRate(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="evCheck"
                  checked={newSlotHasEV}
                  onChange={(e) => setNewSlotHasEV(e.target.checked)}
                  className="rounded border-white/20 bg-navy-950 text-emerald-500 focus:ring-0"
                />
                <label htmlFor="evCheck" className="text-xs text-slate-300 flex items-center gap-1 cursor-pointer">
                  <Zap className="w-3.5 h-3.5 text-emerald-400" />
                  Equipped with Level-2 EV Charging Outlet
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsAddSlotOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSlot}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-navy-950 font-bold text-xs shadow-md transition-all"
                >
                  {isSubmittingSlot ? 'Creating...' : 'Confirm & Create Bay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
