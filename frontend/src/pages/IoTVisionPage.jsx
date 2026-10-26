import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Radio, 
  Camera, 
  ShieldCheck, 
  ShieldAlert, 
  Zap, 
  BatteryCharging, 
  Wifi, 
  CheckCircle2, 
  Car, 
  RotateCw, 
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function IoTVisionPage({ slots, onRefreshSlots }) {
  const [plateInput, setPlateInput] = useState('KA01MJ4321');
  const [gateId, setGateId] = useState('GATE-01 (North Entry)');
  const [barrierState, setBarrierState] = useState('CLOSED'); // 'CLOSED' or 'OPEN'
  const [anprResult, setAnprResult] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanLog, setScanLog] = useState([
    'ANPR High-Speed Optical Vision System Online (1080p @ 60 FPS)',
    'Automated OCR Neural Model Loaded: ParkBay-PlateNet',
    'Gate Barrier Controller: Ready (GPIO Pin 18 Active)'
  ]);

  const [sensors, setSensors] = useState([]);
  const [isLoadingSensors, setIsLoadingSensors] = useState(true);

  useEffect(() => {
    fetchSensorTelemetry();
  }, []);

  const fetchSensorTelemetry = async () => {
    setIsLoadingSensors(true);
    try {
      const res = await api.getSensors();
      setSensors(res.sensors || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingSensors(false);
    }
  };

  const handleScanPlate = async (e) => {
    if (e) e.preventDefault();
    if (!plateInput.trim()) return;

    setIsScanning(true);
    const plate = plateInput.trim().toUpperCase();
    
    // Add logs
    setScanLog(prev => [
      `[${new Date().toLocaleTimeString()}] Camera Trigger: Vehicle Detected at ${gateId}`,
      `[${new Date().toLocaleTimeString()}] Frame captured. Running License Plate OCR on '${plate}'...`,
      ...prev.slice(0, 8)
    ]);

    try {
      const res = await api.simulateAnprScan(plate, gateId);
      setAnprResult(res);
      setBarrierState('OPEN');

      setScanLog(prev => [
        `[${new Date().toLocaleTimeString()}] ✓ MATCH CONFIRMED: Active Booking found for ${res.booking.driver_name} (Slot ${res.booking.slot_code})`,
        `[${new Date().toLocaleTimeString()}] ⚡ COMMAND: Actuator Solenoid OPEN -> Barrier Arm Raised!`,
        ...prev.slice(0, 8)
      ]);

      if (onRefreshSlots) onRefreshSlots();
      fetchSensorTelemetry();

      // Auto close barrier after 8 seconds
      setTimeout(() => {
        setBarrierState('CLOSED');
        setScanLog(prev => [
          `[${new Date().toLocaleTimeString()}] Vehicle cleared optical loop detector -> Barrier Arm CLOSED.`,
          ...prev.slice(0, 8)
        ]);
      }, 8000);

    } catch (err) {
      setBarrierState('CLOSED');
      setAnprResult({
        access_granted: false,
        message: err.message || 'Access Denied: Plate not found in reservation database.'
      });

      setScanLog(prev => [
        `[${new Date().toLocaleTimeString()}] ✕ ACCESS DENIED: Unregistered or Expired Booking for plate '${plate}'`,
        `[${new Date().toLocaleTimeString()}] Security Alert: Gate remains locked.`,
        ...prev.slice(0, 8)
      ]);
    } finally {
      setIsScanning(false);
    }
  };

  const handleSimulateSensor = async (sensorCode, action) => {
    try {
      const res = await api.simulateSensor(sensorCode, action);
      fetchSensorTelemetry();
      if (onRefreshSlots) onRefreshSlots();
    } catch (err) {
      alert(err.message || 'Failed to trigger sensor simulation.');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-widest bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
              HARDWARE INTEGRATION FOUNDATION
            </span>
            <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Telemetry Stream
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight mt-1 flex items-center gap-2.5">
            <Radio className="w-7 h-7 text-cyan-400" />
            IoT Bay Sensors & ANPR Camera Vision Console
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Simulate and test smart automated entry boom barriers and ultrasonic slot occupancy distance sensors.
          </p>
        </div>

        <button
          onClick={fetchSensorTelemetry}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-semibold self-start sm:self-auto transition-colors"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Poll Telemetry
        </button>
      </div>

      {/* SECTION 1: ANPR SMART BARRIER CAMERA SIMULATOR */}
      <div className="bg-glass-card border border-cyan-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden space-y-6">
        
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ANPR Camera & Boom Barrier Simulator</h2>
              <p className="text-xs text-slate-400">Automatic Number Plate Recognition Access Control</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Gate Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider ${
              barrierState === 'OPEN'
                ? 'bg-emerald-500 text-navy-950 animate-pulse shadow-lg shadow-emerald-500/30'
                : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
            }`}>
              {barrierState === 'OPEN' ? 'BARRIER OPEN' : 'BARRIER CLOSED'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Simulated Camera Viewfinder & Barrier Visual */}
          <div className="lg:col-span-7 bg-navy-950 rounded-2xl border border-white/15 p-5 relative overflow-hidden flex flex-col justify-between" style={{ minHeight: '340px' }}>
            
            {/* Viewfinder Target Overlays */}
            <div className="absolute inset-4 pointer-events-none border border-cyan-500/20 rounded-xl">
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400"></div>
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400"></div>
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400"></div>
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400"></div>
              <div className="absolute top-2 left-3 text-[10px] font-mono text-cyan-400/80 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                CAM-01 • ENTRY LANE 1 • OCR ACTIVE
              </div>
            </div>

            {/* Visual Boom Barrier graphic */}
            <div className="my-auto py-10 flex flex-col items-center justify-center relative z-10">
              
              {/* Barrier Arm */}
              <div className="w-full max-w-md flex items-center justify-center">
                <div className="w-6 h-28 bg-slate-700 rounded-t-lg border-2 border-slate-500 shadow-xl flex flex-col items-center justify-start pt-3">
                  <div className={`w-3 h-3 rounded-full ${barrierState === 'OPEN' ? 'bg-emerald-400 shadow-lg shadow-emerald-400' : 'bg-red-500 shadow-lg shadow-red-500'}`}></div>
                </div>

                {/* Animated Boom Gate Pole */}
                <div 
                  className={`h-4 flex-1 rounded-r-lg transition-transform duration-700 origin-left border shadow-2xl ${
                    barrierState === 'OPEN'
                      ? '-rotate-75 bg-gradient-to-r from-emerald-500 via-white to-emerald-500 border-emerald-400'
                      : 'rotate-0 bg-gradient-to-r from-red-600 via-white to-red-600 border-red-500'
                  }`}
                  style={{
                    backgroundImage: 'repeating-linear-gradient(45deg, #ef4444, #ef4444 15px, #ffffff 15px, #ffffff 30px)'
                  }}
                ></div>
              </div>

              {/* Scanned Vehicle Plate Badge */}
              <div className="mt-8 text-center">
                <div className="text-[11px] text-slate-400 mb-1">Optical OCR Recognition Target:</div>
                <div className="license-plate px-4 py-1.5 rounded-lg text-base font-extrabold shadow-xl inline-block tracking-widest">
                  {plateInput || 'KA01MJ4321'}
                </div>
              </div>

            </div>

            {/* Camera Bottom telemetry bar */}
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-t border-white/10 pt-2 z-10">
              <span>FOV: 85° | EXPOSURE: AUTO</span>
              <span>CONFIDENCE: {anprResult?.access_granted ? '99.8%' : '--'}</span>
              <span>GATE: {gateId.split(' ')[0]}</span>
            </div>

          </div>

          {/* Controls & Live Console Feed */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            
            {/* Input Form */}
            <form onSubmit={handleScanPlate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  License Plate to Scan at Gate
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={plateInput}
                    onChange={(e) => setPlateInput(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="flex-1 bg-navy-950/80 border border-white/20 rounded-xl px-3.5 py-2 text-sm text-amber-300 font-mono font-bold tracking-wider uppercase focus:outline-none focus:border-cyan-400"
                    placeholder="KA01MJ4321"
                  />
                  <button
                    type="submit"
                    disabled={isScanning}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    Scan
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400 text-[11px]">Quick Tests:</span>
                <button
                  type="button"
                  onClick={() => setPlateInput('KA01MJ4321')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 text-[10px] font-mono"
                >
                  KA01MJ4321 (Valid)
                </button>
                <button
                  type="button"
                  onClick={() => setPlateInput('MH02AB9876')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-emerald-400 border border-white/10 text-[10px] font-mono"
                >
                  MH02AB9876 (Valid)
                </button>
                <button
                  type="button"
                  onClick={() => setPlateInput('DL9CAA0001')}
                  className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-rose-400 border border-white/10 text-[10px] font-mono"
                >
                  DL9CAA0001 (Denied)
                </button>
              </div>
            </form>

            {/* Scan Result Notice */}
            {anprResult && (
              <div className={`p-3.5 rounded-2xl border text-xs ${
                anprResult.access_granted
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200'
                  : 'bg-rose-500/15 border-rose-500/40 text-rose-200'
              }`}>
                <div className="font-bold flex items-center gap-1.5 text-sm mb-1">
                  {anprResult.access_granted ? (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>ACCESS GRANTED • BARRIER OPEN</span>
                    </>
                  ) : (
                    <>
                      <ShieldAlert className="w-4 h-4 text-rose-400" />
                      <span>ACCESS DENIED</span>
                    </>
                  )}
                </div>
                <div>{anprResult.message}</div>
              </div>
            )}

            {/* Optical ANPR Diagnostic Terminal Log */}
            <div className="bg-navy-950/90 border border-white/10 rounded-2xl p-3.5 font-mono text-[11px] space-y-1 text-slate-300 max-h-48 overflow-y-auto">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                Gate Edge Terminal Log
              </div>
              {scanLog.map((log, idx) => (
                <div key={idx} className="truncate">
                  {log.includes('✓') ? (
                    <span className="text-emerald-400">{log}</span>
                  ) : log.includes('✕') ? (
                    <span className="text-rose-400">{log}</span>
                  ) : log.includes('⚡') ? (
                    <span className="text-amber-300 font-bold">{log}</span>
                  ) : (
                    <span className="text-slate-400">{log}</span>
                  )}
                </div>
              ))}
            </div>

          </div>

        </div>

      </div>

      {/* SECTION 2: ULTRASONIC SENSOR TELEMETRY MESH */}
      <div className="bg-glass-card border border-white/10 rounded-3xl p-6 shadow-xl space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Radio className="w-5 h-5 text-emerald-400" />
              Ultrasonic Slot Occupancy Sensor Nodes
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live reading of HC-SR04/JSN-SR04T ultrasonic distance sensors mounted above parking bays.
            </p>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {sensors.length} Nodes Active • LoRaWAN Mesh Online
          </div>
        </div>

        {isLoadingSensors ? (
          <div className="text-center py-10 text-slate-400">Reading sensor bus...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {sensors.slice(0, 12).map((s) => {
              const isOccupied = s.is_occupied;
              return (
                <div 
                  key={s.id}
                  className={`p-3.5 rounded-2xl border transition-all ${
                    isOccupied 
                      ? 'bg-rose-950/20 border-rose-500/40 text-rose-200' 
                      : 'bg-emerald-950/20 border-emerald-500/40 text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="font-bold text-white">{s.sensor_code.split('-').slice(2).join('-')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      isOccupied ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                    }`}>
                      {isOccupied ? 'CAR PARKED' : 'CLEAR'}
                    </span>
                  </div>

                  <div className="my-2.5 flex items-baseline justify-between font-mono">
                    <span className="text-2xl font-extrabold text-white">
                      {Math.round(s.distance_cm)}
                      <span className="text-xs font-normal text-slate-400 ml-1">cm</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isOccupied ? 'Vehicle within range' : 'Ground reflection'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-white/5 pt-2">
                    <span className="flex items-center gap-1">
                      <BatteryCharging className="w-3 h-3 text-emerald-400" /> {s.battery_pct}%
                    </span>
                    <span className="flex items-center gap-1">
                      <Wifi className="w-3 h-3 text-cyan-400" /> {s.signal_strength_dbm} dBm
                    </span>
                  </div>

                  {/* Manual Simulation Toggle Button */}
                  <button
                    onClick={() => handleSimulateSensor(s.sensor_code, isOccupied ? 'vacate' : 'occupy')}
                    className="w-full mt-2.5 py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-[11px] font-medium transition-colors"
                  >
                    Simulate {isOccupied ? 'Departure' : 'Parking'}
                  </button>
                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
}
