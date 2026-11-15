import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { 
  Radio, 
  Camera, 
  Eye, 
  Play, 
  Pause, 
  RotateCcw, 
  Maximize2, 
  Minimize2, 
  Upload, 
  BarChart3, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  Zap, 
  Car, 
  LogOut, 
  Sliders, 
  Sparkles, 
  Layers, 
  Download, 
  X,
  Clock,
  Activity,
  ArrowRight
} from 'lucide-react';

// Calibrated 12 parking bay coordinates mapped precisely to the surveillance camera view
const INITIAL_BAYS = [
  { id: 'Slot A-01', name: 'Bay A-01 (Yellow Sedan)', isOccupied: true, confidence: 98.6, pixels: 4120, x: 230, y: 168, left: 25.5, top: 31, width: 6.8, height: 22, vehicleType: 'Standard Sedan', plate: 'KA01MJ4321', duration: '1h 42m' },
  { id: 'Slot A-02', name: 'Bay A-02 (Blue Hatchback)', isOccupied: true, confidence: 99.1, pixels: 4350, x: 298, y: 168, left: 33.0, top: 31, width: 6.8, height: 22, vehicleType: 'Compact Hatch', plate: 'MH02CB9988', duration: '2h 15m' },
  { id: 'Slot A-03', name: 'Bay A-03 (Red Sedan)', isOccupied: true, confidence: 97.8, pixels: 4080, x: 362, y: 168, left: 40.0, top: 31, width: 6.8, height: 22, vehicleType: 'Standard Sedan', plate: 'DL04AF5521', duration: '0h 50m' },
  { id: 'Slot A-04', name: 'Bay A-04 (White SUV Angled)', isOccupied: true, confidence: 95.4, pixels: 5620, x: 425, y: 135, left: 47.0, top: 25, width: 13.0, height: 26, vehicleType: 'Premium SUV', plate: 'KA05NE1190', duration: '0h 28m' },
  { id: 'Slot A-05', name: 'Bay A-05 (Green EV FastBay)', isOccupied: true, confidence: 98.2, pixels: 4190, x: 552, y: 168, left: 61.0, top: 31, width: 6.8, height: 22, vehicleType: 'Electric Vehicle', plate: 'KA01EV8823', duration: '3h 10m' },
  
  { id: 'Slot B-01', name: 'Bay B-01 (Lime Green Car)', isOccupied: true, confidence: 98.9, pixels: 4210, x: 230, y: 330, left: 25.5, top: 61, width: 6.8, height: 22, vehicleType: 'Compact Sedan', plate: 'TN07AA4310', duration: '1h 05m' },
  { id: 'Slot B-02', name: 'Bay B-02 (Open EV Bay)', isOccupied: false, confidence: 96.4, pixels: 340, x: 298, y: 330, left: 33.0, top: 61, width: 6.8, height: 22, vehicleType: 'EV Charging Ready', plate: 'None (Vacant)', duration: '0m' },
  { id: 'Slot B-03', name: 'Bay B-03 (Purple Sedan)', isOccupied: true, confidence: 98.1, pixels: 4150, x: 362, y: 330, left: 40.0, top: 61, width: 6.8, height: 22, vehicleType: 'Standard Sedan', plate: 'KA03HA7741', duration: '2h 40m' },
  { id: 'Slot B-04', name: 'Bay B-04 (White Delivery Van)', isOccupied: true, confidence: 99.4, pixels: 5890, x: 430, y: 330, left: 47.5, top: 61, width: 7.0, height: 25, vehicleType: 'Commercial Van', plate: 'KA02CD1209', duration: '0h 35m' },
  { id: 'Slot B-05', name: 'Bay B-05 (Orange/Red Sedan)', isOccupied: true, confidence: 98.0, pixels: 4050, x: 498, y: 330, left: 55.0, top: 61, width: 6.8, height: 22, vehicleType: 'Standard Sedan', plate: 'KA01AB3322', duration: '1h 55m' },
  { id: 'Slot B-06', name: 'Bay B-06 (White Compact)', isOccupied: true, confidence: 97.2, pixels: 4110, x: 552, y: 330, left: 61.0, top: 61, width: 6.8, height: 22, vehicleType: 'Compact Hatch', plate: 'MH12PQ8912', duration: '4h 12m' },
  { id: 'Slot B-07', name: 'Bay B-07 (Open Standard Bay)', isOccupied: false, confidence: 95.8, pixels: 310, x: 175, y: 330, left: 19.3, top: 61, width: 6.2, height: 22, vehicleType: 'Standard Slot', plate: 'None (Vacant)', duration: '0m' }
];

export default function IoTVisionPage({ onGoToExplore }) {
  const { user, isAdmin, logout } = useAuth();

  // State Management
  const [bays, setBays] = useState(INITIAL_BAYS);
  const [selectedBayId, setSelectedBayId] = useState('all');
  const [highlightedBay, setHighlightedBay] = useState(null);
  
  // Camera & Stream Controls
  const [isStreaming, setIsStreaming] = useState(true);
  const [fps, setFps] = useState(30);
  const [zoomScale, setZoomScale] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  // Modals & Panels
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [streamSource, setStreamSource] = useState('Camera 01 (North Parking Lot)');
  const [activeSubView, setActiveSubView] = useState('vision'); // 'vision' | 'anpr'

  // ANPR Gate Simulator sub-state
  const [anprPlate, setAnprPlate] = useState('KA01MJ4321');
  const [barrierStatus, setBarrierStatus] = useState('CLOSED');
  const [anprResult, setAnprResult] = useState(null);
  const [isScanningPlate, setIsScanningPlate] = useState(false);

  const videoContainerRef = useRef(null);

  // Live ticking clock & dynamic simulation telemetry
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString());
      if (isStreaming) {
        // Subtle FPS jitter for authentic live stream feel
        setFps(Math.round((29.6 + Math.random() * 0.8) * 10) / 10);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  // Derived metrics
  const totalSlots = bays.length;
  const occupiedCount = bays.filter(b => b.isOccupied).length;
  const freeSlots = totalSlots - occupiedCount;
  const occupancyPercentage = Math.round((occupiedCount / totalSlots) * 100);

  // Toggle individual slot occupancy
  const handleToggleSlot = (id) => {
    setBays(prev => prev.map(bay => {
      if (bay.id === id) {
        const nextOccupied = !bay.isOccupied;
        return {
          ...bay,
          isOccupied: nextOccupied,
          confidence: nextOccupied ? Math.round((96 + Math.random() * 3.5) * 10) / 10 : Math.round((94 + Math.random() * 3.5) * 10) / 10,
          pixels: nextOccupied ? Math.floor(4000 + Math.random() * 600) : Math.floor(250 + Math.random() * 150),
          duration: nextOccupied ? '0h 01m' : '0m',
          plate: nextOccupied ? 'KA01MJ4321' : 'None (Vacant)'
        };
      }
      return bay;
    }));
  };

  // Reset to initial calibrated state
  const handleReset = () => {
    setBays(INITIAL_BAYS);
    setHighlightedBay(null);
    setSelectedBayId('all');
  };

  // Toggle Fullscreen on Video Feed container
  const handleToggleFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (!isFullscreen) {
      if (videoContainerRef.current.requestFullscreen) {
        videoContainerRef.current.requestFullscreen();
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
      setIsFullscreen(false);
    }
  };

  // ANPR Gate Barrier Test Trigger
  const handleScanPlate = async (e) => {
    if (e) e.preventDefault();
    if (!anprPlate.trim()) return;

    setIsScanningPlate(true);
    const plate = anprPlate.trim().toUpperCase();

    try {
      const res = await api.simulateAnprScan(plate, 'GATE-01 (North Entry)');
      setAnprResult(res);
      setBarrierStatus('OPEN');

      setTimeout(() => {
        setBarrierStatus('CLOSED');
      }, 7000);
    } catch (err) {
      setBarrierStatus('CLOSED');
      setAnprResult({
        access_granted: false,
        message: err.message || 'Access Denied: Plate not found in reservation database.'
      });
    } finally {
      setIsScanningPlate(false);
    }
  };

  const filteredBays = selectedBayId === 'all' 
    ? bays 
    : bays.filter(b => b.id === selectedBayId);

  return (
    <div className="space-y-6 animate-fadeIn max-w-[1440px] mx-auto text-slate-100 selection:bg-cyan-500 selection:text-navy-950 pb-12 font-sans">
      
      {/* 1. TOP SYSTEM HEADER (Matching screenshot layout in 100% English) */}
      <header className="bg-glass-card border border-cyan-500/20 rounded-3xl p-5 sm:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent blur-3xl pointer-events-none rounded-full"></div>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 relative z-10">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 p-0.5 shadow-xl shadow-cyan-500/30 flex-shrink-0">
              <div className="w-full h-full bg-navy-950 rounded-[14px] flex items-center justify-center">
                <span className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-mono">
                  P
                </span>
              </div>
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                <span>Smart Parking Lot Slot Detection System</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  CV-VISION v3.8
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5 font-mono flex items-center gap-2">
                <span>OpenCV · Real-time Surveillance · Analytics & Historical Telemetry</span>
                <span className="text-slate-600">•</span>
                <span className="text-emerald-400 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  Active Core
                </span>
              </p>
            </div>
          </div>

          {/* Right Status Badges & Controls */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 text-xs">
            
            {/* Current User */}
            <div className="px-3 py-1.5 rounded-xl bg-navy-950/80 border border-white/10 text-slate-300 flex items-center gap-1.5">
              <span className="text-slate-500">Current User:</span>
              <span className="font-semibold text-white">{user?.full_name || 'Admin Officer'}</span>
            </div>

            {/* Live Streaming Badge */}
            <div className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono font-semibold flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
              <span>{isStreaming ? `Live Stream · ${fps} FPS` : 'Stream Paused'}</span>
            </div>

            {/* Multi-Bay Detection Badge */}
            <div className="hidden sm:flex px-3 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-300 font-mono">
              Multi-Bay Zone Detection
            </div>

            {/* Pixel Occupancy Badge */}
            <div className="hidden md:flex px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/25 text-indigo-300 font-mono">
              Pixel Occupancy Recognition
            </div>

            {/* Sub-view toggle (Vision vs ANPR) */}
            <button
              onClick={() => setActiveSubView(prev => prev === 'vision' ? 'anpr' : 'vision')}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/15 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>{activeSubView === 'vision' ? 'ANPR Barrier Tool' : 'Camera Feed'}</span>
            </button>

            {/* Exit Console Button */}
            {onGoToExplore && (
              <button
                onClick={onGoToExplore}
                className="px-3.5 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                title="Return to Main Dashboard"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Console</span>
              </button>
            )}

          </div>

        </div>
      </header>

      {/* 2. THREE KEY METRIC KPI CARDS (Matching exact cards from screenshot) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: PARKING SLOTS - TOTAL */}
        <div className="bg-glass-card border border-white/10 hover:border-cyan-500/40 rounded-3xl p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">PARKING SLOTS - TOTAL</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-slate-300 border border-white/10">
              TOTAL CAPACITY
            </span>
          </div>
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl sm:text-5xl font-black text-white font-mono tracking-tight">
              {totalSlots}
            </span>
            <span className="text-xs text-slate-400 font-mono">Bays Configured</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Total marked parking bays monitored in camera detection zone.
          </p>
        </div>

        {/* Card 2: AVAILABLE SLOTS - FREE */}
        <div className="bg-glass-card border border-white/10 hover:border-emerald-500/40 rounded-3xl p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">AVAILABLE SLOTS - FREE</span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 animate-pulse">
              REAL-TIME VACANT
            </span>
          </div>
          <div className="flex items-baseline gap-3 my-2">
            <span className="text-4xl sm:text-5xl font-black text-emerald-400 font-mono tracking-tight text-shadow-glow">
              {freeSlots}
            </span>
            <span className="text-xs text-emerald-300/80 font-mono">
              ({100 - occupancyPercentage}% free)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Number of currently unoccupied parking bays ready for allocation.
          </p>
        </div>

        {/* Card 3: SYSTEM STATUS */}
        <div className="bg-glass-card border border-white/10 hover:border-blue-500/40 rounded-3xl p-6 shadow-xl transition-all relative overflow-hidden group">
          <div className="flex items-center justify-between text-xs font-mono mb-2">
            <span className="text-slate-400 uppercase tracking-wider font-semibold">SYSTEM STATUS</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
              isStreaming 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
            }`}>
              {isStreaming ? 'ONLINE' : 'STANDBY'}
            </span>
          </div>
          <div className="my-2">
            <div className="text-lg sm:text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isStreaming ? 'bg-cyan-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span>{isStreaming ? 'AI Vision Active · Model Ready' : 'Feed Paused · Standby'}</span>
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            {isStreaming 
              ? 'YOLO inference running at 30 FPS · Latency: 16ms' 
              : 'Click "Resume" to start real-time optical video stream.'}
          </p>
        </div>

      </div>

      {/* 3. MAIN WORKSPACE (2 Columns: Left = Camera Feed, Right = Detection Matrix Table) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Real-time Surveillance Feed / Live Feed (7 Cols) */}
        <div className="lg:col-span-7 bg-glass-card border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          
          {/* Feed Header & Action Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Camera className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Real-time Feed / Live Surveillance</h2>
                <p className="text-[11px] text-slate-400 font-mono">{streamSource}</p>
              </div>
            </div>

            {/* Action Buttons: Stream status, Import Video, Pause, Reset, Fullscreen */}
            <div className="flex flex-wrap items-center gap-2">
              
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isStreaming ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`}></span>
                <span>{isStreaming ? `${fps} FPS` : 'OFF'}</span>
              </span>

              <button
                onClick={() => setIsImportModalOpen(true)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1 transition-all"
                title="Select Camera Stream or Video Source"
              >
                <Upload className="w-3.5 h-3.5 text-cyan-400" />
                <span>Import Video</span>
              </button>

              <button
                onClick={() => setIsStreaming(!isStreaming)}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1 transition-all"
                title={isStreaming ? 'Pause Stream' : 'Resume Stream'}
              >
                {isStreaming ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{isStreaming ? 'Pause' : 'Resume'}</span>
              </button>

              <button
                onClick={handleReset}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 text-xs font-medium flex items-center gap-1 transition-all"
                title="Reset Bounding Boxes to Default"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>

              <button
                onClick={handleToggleFullscreen}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 transition-all"
                title="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-cyan-400" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </button>

            </div>

          </div>

          {/* Zoom / Scaling Slider Bar */}
          <div className="flex items-center gap-3 px-3 py-2 bg-navy-950/70 border border-white/10 rounded-2xl text-xs font-mono">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>Zoom Scale:</span>
            </span>
            <input
              type="range"
              min="60"
              max="140"
              value={zoomScale}
              onChange={(e) => setZoomScale(Number(e.target.value))}
              className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <span className="text-cyan-300 font-bold min-w-[3rem] text-right">{zoomScale}%</span>
            <button
              onClick={() => setZoomScale(100)}
              className="text-[10px] text-slate-400 hover:text-white underline ml-1"
            >
              Reset
            </button>
          </div>

          {/* Interactive Surveillance Camera Display Frame */}
          <div 
            ref={videoContainerRef}
            className="relative w-full overflow-hidden rounded-2xl border-2 border-cyan-500/30 bg-navy-950 shadow-2xl flex items-center justify-center min-h-[360px] sm:min-h-[420px]"
          >
            
            {/* The Calibrated Parking Feed Image */}
            <div 
              className="relative w-full transition-transform duration-200 origin-center select-none"
              style={{ transform: `scale(${zoomScale / 100})` }}
            >
              <img
                src="/parking-feed.png"
                alt="Parking Lot Optical Feed"
                className="w-full h-auto block rounded-xl shadow-inner pointer-events-none"
              />

              {/* OVERLAID OPENCV BOUNDING BOXES FOR EVERY PARKING BAY */}
              {bays.map((bay) => {
                const isSelected = highlightedBay === bay.id;
                return (
                  <div
                    key={bay.id}
                    onClick={() => handleToggleSlot(bay.id)}
                    onMouseEnter={() => setHighlightedBay(bay.id)}
                    onMouseLeave={() => setHighlightedBay(null)}
                    style={{
                      left: `${bay.left}%`,
                      top: `${bay.top}%`,
                      width: `${bay.width}%`,
                      height: `${bay.height}%`,
                    }}
                    className={`absolute cursor-pointer transition-all duration-150 z-20 group ${
                      bay.isOccupied
                        ? 'border-2 border-rose-500 bg-rose-500/10 hover:bg-rose-500/25'
                        : 'border-2 border-emerald-400 bg-emerald-400/20 hover:bg-emerald-400/35 shadow-lg shadow-emerald-500/20'
                    } ${isSelected ? 'ring-2 ring-white scale-105 z-30' : ''}`}
                    title={`${bay.id}: ${bay.isOccupied ? 'OCCUPIED' : 'VACANT'} (Click to toggle)`}
                  >
                    
                    {/* OpenCV Style Corner Crosshairs */}
                    <span className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white pointer-events-none"></span>
                    <span className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white pointer-events-none"></span>
                    <span className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white pointer-events-none"></span>
                    <span className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white pointer-events-none"></span>

                    {/* Tag badge with Bay ID and Confidence Score */}
                    <div className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9px] font-mono font-bold whitespace-nowrap shadow-md pointer-events-none ${
                      bay.isOccupied
                        ? 'bg-rose-600 text-white'
                        : 'bg-emerald-600 text-white animate-pulse'
                    }`}>
                      {bay.id.replace('Slot ', '')} [{bay.isOccupied ? 'OCC' : 'FREE'} {Math.round(bay.confidence)}%]
                    </div>

                    {/* Quick interactive click prompt on hover */}
                    <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center bg-black/40 text-[9px] font-mono text-white transition-opacity font-bold rounded">
                      Toggle
                    </div>

                  </div>
                );
              })}

              {/* Interactive Camera HUD Overlay */}
              <div className="absolute top-2 left-2 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-white flex items-center gap-2 pointer-events-none">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                <span className="text-rose-400 font-bold">REC ● [CAM-01]</span>
                <span className="text-slate-300">NORTH OVERHEAD 1080P</span>
              </div>

              <div className="absolute top-2 right-2 z-10 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-mono text-white flex items-center gap-2 pointer-events-none">
                <span className="text-cyan-400">{currentTime}</span>
                <span className="text-slate-400">|</span>
                <span className="text-emerald-400 font-bold">{fps} FPS</span>
              </div>

              <div className="absolute bottom-2 left-2 z-10 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-slate-300 pointer-events-none border border-white/10">
                Model: <span className="text-cyan-300">YOLOv8-ParkingNet</span> · IoU: 0.65 · Conf: &gt;85%
              </div>

              <div className="absolute bottom-2 right-2 z-10 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-mono text-emerald-300 pointer-events-none border border-white/10">
                Bays Tracked: {occupiedCount}/{totalSlots} Occupied
              </div>

            </div>

          </div>

          {/* Quick instructions sub-bar */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 px-1 pt-1">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400 inline-block"></span>
              <span>Green Box: Vacant Bay</span>
              <span className="w-2.5 h-2.5 rounded bg-rose-500 inline-block ml-3"></span>
              <span>Red Box: Occupied</span>
            </span>
            <span className="text-[11px] font-mono text-cyan-400">
              💡 Tip: Click any bay on the feed to simulate arrival or departure
            </span>
          </div>

        </div>

        {/* RIGHT COLUMN: Bay Detection Matrix & Historical Analytics Table (5 Cols) */}
        <div className="lg:col-span-5 bg-glass-card border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
          
          {/* Header & Open Analytics Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                <BarChart3 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white tracking-tight">Bay Detection Matrix</h2>
                <p className="text-[11px] text-slate-400 font-mono">Real-time Telemetry & Coordinates</p>
              </div>
            </div>

            <button
              onClick={() => setIsAnalyticsModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all self-start sm:self-auto"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Open Historical Analytics</span>
            </button>

          </div>

          {/* Filter Dropdown */}
          <div className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-400 font-mono">Filter by Bay:</span>
            <select
              value={selectedBayId}
              onChange={(e) => setSelectedBayId(e.target.value)}
              className="bg-navy-950/80 border border-white/15 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            >
              <option value="all">Inspect All Bays ({totalSlots} Monitored)</option>
              {bays.map(b => (
                <option key={b.id} value={b.id}>{b.id} — {b.isOccupied ? 'OCCUPIED' : 'VACANT'}</option>
              ))}
            </select>
          </div>

          {/* The Detection Telemetry Data Table (Matching exact columns from screenshot) */}
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-navy-950/60 max-h-[460px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-white/5 border-b border-white/10 text-slate-400 font-mono uppercase text-[10px] sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="py-2.5 px-3">Bay ID</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Pixels / Conf</th>
                  <th className="py-2.5 px-3">Top-Left X</th>
                  <th className="py-2.5 px-3">Top-Left Y</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {filteredBays.map((bay) => {
                  const isHovered = highlightedBay === bay.id;
                  return (
                    <tr
                      key={bay.id}
                      onMouseEnter={() => setHighlightedBay(bay.id)}
                      onMouseLeave={() => setHighlightedBay(null)}
                      className={`hover:bg-cyan-500/10 transition-colors cursor-pointer ${
                        isHovered ? 'bg-cyan-500/15' : ''
                      }`}
                    >
                      <td className="py-2 px-3 font-bold text-white flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${bay.isOccupied ? 'bg-rose-400' : 'bg-emerald-400'}`}></span>
                        <span>{bay.id}</span>
                      </td>

                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bay.isOccupied 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        }`}>
                          {bay.isOccupied ? 'OCCUPIED' : 'VACANT'}
                        </span>
                      </td>

                      <td className="py-2 px-3 text-slate-300">
                        <span>{bay.pixels.toLocaleString()} px</span>
                        <span className="text-[10px] text-slate-500 block">({bay.confidence}%)</span>
                      </td>

                      <td className="py-2 px-3 text-slate-400 font-mono">
                        {bay.x}
                      </td>

                      <td className="py-2 px-3 text-slate-400 font-mono">
                        {bay.y}
                      </td>

                      <td className="py-2 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleSlot(bay.id);
                          }}
                          className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-cyan-300 hover:text-white border border-white/10 text-[10px] font-bold transition-all"
                        >
                          {bay.isOccupied ? 'Vacate' : 'Park'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Quick summary stats at bottom of table */}
          <div className="p-3 bg-navy-950/80 border border-white/10 rounded-2xl flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Active Bounding Boxes:</span>
            <span className="text-white font-bold">{totalSlots} monitored</span>
            <span className="text-slate-400">Total Pixels Sampled:</span>
            <span className="text-cyan-400 font-bold">
              {bays.reduce((acc, b) => acc + b.pixels, 0).toLocaleString()} px
            </span>
          </div>

        </div>

      </div>

      {/* 4. OPTICAL ANPR BOOM BARRIER SIMULATOR (Accessible via subview toggle) */}
      {activeSubView === 'anpr' && (
        <div className="bg-glass-card border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Optical ANPR Camera & Barrier Actuator</h2>
                <p className="text-xs text-slate-400">Simulate incoming license plate OCR scan at entry boom barrier</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
              GATE-01 NORTH
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            
            {/* Barrier Gate Visualizer */}
            <div className="bg-navy-950/80 border border-white/10 rounded-2xl p-6 flex flex-col items-center justify-center min-h-[220px] relative overflow-hidden">
              <div className="text-xs font-mono text-slate-400 mb-2">BOOM BARRIER ARM ACTUATOR</div>
              
              <div className="relative w-64 h-32 flex items-center justify-center">
                {/* Gate Stanchion */}
                <div className="w-8 h-24 bg-gradient-to-b from-slate-600 to-slate-800 rounded-t-lg absolute left-4 bottom-2 shadow-lg border border-white/10"></div>
                
                {/* Pivoting Barrier Arm */}
                <div 
                  className={`h-4 bg-gradient-to-r from-yellow-400 via-black to-yellow-400 rounded-full absolute left-8 bottom-16 shadow-xl transition-all duration-700 origin-left border border-black ${
                    barrierStatus === 'OPEN' 
                      ? '-rotate-60 w-44' 
                      : 'rotate-0 w-48'
                  }`}
                ></div>

                {/* State Tag */}
                <div className={`px-4 py-1.5 rounded-full font-mono font-bold text-xs shadow-xl absolute top-2 right-2 border ${
                  barrierStatus === 'OPEN'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                }`}>
                  BARRIER: {barrierStatus}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 font-mono text-center">
                {barrierStatus === 'OPEN' 
                  ? '✓ Actuator Solenoid Activated. Arm Raised (Auto-clearing in 7s).' 
                  : '🔒 Optical beam secured. Gate closed waiting for valid reservation.'}
              </p>
            </div>

            {/* License Plate Trigger Form */}
            <form onSubmit={handleScanPlate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Simulate License Plate at Camera:</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={anprPlate}
                    onChange={(e) => setAnprPlate(e.target.value.toUpperCase())}
                    placeholder="KA01MJ4321"
                    className="w-full bg-navy-950/90 border border-white/15 rounded-xl px-4 py-3 text-base text-amber-300 font-mono font-black tracking-widest uppercase focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="absolute right-3 top-3 px-2 py-0.5 rounded text-[10px] font-mono bg-white/10 text-slate-300 border border-white/10">
                    IND
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isScanningPlate}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-navy-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isScanningPlate ? (
                    <>
                      <div className="w-4 h-4 border-2 border-navy-950 border-t-transparent rounded-full animate-spin"></div>
                      <span>Running OCR Algorithm...</span>
                    </>
                  ) : (
                    <>
                      <Camera className="w-4 h-4" />
                      <span>Trigger OCR Camera Scan</span>
                    </>
                  )}
                </button>
              </div>

              {anprResult && (
                <div className={`p-3.5 rounded-xl border text-xs font-mono animate-fadeIn ${
                  anprResult.access_granted
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                    : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
                }`}>
                  <div className="flex items-center gap-2 font-bold mb-1">
                    {anprResult.access_granted ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                    <span>{anprResult.access_granted ? 'ACCESS GRANTED' : 'ACCESS DENIED'}</span>
                  </div>
                  <p>{anprResult.message}</p>
                </div>
              )}
            </form>

          </div>
        </div>
      )}

      {/* 5. HISTORICAL ANALYTICS MODAL */}
      {isAnalyticsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-navy-950 border border-white/15 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Historical Bay Analytics</h3>
                  <p className="text-xs text-slate-400 font-mono">OpenCV Telemetry & Turnover Metrics</p>
                </div>
              </div>
              <button
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Analytics Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-mono">Avg Turn Time</div>
                <div className="text-lg font-bold text-white font-mono mt-1">1h 48m</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-mono">Peak Period</div>
                <div className="text-lg font-bold text-amber-300 font-mono mt-1">11am - 2pm</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-mono">Total Turnovers</div>
                <div className="text-lg font-bold text-emerald-400 font-mono mt-1">84 today</div>
              </div>
              <div className="p-3 bg-white/5 border border-white/10 rounded-2xl">
                <div className="text-[11px] text-slate-400 font-mono">Detection Acc</div>
                <div className="text-lg font-bold text-cyan-400 font-mono mt-1">99.2%</div>
              </div>
            </div>

            {/* Hourly Occupancy Trend Bars */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300 font-mono flex items-center justify-between">
                <span>Today's Hourly Occupancy Rate</span>
                <span className="text-emerald-400 font-bold">Peak: 92%</span>
              </div>
              <div className="grid grid-cols-8 gap-2 items-end h-28 bg-white/5 p-3 rounded-2xl border border-white/10">
                {[45, 60, 85, 92, 88, 70, 55, 40].map((val, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1 h-full justify-end">
                    <span className="text-[9px] font-mono text-cyan-300">{val}%</span>
                    <div 
                      className="w-full bg-gradient-to-t from-cyan-500 to-blue-400 rounded-t transition-all"
                      style={{ height: `${val}%` }}
                    ></div>
                    <span className="text-[8px] font-mono text-slate-400">{idx * 2 + 8}:00</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  alert('Telemetry log exported as CSV: parkbay-telemetry-log.csv');
                  setIsAnalyticsModalOpen(false);
                }}
                className="px-4 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Telemetry (CSV)</span>
              </button>
              <button
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 6. IMPORT VIDEO / RTSP MODAL */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-navy-950 border border-white/15 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5">
            
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <Upload className="w-5 h-5 text-cyan-400" />
                <h3 className="text-base font-bold text-white">Select Camera / Video Source</h3>
              </div>
              <button 
                onClick={() => setIsImportModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <button
                onClick={() => {
                  setStreamSource('Camera 01 (North Parking Lot)');
                  setIsImportModalOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 text-left flex items-center justify-between transition-all"
              >
                <div>
                  <div className="font-bold text-white">Camera 01 (North Surface Lot)</div>
                  <div className="text-[10px] text-slate-400 font-mono">1080p @ 30 FPS · IP: 192.168.1.104</div>
                </div>
                <span className="text-cyan-400 font-bold font-mono">ACTIVE</span>
              </button>

              <button
                onClick={() => {
                  setStreamSource('Camera 02 (South EV Bay)');
                  setIsImportModalOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left flex items-center justify-between transition-all"
              >
                <div>
                  <div className="font-bold text-white">Camera 02 (South EV Terminal)</div>
                  <div className="text-[10px] text-slate-400 font-mono">1080p @ 30 FPS · IP: 192.168.1.108</div>
                </div>
                <span className="text-slate-400 font-mono">READY</span>
              </button>

              <button
                onClick={() => {
                  setStreamSource('Custom Video File (sample_parking.mp4)');
                  setIsImportModalOpen(false);
                }}
                className="w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left flex items-center justify-between transition-all"
              >
                <div>
                  <div className="font-bold text-white">Local Simulation Video Feed</div>
                  <div className="text-[10px] text-slate-400 font-mono">MP4 High Bitrate 60s Loop</div>
                </div>
                <span className="text-slate-400 font-mono">LOOP</span>
              </button>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

      {/* 7. BOTTOM SYSTEM FOOTER (Matching screenshot style in 100% English) */}
      <footer className="text-center py-4 border-t border-white/5 text-[11px] text-slate-500 font-mono">
        Powered by OpenCV · PyTorch YOLO Vision · Flask REST · Real-time Telemetry | Author: ParkBay Team
      </footer>

    </div>
  );
}
