import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  Lock, 
  Mail, 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  Sparkles, 
  AlertCircle,
  Phone,
  LayoutDashboard
} from 'lucide-react';

export default function LoginPage({ onBackToLanding, initialRole = 'driver' }) {
  const { login, register } = useAuth();
  
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      if (isRegisterMode) {
        await register({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          password,
          role,
          phone
        });
        await login(email.trim().toLowerCase(), password);
      } else {
        await login(email.trim().toLowerCase(), password);
      }
      // After login, AuthContext will set user and App.jsx will automatically show Dashboard!
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative selection:bg-emerald-500 selection:text-navy-950 overflow-hidden">
      
      {/* Background parking garage image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 scale-105 pointer-events-none"
        style={{ backgroundImage: `url('/parking-bg.jpg')` }}
      ></div>
      <div className="absolute inset-0 bg-gradient-to-b from-navy-950/85 via-navy-950/90 to-navy-950 pointer-events-none"></div>

      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[300px] bg-gradient-to-tr from-emerald-500/15 via-teal-500/10 to-cyan-500/15 blur-[120px] pointer-events-none rounded-full"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4">
        
        {/* Back Link */}
        <button
          onClick={onBackToLanding}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Landing Page</span>
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/25">
            <Car className="w-8 h-8 text-navy-950" strokeWidth={2.5} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
            Park<span className="text-emerald-400">Bay</span> Portal
          </h2>
          <p className="text-xs text-slate-400">
            {isRegisterMode ? 'Create your smart parking account' : 'Sign in to access your dashboard'}
          </p>
        </div>

        {/* Card */}
        <div className="mt-6 bg-glass-card border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          
          {/* Role Selector Tabs */}
          <div className="grid grid-cols-2 p-1 bg-navy-950/80 rounded-xl border border-white/10 text-xs font-medium">
            <button
              type="button"
              onClick={() => handleRoleChange('driver')}
              className={`py-2 rounded-lg transition-all ${
                role === 'driver'
                  ? 'bg-emerald-500 text-navy-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Driver / Owner
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`py-2 rounded-lg transition-all ${
                role === 'admin'
                  ? 'bg-amber-400 text-navy-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Facility Admin
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {isRegisterMode && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-navy-950/80 border border-white/15 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                      placeholder="e.g. Alex Driver"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full bg-navy-950/80 border border-white/15 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono"
                  placeholder="user@parkbay.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-navy-950/80 border border-white/15 rounded-xl pl-10 pr-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500"
                  placeholder="••••••••"
                />
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
              className={`w-full py-3.5 rounded-xl text-navy-950 font-bold text-sm tracking-wide shadow-lg transition-all disabled:opacity-50 ${
                role === 'admin'
                  ? 'bg-amber-400 hover:bg-amber-300 shadow-amber-400/25'
                  : 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/25'
              }`}
            >
              {isSubmitting
                ? 'Processing...'
                : isRegisterMode
                ? `Create ${role === 'admin' ? 'Admin' : 'Driver'} Account & Launch`
                : `Sign In as ${role === 'admin' ? 'Admin' : 'Driver'} & Go to Dashboard`}
            </button>
          </form>

          {/* Toggle between Register and Sign in */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => {
                setIsRegisterMode(!isRegisterMode);
                setErrorMsg('');
              }}
              className="text-xs text-slate-400 hover:text-emerald-400 underline transition-colors"
            >
              {isRegisterMode
                ? 'Already have an account? Sign In'
                : "Don't have an account yet? Create one here"}
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
