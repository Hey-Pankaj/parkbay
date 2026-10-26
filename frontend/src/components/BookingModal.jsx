import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Car, 
  Zap, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  CheckCircle2, 
  QrCode, 
  ArrowRight,
  AlertCircle
} from 'lucide-react';

export default function BookingModal({
  isOpen,
  onClose,
  slot,
  facility,
  startTime,
  durationHours,
  onBookingSuccess
}) {
  const { user } = useAuth();

  const [driverName, setDriverName] = useState(user?.full_name || 'Alex Driver');
  const [driverPhone, setDriverPhone] = useState(user?.phone || '+91 98765 43210');
  const [vehicleNumber, setVehicleNumber] = useState('KA01MJ4321');
  const [vehicleType, setVehicleType] = useState('sedan');
  const [paymentMethod, setPaymentMethod] = useState('upi');
  
  const [calculation, setCalculation] = useState(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [completedBooking, setCompletedBooking] = useState(null);

  // Recalculate price when slot, startTime or duration changes
  useEffect(() => {
    if (!slot || !isOpen) return;
    fetchCalculation();
  }, [slot, startTime, durationHours, isOpen]);

  const fetchCalculation = async () => {
    setIsCalculating(true);
    setErrorMsg('');
    try {
      const res = await api.calculateCharges({
        slot_id: slot.id,
        facility_id: facility?.id,
        start_time: startTime,
        hours: durationHours
      });
      setCalculation(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsCalculating(false);
    }
  };

  if (!isOpen || !slot) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const payload = {
        facility_id: facility.id,
        slot_id: slot.id,
        user_id: user?.id || 1,
        driver_name: driverName.trim(),
        driver_phone: driverPhone.trim(),
        vehicle_number: vehicleNumber.trim().toUpperCase(),
        vehicle_type: vehicleType,
        start_time: startTime,
        hours: durationHours,
        payment_method: paymentMethod
      };

      const res = await api.createBooking(payload);
      setCompletedBooking(res.booking);
      if (onBookingSuccess) onBookingSuccess(res.booking);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete reservation. Please try another slot.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCompletedBooking(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md">
      <div 
        className="relative w-full max-w-lg bg-navy-900 border border-white/15 rounded-3xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Car className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">
                {completedBooking ? 'Reservation Confirmed' : `Reserve Bay ${slot.slot_code}`}
              </h3>
              <p className="text-xs text-slate-400">{facility?.name}</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {completedBooking ? (
            /* Booking Confirmation Receipt */
            <div className="text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center mx-auto text-emerald-400 shadow-lg shadow-emerald-500/20 animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h4 className="text-xl font-extrabold text-white">Booking Guaranteed!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Your parking space has been secured and registered into the barrier gate ANPR system.
                </p>
              </div>

              {/* Digital Pass Card */}
              <div className="bg-asphalt p-5 rounded-2xl border border-white/15 text-left space-y-3 font-mono">
                <div className="flex justify-between items-start border-b border-white/10 pb-3">
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Booking Reference</div>
                    <div className="text-lg font-bold text-emerald-400">{completedBooking.booking_ref}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-400 uppercase">Allocated Bay</div>
                    <div className="text-xl font-bold text-white">{completedBooking.slot_code}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-400">Vehicle:</span>{' '}
                    <span className="text-white font-bold">{completedBooking.vehicle_number}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Duration:</span>{' '}
                    <span className="text-white font-bold">{completedBooking.total_hours} hrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Driver:</span>{' '}
                    <span className="text-white font-bold">{completedBooking.driver_name}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Paid Fee:</span>{' '}
                    <span className="text-emerald-400 font-bold">₹{completedBooking.paid_amount}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5 text-cyan-400">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>ANPR Camera Auto-Entry Ready</span>
                  </div>
                  <span>Status: PAID</span>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/20 transition-all"
              >
                Done & View on Floor Map
              </button>
            </div>
          ) : (
            /* Booking Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Slot Summary Pill */}
              <div className="bg-white/5 p-3 rounded-xl border border-white/10 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400">Selected Bay: </span>
                  <span className="font-bold text-white font-mono text-sm">{slot.slot_code}</span>
                  <span className="ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-white/10 text-slate-300">
                    {slot.slot_type}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400">Rate: </span>
                  <span className="font-bold text-emerald-400 font-mono">₹{slot.hourly_rate}/hr</span>
                </div>
              </div>

              {/* Driver Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Driver Full Name</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                    placeholder="Alex Driver"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={driverPhone}
                    onChange={(e) => setDriverPhone(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                    placeholder="+91 98765 43210"
                  />
                </div>
              </div>

              {/* Vehicle Number Plate & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Vehicle License Plate
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={14}
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-mono font-bold tracking-wider focus:outline-none focus:border-amber-400 uppercase"
                    placeholder="KA01MJ4321"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">Format: State + RTO + Code (e.g. MH02AB1234)</span>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Vehicle Classification</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full bg-navy-950/80 border border-white/15 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  >
                    <option value="sedan">Sedan / Hatchback</option>
                    <option value="suv">SUV / MUV / Compact Truck</option>
                    <option value="ev">Electric Vehicle (EV)</option>
                    <option value="two_wheeler">Two-Wheeler / Bike</option>
                  </select>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5 text-cyan-400" />
                  Instant Payment Gateway
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR', sub: 'GPay, PhonePe, Paytm' },
                    { id: 'card', label: 'Cards', sub: 'Visa, Master, RuPay' },
                    { id: 'wallet', label: 'FastTag', sub: 'Instant Auto-Debit' }
                  ].map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => setPaymentMethod(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        paymentMethod === p.id
                          ? 'bg-cyan-500/15 border-cyan-400 text-white shadow-sm'
                          : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <div className="font-semibold text-xs">{p.label}</div>
                      <div className="text-[10px] opacity-70 truncate">{p.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Automated Pricing Calculation Breakdown */}
              {calculation && (
                <div className="bg-slate-900/90 border border-white/10 p-3.5 rounded-2xl space-y-1.5 text-xs font-mono">
                  <div className="text-[11px] font-bold uppercase text-slate-400 tracking-wider font-sans mb-1">
                    Charge Breakdown
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Base Fare ({calculation.total_hours}h × ₹{calculation.hourly_rate}/h):</span>
                    <span>₹{calculation.base_amount}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>GST & Parking Cess (18%):</span>
                    <span>₹{calculation.gst_amount}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold text-sm pt-1.5 border-t border-white/10 font-sans">
                    <span>Total Payable:</span>
                    <span>₹{calculation.total_amount}</span>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || isCalculating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-navy-950 font-bold text-sm tracking-wide shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Processing Reservation...</span>
                ) : (
                  <>
                    <span>Confirm & Pay ₹{calculation?.total_amount || '--'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          )}
        </div>
      </div>
    </div>
  );
}
