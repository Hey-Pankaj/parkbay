import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { X, Clock, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function WaitlistModal({ isOpen, onClose, facility }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.full_name || 'Aarav Sharma');
  const [vehicle, setVehicle] = useState(user?.vehicle_number || 'KA01MJ4321');
  const [hours, setHours] = useState(2);
  const [slotType, setSlotType] = useState('standard');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successInfo, setSuccessInfo] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (user?.full_name) setName(user.full_name);
    if (user?.vehicle_number) setVehicle(user.vehicle_number);
  }, [user]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await api.joinWaitlist({
        facility_id: facility?.id || 1,
        name: name.trim(),
        vehicle: vehicle.trim().toUpperCase(),
        hours: Number(hours),
        slot_type: slotType
      });
      setSuccessInfo(res);
    } catch (err) {
      setErrorMsg(err.message || 'Could not join waiting list.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccessInfo(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md bg-navy-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-white text-base">Join Priority Waitlist</h3>
          </div>
          <button onClick={handleClose} className="p-1.5 text-slate-400 hover:text-white rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {successInfo ? (
            <div className="text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto text-amber-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-white">Added to Waitlist!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  You are positioned <b className="text-amber-400 font-mono text-sm">#{successInfo.position}</b> in line for {facility?.name}.
                </p>
              </div>
              <div className="bg-white/5 p-4 rounded-xl border border-white/10 text-xs text-slate-300 text-left space-y-1">
                <div>Vehicle: <b className="text-white font-mono">{vehicle}</b></div>
                <div>Driver: <b className="text-white">{name}</b></div>
                <div>Policy: <span className="text-emerald-400">First In, First Out (FIFO) Auto-Assignment</span></div>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-navy-950 font-bold text-xs shadow-md"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-slate-300">
                When an active vehicle departs from {facility?.name}, the smart queue will automatically hold the slot for you.
              </p>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Driver Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle License Plate</label>
                <input
                  type="text"
                  required
                  value={vehicle}
                  onChange={(e) => setVehicle(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-mono font-bold uppercase focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Duration</label>
                  <select
                    value={hours}
                    onChange={(e) => setHours(Number(e.target.value))}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value={1}>1 Hour</option>
                    <option value={2}>2 Hours</option>
                    <option value={4}>4 Hours</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Preferred Slot</label>
                  <select
                    value={slotType}
                    onChange={(e) => setSlotType(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none"
                  >
                    <option value="standard">Standard</option>
                    <option value="ev_charging">EV Charging</option>
                    <option value="suv">SUV</option>
                  </select>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-navy-950 font-bold text-sm tracking-wide shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Enter Waitlist Queue'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
