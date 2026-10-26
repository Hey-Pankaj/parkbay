import React from 'react';
import ParkingSlotCard from './ParkingSlotCard';
import { 
  Building2, 
  MapPin, 
  Zap, 
  Filter, 
  Clock, 
  Sparkles, 
  RotateCw,
  AlertCircle,
  HelpCircle,
  ListOrdered
} from 'lucide-react';

export default function ParkingLotView({
  facilities,
  selectedFacility,
  onSelectFacility,
  slots,
  selectedSlot,
  onSelectSlot,
  startTime,
  setStartTime,
  durationHours,
  setDurationHours,
  isLoading,
  onRefresh,
  onAutoAssign,
  onOpenWaitlistModal
}) {
  if (!selectedFacility) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Building2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Loading parking facilities...</p>
      </div>
    );
  }

  // Group slots by block (A, B, C...)
  const blocks = slots.reduce((acc, slot) => {
    const b = slot.block || 'A';
    if (!acc[b]) acc[b] = [];
    acc[b].push(slot);
    return acc;
  }, {});

  const totalCount = slots.length;
  const occupiedCount = slots.filter(s => s.busy).length;
  const availableCount = totalCount - occupiedCount;
  const evSlotsCount = slots.filter(s => s.has_ev_charger && !s.busy).length;

  return (
    <div className="space-y-6">
      
      {/* Top Facility Switcher & Filter Ribbon */}
      <div className="bg-glass-card p-5 rounded-2xl border border-white/10 shadow-xl space-y-4">
        
        {/* Facilities Tabs */}
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-emerald-400" />
            Select Parking Location
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {facilities.map((fac) => {
              const isCurrent = fac.id === selectedFacility.id;
              return (
                <button
                  key={fac.id}
                  onClick={() => onSelectFacility(fac)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-emerald-500/10 border-emerald-500/50 shadow-md shadow-emerald-500/10'
                      : 'bg-white/5 border-white/5 hover:border-white/20 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-white text-sm truncate">{fac.name}</span>
                    <span className="text-xs font-bold font-mono text-emerald-400">
                      ₹{fac.base_rate_per_hour}/h
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{fac.address}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Time-Based Availability Period Selector */}
        <div className="pt-3 border-t border-white/5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          
          <div className="sm:col-span-5 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              Reservation Start Time
            </label>
            <input
              type="datetime-local"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
            />
          </div>

          <div className="sm:col-span-4 flex flex-col gap-1">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-emerald-400" />
              Duration
            </label>
            <select
              value={durationHours}
              onChange={(e) => setDurationHours(Number(e.target.value))}
              className="bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={1}>1 Hour</option>
              <option value={2}>2 Hours (Standard)</option>
              <option value={3}>3 Hours</option>
              <option value={4}>4 Hours (Half Day)</option>
              <option value={8}>8 Hours (Full Shift)</option>
              <option value={12}>12 Hours (Max Daily)</option>
            </select>
          </div>

          <div className="sm:col-span-3 flex items-end gap-2 pt-5 sm:pt-0">
            <button
              onClick={onAutoAssign}
              disabled={availableCount === 0 || isLoading}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              title="Automatically selects the closest free parking slot"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Auto Assign
            </button>

            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-colors"
              title="Refresh Availability"
            >
              <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>

        </div>

      </div>

      {/* Real-time KPI Stats Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-glass-card p-4 rounded-xl border border-white/10">
          <div className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Bays</div>
          <div className="text-2xl font-bold font-mono text-white mt-1">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Designed Capacity</div>
        </div>

        <div className="bg-glass-card p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
          <div className="text-xs text-emerald-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Available Now
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">{availableCount}</div>
          <div className="text-[11px] text-emerald-300/80 mt-0.5">Ready for booking</div>
        </div>

        <div className="bg-glass-card p-4 rounded-xl border border-rose-500/20 bg-rose-500/5">
          <div className="text-xs text-rose-400 uppercase tracking-wider font-semibold">Occupied</div>
          <div className="text-2xl font-bold font-mono text-rose-400 mt-1">{occupiedCount}</div>
          <div className="text-[11px] text-rose-300/80 mt-0.5">
            {totalCount ? Math.round((occupiedCount / totalCount) * 100) : 0}% occupancy
          </div>
        </div>

        <div className="bg-glass-card p-4 rounded-xl border border-cyan-500/20 bg-cyan-500/5">
          <div className="text-xs text-cyan-400 uppercase tracking-wider font-semibold flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            EV Chargers Free
          </div>
          <div className="text-2xl font-bold font-mono text-cyan-400 mt-1">{evSlotsCount}</div>
          <div className="text-[11px] text-cyan-300/80 mt-0.5">Level-2 Fast Plug</div>
        </div>
      </div>

      {/* If full, show prompt to join waiting list */}
      {availableCount === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <div className="font-semibold text-sm text-white">This facility is currently fully booked!</div>
              <div className="text-xs text-amber-300/90">Join the automated FIFO queue. When a driver exits, the bay will automatically be allocated to you.</div>
            </div>
          </div>
          <button
            onClick={onOpenWaitlistModal}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-navy-950 font-bold text-xs rounded-xl shadow-md transition-all shrink-0"
          >
            Join Priority Waitlist
          </button>
        </div>
      )}

      {/* Architectural Parking Grid Lot */}
      <div className="bg-asphalt p-6 rounded-2xl border border-white/10 shadow-2xl relative overflow-hidden">
        
        {/* Lot Header */}
        <div className="flex flex-wrap items-center justify-between pb-4 mb-6 border-b border-white/10 gap-2">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
              {selectedFacility.name} — Floor Map
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any free bay to customize your booking or review bay telemetry.
            </p>
          </div>

          {/* Interactive Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-300 bg-navy-950/70 px-3.5 py-1.5 rounded-xl border border-white/10">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-slate-700 border border-emerald-400"></span> Available
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-rose-600"></span> Occupied
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-blue-500"></span> Selected
            </span>
            <span className="flex items-center gap-1.5">
              <Zap className="w-3 h-3 text-emerald-400" /> EV Charge
            </span>
          </div>
        </div>

        {/* Blocks Rendering */}
        <div className="space-y-8">
          {Object.keys(blocks).map((blockKey) => {
            const blockSlots = blocks[blockKey];
            const half = Math.ceil(blockSlots.length / 2);
            const rowTop = blockSlots.slice(0, half);
            const rowBottom = blockSlots.slice(half);

            return (
              <div key={blockKey} className="space-y-3">
                {/* Block Title */}
                <div className="flex items-center justify-between px-2">
                  <span className="text-xs font-bold uppercase tracking-widest text-amber-400 flex items-center gap-1.5 font-mono">
                    <span className="w-1.5 h-3 bg-amber-400 rounded-sm"></span>
                    ZONE {blockKey} • BAYS {blockSlots[0]?.slot_code} TO {blockSlots[blockSlots.length - 1]?.slot_code}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {blockSlots.filter(s => !s.busy).length} of {blockSlots.length} available
                  </span>
                </div>

                {/* Top Bay Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {rowTop.map((slot) => (
                    <ParkingSlotCard
                      key={slot.id}
                      slot={slot}
                      isSelected={selectedSlot?.id === slot.id}
                      onSelect={onSelectSlot}
                    />
                  ))}
                </div>

                {/* Road / Drive Lane Simulation */}
                <div className="my-3 py-2 px-4 rounded-lg bg-navy-950/80 border-y border-dashed border-white/20 flex items-center justify-between text-[11px] font-mono tracking-widest text-slate-400 select-none">
                  <span>◀ ENTRY GATE 1</span>
                  <span className="text-amber-400/80 font-bold">--- DRIVE LANE • ONE WAY • SPEED LIMIT 10 KM/H ---</span>
                  <span>EXIT GATE 1 ▶</span>
                </div>

                {/* Bottom Bay Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {rowBottom.map((slot) => (
                    <ParkingSlotCard
                      key={slot.id}
                      slot={slot}
                      isSelected={selectedSlot?.id === slot.id}
                      onSelect={onSelectSlot}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
