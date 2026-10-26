import React from 'react';
import { 
  Zap, 
  Car, 
  Accessibility, 
  Truck, 
  Wrench, 
  CheckCircle2, 
  Radio,
  Clock
} from 'lucide-react';

export default function ParkingSlotCard({ slot, isSelected, onSelect }) {
  const isBusy = slot.busy;
  const isMaintenance = slot.status === 'maintenance' || slot.is_maintenance;
  const activeBooking = slot.active_booking;

  const getTypeDetails = () => {
    switch (slot.slot_type) {
      case 'ev_charging':
        return {
          label: 'EV Fast Charge',
          icon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
        };
      case 'suv':
        return {
          label: 'SUV / XL',
          icon: <Truck className="w-3.5 h-3.5 text-blue-400" />,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30'
        };
      case 'compact':
        return {
          label: 'Compact',
          icon: <Car className="w-3.5 h-3.5 text-amber-400" />,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30'
        };
      case 'accessible':
        return {
          label: 'Accessible',
          icon: <Accessibility className="w-3.5 h-3.5 text-purple-400" />,
          badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30'
        };
      default:
        return {
          label: 'Standard',
          icon: <Car className="w-3.5 h-3.5 text-slate-400" />,
          badgeColor: 'bg-slate-700/50 text-slate-300 border-slate-600/30'
        };
    }
  };

  const typeInfo = getTypeDetails();

  // State-based CSS styling
  let containerClasses = "relative group flex flex-col justify-between p-3.5 rounded-xl border-2 transition-all duration-200 select-none cursor-pointer ";
  
  if (isSelected) {
    containerClasses += "bg-blue-950/70 border-blue-400 shadow-lg shadow-blue-500/30 ring-2 ring-blue-400/50 scale-[1.02] ";
  } else if (isMaintenance) {
    containerClasses += "bg-amber-950/20 border-amber-600/40 text-amber-200 cursor-not-allowed opacity-80 ";
  } else if (isBusy) {
    containerClasses += "bg-rose-950/30 border-rose-600/40 text-rose-200 hover:border-rose-500/70 ";
  } else {
    containerClasses += "bg-slate-900/60 hover:bg-slate-800/80 border-slate-700/60 hover:border-emerald-500/80 hover:shadow-md hover:shadow-emerald-500/10 ";
  }

  const handleClick = () => {
    if (isMaintenance) return;
    onSelect(slot);
  };

  return (
    <div 
      onClick={handleClick}
      className={containerClasses}
      style={{ minHeight: '140px' }}
      role="button"
      tabIndex={0}
      aria-label={`Slot ${slot.slot_code}, ${isBusy ? 'Occupied' : 'Available'}`}
    >
      {/* Top Header: Slot Code & Status Badge */}
      <div className="flex items-center justify-between gap-1">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-base font-bold text-white tracking-wider">
            {slot.slot_code}
          </span>
          {slot.has_ev_charger && (
            <span title="EV Level-2 Fast Charger Available">
              <Zap className="w-4 h-4 text-emerald-400 fill-emerald-400 animate-pulse" />
            </span>
          )}
        </div>

        {/* Status Indicator */}
        {isSelected ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500 text-white shadow-sm">
            <CheckCircle2 className="w-3 h-3" /> Selected
          </span>
        ) : isMaintenance ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <Wrench className="w-3 h-3" /> Maint
          </span>
        ) : isBusy ? (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Occupied
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span> Free
          </span>
        )}
      </div>

      {/* Middle Content: Vehicle license plate if occupied, or Rate & Type */}
      <div className="my-2">
        {isBusy ? (
          <div className="flex flex-col items-center justify-center py-1">
            <div className="license-plate px-2 py-0.5 rounded text-[11px] font-bold text-center w-full truncate">
              {activeBooking ? activeBooking.vehicle_number : 'PARKED VEHICLE'}
            </div>
            {activeBooking?.driver_name && (
              <div className="text-[11px] text-slate-400 text-center mt-1 truncate max-w-full">
                {activeBooking.driver_name}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-xl font-extrabold text-emerald-400 tracking-tight">
              ₹{slot.hourly_rate}
              <span className="text-[11px] font-normal text-slate-400">/hr</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              {typeInfo.icon}
              <span className="truncate">{typeInfo.label}</span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Footer: IoT Distance Telemetry pill */}
      <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px] text-slate-400 font-mono">
        <div className="flex items-center gap-1" title="Ultrasonic Distance Sensor">
          <Radio className={`w-3 h-3 ${isBusy ? 'text-rose-400' : 'text-emerald-400'}`} />
          <span>{slot.sensor ? `${Math.round(slot.sensor.distance_cm)}cm` : 'IoT Ready'}</span>
        </div>
        <span className="text-slate-400">Block {slot.block}</span>
      </div>

      {/* Road border yellow parking mark accents */}
      <div className="absolute -left-0.5 top-3 bottom-3 w-1 bg-amber-400/40 rounded-l"></div>
      <div className="absolute -right-0.5 top-3 bottom-3 w-1 bg-amber-400/40 rounded-r"></div>
    </div>
  );
}
