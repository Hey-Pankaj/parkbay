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
  Car
} from 'lucide-react';

export default function AdminDashboardPage({ facilities, onRefreshFacilities }) {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [allBookings, setAllBookings] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [actionNotice, setActionNotice] = useState('');

  // Add Slot Modal Form State
  const [isAddSlotOpen, setIsAddSlotOpen] = useState(false);
  const [newSlotFacilityId, setNewSlotFacilityId] = useState(facilities[0]?.id || 1);
  const [newSlotCode, setNewSlotCode] = useState('C-01');
  const [newSlotBlock, setNewSlotBlock] = useState('C');
  const [newSlotType, setNewSlotType] = useState('standard');
  const [newSlotRate, setNewSlotRate] = useState(40);
  const [newSlotHasEV, setNewSlotHasEV] = useState(false);
  const [isSubmittingSlot, setIsSubmittingSlot] = useState(false);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, bookingsRes] = await Promise.all([
        api.getAdminStats(),
        api.getBookings()
      ]);
      setStats(statsRes);
      setAllBookings(bookingsRes.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSlotStatus = async (slotId, currentStatus) => {
    const nextStatus = currentStatus === 'available' ? 'maintenance' : 'available';
    try {
      await api.updateSlotStatus(slotId, nextStatus);
      setActionNotice(`Slot updated to ${nextStatus.toUpperCase()}`);
      fetchAdminData();
      if (onRefreshFacilities) onRefreshFacilities();
    } catch (err) {
      alert(err.message || 'Failed to update slot status.');
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
      setActionNotice(`Bay ${newSlotCode} created successfully!`);
      fetchAdminData();
      if (onRefreshFacilities) onRefreshFacilities();
    } catch (err) {
      alert(err.message || 'Failed to create parking slot.');
    } finally {
      setIsSubmittingSlot(false);
    }
  };

  const handleAdminRelease = async (bookingId) => {
    try {
      await api.releaseBooking(bookingId);
      setActionNotice(`Booking #${bookingId} marked completed & slot freed.`);
      fetchAdminData();
    } catch (err) {
      alert(err.message || 'Failed to release booking.');
    }
  };

  const filteredBookings = allBookings.filter((b) => {
    const matchesSearch = 
      b.vehicle_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.booking_ref?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.driver_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.slot_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.booking_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <LayoutDashboard className="w-7 h-7 text-amber-400" />
            Central Administrator Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time multi-facility occupancy oversight, dynamic slot provisioning, and booking logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddSlotOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-amber-400/20 transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            Provision New Bay
          </button>

          <button
            onClick={fetchAdminData}
            className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title="Refresh Data"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
          <span>{actionNotice}</span>
          <button onClick={() => setActionNotice('')} className="underline opacity-80 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-glass-card p-5 rounded-2xl border border-white/10 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total System Bays</div>
          <div className="text-3xl font-extrabold font-mono text-white mt-1">
            {stats?.total_slots ?? '--'}
          </div>
          <div className="text-xs text-slate-400 mt-1">Across {stats?.total_facilities ?? 3} facilities</div>
        </div>

        <div className="bg-glass-card p-5 rounded-2xl border border-rose-500/20 bg-rose-500/5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-rose-400">Live Occupancy Rate</div>
          <div className="text-3xl font-extrabold font-mono text-rose-400 mt-1">
            {stats?.occupancy_rate_pct ?? 0}%
          </div>
          <div className="text-xs text-rose-300/80 mt-1">
            {stats?.occupied_slots ?? 0} active vehicles parked
          </div>
        </div>

        <div className="bg-glass-card p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-emerald-400">Available Bays</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
            {stats?.available_slots ?? '--'}
          </div>
          <div className="text-xs text-emerald-300/80 mt-1">Immediate drive-in capacity</div>
        </div>

        <div className="bg-glass-card p-5 rounded-2xl border border-amber-500/20 bg-amber-500/5 shadow-lg">
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">Today's Revenue</div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
            ₹{stats?.today_revenue ?? '0.00'}
          </div>
          <div className="text-xs text-amber-300/80 mt-1">Processed transactions</div>
        </div>

      </div>

      {/* Bookings Management & Audit Table */}
      <div className="bg-glass-card border border-white/10 rounded-2xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-white">Central Bookings & Vehicle Log</h2>
            <p className="text-xs text-slate-400 mt-0.5">Comprehensive audit trail of all parking activities</p>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search plate, ref, driver..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-navy-950/80 border border-white/15 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 w-52"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-navy-950/80 border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-400"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active (Parked)</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3">Ref Code</th>
                <th className="py-3 px-3">Facility & Bay</th>
                <th className="py-3 px-3">Vehicle Plate</th>
                <th className="py-3 px-3">Driver</th>
                <th className="py-3 px-3">Time Window</th>
                <th className="py-3 px-3">Amount</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500">
                    No reservations matching current query.
                  </td>
                </tr>
              ) : (
                filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-amber-400">{b.booking_ref}</td>
                    <td className="py-3 px-3">
                      <div className="font-medium text-white">{b.facility_name}</div>
                      <div className="text-[10px] text-emerald-400 font-mono font-bold">Bay {b.slot_code}</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="license-plate px-1.5 py-0.5 rounded text-[11px] font-bold inline-block">
                        {b.vehicle_number}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-white">
                      <div>{b.driver_name}</div>
                      <div className="text-[10px] text-slate-500">{b.driver_phone}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-mono text-[11px]">
                      <div>{new Date(b.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                      <div className="text-slate-500 text-[10px]">({b.total_hours} hrs)</div>
                    </td>
                    <td className="py-3 px-3 font-bold text-white font-mono">₹{b.paid_amount}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        b.booking_status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : b.booking_status === 'confirmed'
                          ? 'bg-cyan-500/20 text-cyan-300'
                          : b.booking_status === 'completed'
                          ? 'bg-slate-700/50 text-slate-400'
                          : 'bg-rose-500/20 text-rose-300'
                      }`}>
                        {b.booking_status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right">
                      {b.booking_status === 'active' && (
                        <button
                          onClick={() => handleAdminRelease(b.id)}
                          className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-semibold transition-colors"
                        >
                          Manual Release
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: Provision New Bay */}
      {isAddSlotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-navy-900 border border-white/15 rounded-3xl shadow-2xl p-6 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-amber-400" />
              Provision New Parking Bay
            </h3>

            <form onSubmit={handleAddSlotSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Target Facility</label>
                <select
                  value={newSlotFacilityId}
                  onChange={(e) => setNewSlotFacilityId(e.target.value)}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                >
                  {facilities.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
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
