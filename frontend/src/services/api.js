// API service client for ParkBay REST backend
const API_BASE = '/api';

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }
    return data;
  } catch (error) {
    console.error(`API Error on [${endpoint}]:`, error);
    throw error;
  }
}

export const api = {
  // Authentication
  login: (email, password) => 
    request('/auth/login', { method: 'POST', body: { email, password } }),
  
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

  // Admin Dashboard
  getAdminStats: () => 
    request('/admin/stats'),

  addSlot: (slotData) => 
    request('/admin/slots', { method: 'POST', body: slotData }),

  updateSlotStatus: (slotId, status) => 
    request(`/admin/slots/${slotId}/status`, { method: 'PUT', body: { status } }),

  // Hardware / IoT Sensors & ANPR Camera Simulation
  getSensors: () => 
    request('/iot/sensors'),

  simulateSensor: (sensorCode, action = 'toggle') => 
    request(`/iot/sensors/${sensorCode}/simulate`, { method: 'POST', body: { action } }),

  simulateAnprScan: (vehicleNumber, gateId = 'GATE-01') => 
    request('/camera/anpr/scan', { method: 'POST', body: { vehicle_number: vehicleNumber, gate_id: gateId } }),
};
