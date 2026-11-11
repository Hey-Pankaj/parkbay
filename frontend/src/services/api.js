// API service client for ParkBay REST backend
// In local dev or reverse proxy, defaults to '/api'. For split hosting (e.g. Vercel + Render), uses VITE_API_URL.
const rawApiUrl = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';
const API_BASE = rawApiUrl ? `${rawApiUrl.replace(/\/$/, '')}/api` : '/api';

// Initial fallback data for 100% resilient deployment
const FALLBACK_FACILITIES = [
  {
    id: 1,
    name: "ParkBay Central Galleria",
    city: "Bengaluru",
    address: "Plot 42, Brigade Road, Ashok Nagar",
    total_slots: 24,
    available_slots: 19,
    base_rate_per_hour: 40.0,
    image_url: "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
    description: "Multi-level underground parking with direct shopping mall access, Level-2 EV fast chargers, and smart IoT bay sensors.",
    contact_phone: "+91 80 2558 1122"
  },
  {
    id: 2,
    name: "ParkBay Tech Park Hub",
    city: "Bengaluru",
    address: "Block 3, Outer Ring Road, Bellandur",
    total_slots: 20,
    available_slots: 15,
    base_rate_per_hour: 35.0,
    image_url: "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
    description: "Corporate and visitor parking equipped with automated boom barriers, high-speed ANPR camera recognition, and EV charging.",
    contact_phone: "+91 80 4667 9900"
  },
  {
    id: 3,
    name: "ParkBay Airport Express Terminal",
    city: "Bengaluru",
    address: "Terminal 1 Arrivals, Devanahalli",
    total_slots: 16,
    available_slots: 12,
    base_rate_per_hour: 60.0,
    image_url: "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
    description: "24/7 guarded airport parking with complimentary luggage trolley bays, valet service, and real-time flight connection display.",
    contact_phone: "+91 80 6678 2211"
  }
];

function generateFallbackSlots(facId) {
  const fac = FALLBACK_FACILITIES.find(f => f.id === Number(facId)) || FALLBACK_FACILITIES[0];
  const count = fac.total_slots;
  const types = ['standard', 'standard', 'ev_charging', 'standard', 'suv', 'compact', 'accessible', 'standard'];
  const slots = [];
  
  for (let i = 0; i < count; i++) {
    const block = i < (count / 2) ? 'A' : 'B';
    const num = (i % Math.floor(count / 2)) + 1;
    const slotCode = `${block}-${String(num).padStart(2, '0')}`;
    const slotType = types[i % types.length];
    const isBusy = (i === 1 || i === 4);
    
    slots.push({
      id: Number(facId) * 100 + i + 1,
      facility_id: Number(facId),
      slot_code: slotCode,
      block,
      slot_type: slotType,
      hourly_rate: fac.base_rate_per_hour * (slotType === 'ev_charging' ? 1.5 : slotType === 'suv' ? 1.25 : 1.0),
      status: 'available',
      busy: isBusy,
      has_ev_charger: slotType === 'ev_charging',
      has_iot_sensor: true,
      active_booking: isBusy ? { vehicle_number: `KA0${i+1}MJ${1000+i*23}`, driver_name: 'Parked Vehicle' } : null,
      sensor: { distance_cm: isBusy ? 34.0 : 240.0, is_occupied: isBusy, battery_pct: 95 }
    });
  }
  return { facility: fac, slots };
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const token = localStorage.getItem('parkbay_token');
  const headers = { ...options.headers };
  if (token) headers.Authorization = `Bearer ${token}`;
  const config = { ...options, headers };
  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
    config.body = JSON.stringify(config.body);
  }
  const response = await fetch(url, config);
  const contentType = response.headers.get('content-type') || '';
  let data = null;
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const rawText = await response.text().catch(() => '');
    try { data = JSON.parse(rawText); } catch { data = null; }
  }
  if (!response.ok) {
    const error = new Error((data && data.error) || `Server returned status ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

export const api = {
  // Authentication
  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),

  getCurrentUser: () => request('/auth/me'),
  
  register: (userData) => 
    request('/auth/register', { method: 'POST', body: userData }),

  // Facilities & Real-time Slots
  getFacilities: () => 
    request('/facilities'),

  getFacilityDetail: (id) => 
    request(`/facilities/${id}`),

  getFacilitySlots: (id, startTime, endTime) => {
    const params = new URLSearchParams();
    if (startTime) params.append('start_time', startTime);
    if (endTime) params.append('end_time', endTime);
    return request(`/facilities/${id}/slots?${params.toString()}`);
  },

  // Pricing & Booking
  calculateCharges: (calcData) => 
    request('/bookings/calculate', { method: 'POST', body: calcData }),

  createBooking: (bookingData) => 
    request('/bookings', { method: 'POST', body: bookingData }),

  getBookings: (params = {}) => {
    const q = new URLSearchParams(params).toString();
    return request(`/bookings${q ? `?${q}` : ''}`);
  },

  cancelBooking: (bookingId) => 
    request(`/bookings/${bookingId}/cancel`, { method: 'POST' }),

  releaseBooking: (bookingId) => 
    request(`/bookings/${bookingId}/release`, { method: 'POST' }),

  // Waitlist (FIFO)
  getWaitlist: (facilityId) => 
    request(`/waitlist${facilityId ? `?facility_id=${facilityId}` : ''}`),

  joinWaitlist: (data) => 
    request('/waitlist', { method: 'POST', body: data }),

  // Admin Dashboard & Allotments
  getAdminStats: () => 
    request('/admin/stats'),

  addSlot: (slotData) => 
    request('/admin/slots', { method: 'POST', body: slotData }),

  updateSlotStatus: (slotId, status) => 
    request(`/admin/slots/${slotId}/status`, { method: 'PUT', body: { status } }),

  // Admin Users Configuration
  getUsers: () => 
    request('/admin/users'),

  updateUserRole: (userId, role) => 
    request(`/admin/users/${userId}/role`, { method: 'PUT', body: { role } }),

  createUser: (userData) => 
    request('/admin/users', { method: 'POST', body: userData }),

  deleteUser: (userId) => 
    request(`/admin/users/${userId}`, { method: 'DELETE' }),

  // Hardware / IoT Sensors & ANPR Camera Simulation
  getSensors: () => 
    request('/iot/sensors'),

  simulateSensor: (sensorCode, action = 'toggle') => 
    request(`/iot/sensors/${sensorCode}/simulate`, { method: 'POST', body: { action } }),

  simulateAnprScan: (vehicleNumber, gateId = 'GATE-01') => 
    request('/camera/anpr/scan', { method: 'POST', body: { vehicle_number: vehicleNumber, gate_id: gateId } }),

  // User Profile & Personal Information
  getProfile: () => 
    request('/users/profile'),

  updateProfile: (profileData) => 
    request('/users/profile', { method: 'PUT', body: profileData }),
};
