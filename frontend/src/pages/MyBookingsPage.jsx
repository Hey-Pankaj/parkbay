import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  CalendarDays, 
  Car, 
  MapPin, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  LogOut,
  AlertTriangle,
  Radio,
  ExternalLink
} from 'lucide-react';

export default function MyBookingsPage({ onGoToExplore }) {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchMyBookings();
  }, [user]);

  const fetchMyBookings = async () => {
    setIsLoading(true);
    try {
      const res = await api.getBookings({ user_id: user?.id || 1 });
      setBookings(res.bookings || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation? An instant refund will be initiated.')) {
      return;
    }
    try {
      const res = await api.cancelBooking(bookingId);
      setActionMsg({ text: res.message || 'Booking cancelled successfully.', type: 'success' });
      fetchMyBookings();
    } catch (err) {
      setActionMsg({ text: err.message || 'Failed to cancel booking.', type: 'error' });
    }
  };

  const handleRelease = async (bookingId) => {
    try {
      const res = await api.releaseBooking(bookingId);
      setActionMsg({ text: res.message || 'Bay released successfully.', type: 'success' });
      fetchMyBookings();
    } catch (err) {
      setActionMsg({ text: err.message || 'Failed to release bay.', type: 'error' });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            Active (Parked)
          </span>
        );
      case 'confirmed':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            <Clock className="w-3 h-3" /> Upcoming
          </span>
        );
      case 'completed':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/50 text-slate-300 border border-slate-600/30">
            <CheckCircle2 className="w-3 h-3" /> Completed
          </span>
        );
      case 'cancelled':
        return (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3 h-3" /> Cancelled
          </span>
        );
      default:
        return <span>{status}</span>;
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <CalendarDays className="w-7 h-7 text-emerald-400" />
            My Parking Reservations
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track active parking sessions, view digital receipts, or cancel upcoming bookings.
          </p>
        </div>

        <button
          onClick={onGoToExplore}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-navy-950 font-bold text-xs tracking-wide shadow-md shadow-emerald-500/20 transition-all self-start sm:self-auto"
        >
          <Car className="w-4 h-4" />
          Reserve Another Bay
        </button>
      </div>

      {/* Action Notification Alert */}
      {actionMsg.text && (
        <div className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
          actionMsg.type === 'success'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
            : 'bg-rose-500/15 border-rose-500/30 text-rose-300'
        }`}>
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg({ text: '', type: '' })} className="text-xs opacity-75 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* Bookings List */}
      {isLoading ? (
        <div className="text-center py-20 text-slate-400">Loading your reservations...</div>
      ) : bookings.length === 0 ? (
        <div className="bg-glass-card border border-white/10 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-400">
            <Car className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">No active reservations found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
              You haven't reserved any parking bays yet. Explore our smart facilities and pick a bay to get started!
            </p>
          </div>
          <button
            onClick={onGoToExplore}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 text-navy-950 font-bold text-xs shadow-md"
          >
            Find Available Parking
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => {
            const isEligibleCancel = ['confirmed', 'active'].includes(booking.booking_status);
            const isActive = booking.booking_status === 'active';

            return (
              <div
                key={booking.id}
                className="bg-glass-card border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-all space-y-4"
              >
                {/* Header line */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-white/5 px-2.5 py-1 rounded-lg">
                      {booking.booking_ref}
                    </span>
                    <span className="font-semibold text-white text-sm">
                      {booking.facility_name}
                    </span>
                  </div>
                  <div>{getStatusBadge(booking.booking_status)}</div>
                </div>

                {/* Grid Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Assigned Bay</span>
                    <span className="text-lg font-extrabold font-mono text-emerald-400">
                      {booking.slot_code}
                    </span>
                    <span className="text-[10px] text-slate-500 block uppercase font-mono">
                      {booking.slot_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Vehicle Plate</span>
                    <div className="license-plate px-2 py-0.5 rounded text-xs font-bold inline-block">
                      {booking.vehicle_number}
                    </div>
                    <span className="text-[10px] text-slate-500 block capitalize mt-0.5">
                      {booking.vehicle_type}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Duration & Schedule</span>
                    <span className="text-white font-medium block">
                      {booking.total_hours} Hours
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {' → '}
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400 block mb-0.5">Total Paid</span>
                    <span className="text-base font-bold text-white block">
                      ₹{booking.paid_amount}
                    </span>
                    <span className="text-[10px] text-emerald-400 font-medium">
                      Status: {booking.payment_status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Bar */}
                {isEligibleCancel && (
                  <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-white/5">

                    {isActive && (
                      <button
                        onClick={() => handleRelease(booking.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-semibold transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Release Bay / Exit
                      </button>
                    )}

                    <button
                      onClick={() => handleCancel(booking.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Cancel & Refund
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
