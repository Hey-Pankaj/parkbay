# ParkBay: Smart Parking Management and Reservation System

**ParkBay** is an enterprise-grade smart parking management and reservation platform designed to streamline urban parking discovery, time-based slot reservations, automated charge calculations, and administrative oversight.

The platform features an authentic architectural live bay floor plan, ultrasonic sensor telemetry simulation, optical Automatic Number Plate Recognition (ANPR) camera barrier automation, and dedicated role-separated interfaces for drivers and facility administrators.

---

## 🌟 Key Features

1. **Branded Public Landing Page**:
   - Modern, high-conversion landing page presenting ParkBay's value proposition, authentic parking facility background, feature pillars, 3-step workflow, and facility previews.
2. **Dedicated Authentication Portal**:
   - Clean, role-separated login and registration for Drivers and Facility Administrators.
3. **Personalized Dashboards**:
   - **Driver Dashboard**:
     - Multi-facility selector (Commercial Galleria, Tech Park, Airport Express).
     - Interactive architectural parking grid (Block A & Block B) with live status badges (Available, Occupied with license plate, Selected, Maintenance, EV Level-2 Fast Charger).
     - Time-window slot availability calculation (prevents double-booking across overlapping reservations).
     - Automated charge calculation (base hourly rate, duration multiplier, 18% GST, payment method selection).
     - Digital reservation pass with reference code (e.g. `PB-98A1F3`).
     - "My Bookings" manager with instant cancellation & refund processing.
   - **Admin Dashboard**:
     - Real-time KPI analytics (Total bays, occupancy percentage, today's revenue, active vehicles count).
     - New Bay Provisioning tool (configure facility, block, slot code, type, hourly rate, EV charger).
     - Slot status toggles (Available ⇄ Maintenance ⇄ Blocked).
     - Master bookings audit table with search and manual release controls.
4. **Hardware-Assisted Foundation (IoT & ANPR Camera Vision - Admin Exclusive)**:
   - **Optical ANPR Camera Barrier Gate Simulator**:
     - Animated boom barrier arm with optical OCR targeting.
     - Simulates scanning license plates (e.g. `KA01MJ4321`), validates active reservations, timestamps entry, and lifts the barrier.
     - Rejects unauthorized plates with access denied notifications.
   - **Ultrasonic Distance Sensor Mesh**:
     - Live distance telemetry (HC-SR04/JSN-SR04T simulation).
     - Interactive trigger to toggle vehicle parking and departure with immediate database synchronization.
5. **FIFO Priority Waitlist Queue**:
   - When a facility reaches maximum capacity, drivers can join the priority waiting list, automatically claiming vacated slots as vehicles exit.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide Icons |
| **Backend** | Python 3.12, Flask, Flask-CORS, Werkzeug Security |
| **Database ORM** | SQLAlchemy 2.0, PyMySQL |
| **Database** | MySQL 8.x / MariaDB (with seamless local SQLite fallback `parkbay.db`) |
| **Architecture** | RESTful APIs, Single-Page Application (SPA) |

---

## 📁 Repository Structure (Flat Root)

```text
parkbay/
├── app.py                 # Flask REST backend server & static router
├── database.py            # SQLAlchemy engine (MySQL + SQLite fallback)
├── models.py              # User, Facility, Slot, Booking, Sensor models
├── schema_mysql.sql       # Pure MySQL relational schema DDL
├── seed_data.py           # Auto-seeder for facilities, bays, and users
├── requirements.txt       # Python backend dependencies
├── package.json           # Node / React dependencies and build scripts
├── vite.config.js         # Vite configuration with API proxy to Flask
├── tailwind.config.js     # Tailwind CSS styles and palette configuration
├── index.html             # Application entrypoint
├── src/                   # React components, pages, contexts, services
├── public/                # Static assets, branding icons, parking background
└── README.md              # Project documentation
```

---

## 🚀 Quick Start Guide

### 1. Install Backend Dependencies & Launch Flask

```bash
# Install Python packages
pip install -r requirements.txt

# Run the Flask backend
python app.py
```
*The backend server will start on `http://127.0.0.1:5000`.*
*(If MySQL is not running locally, ParkBay automatically initializes the zero-config SQLite database and seeds default facilities, slots, accounts, and bookings).*

### 2. Install Frontend Dependencies & Launch Vite

In a new terminal window:

```bash
# Install Node dependencies
npm install

# Start Vite dev server
npm run dev
```
*Open your browser and navigate to: **`http://127.0.0.1:5173/`***

---

## 👥 Default Accounts

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Driver / Owner** | `driver@parkbay.com` | `password123` | Live Bays, Time-based Booking, My Passes |
| **Facility Admin** | `admin@parkbay.com` | `admin123` | Admin Center, IoT Vision, Slot Provisioning |

---

## 📡 REST API Summary

- `POST /api/auth/login`: Authenticate driver or administrator
- `POST /api/auth/register`: Create user account
- `GET /api/facilities`: List active facilities with live availability counts
- `GET /api/facilities/<id>/slots?start_time=...&end_time=...`: Get slots for time window
- `POST /api/bookings`: Reserve a parking slot
- `POST /api/bookings/<id>/cancel`: Cancel booking and refund
- `GET /api/admin/stats`: Real-time administrative metrics
- `POST /api/anpr/scan`: Simulate ANPR camera plate scan and boom barrier lift
