# ParkBay: Smart Parking Management and Reservation System

[![React](https://img.shields.io/badge/Frontend-React%2018%20%7C%20Vite%205-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Backend-Python%203.12%20%7C%20Flask-000000?logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Styling-Tailwind%20CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Database](https://img.shields.io/badge/Database-MySQL%20%2F%20SQLite-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

**ParkBay** is an enterprise-grade smart parking management and reservation platform designed to streamline urban parking discovery, time-based slot reservations, automated charge calculations, ultrasonic IoT bay telemetry, ANPR boom barrier automation, and dedicated role-separated interfaces for drivers and facility administrators.

---

## 🌟 Key Features

### 1. Branded Public Landing Page
- Modern high-conversion landing page presenting ParkBay's architectural highlights, live facility counters, parking tiers, and 3-step reserve-and-park workflow.

### 2. Personalized Driver Dashboard
- **Multi-Facility Discovery**: Switch between city-center gallerias, corporate tech hubs, and international airport express terminals.
- **Interactive Architectural Floor Grid**: Visual block-based layout (Block A & Block B) with live status tags (*Available*, *Occupied with License Plate*, *Selected*, *Maintenance*, *EV Level-2 Fast Charger*).
- **Time-Window Conflict Avoidance**: Real-time slot availability checking preventing overlapping bookings.
- **Automated Charge Engine**: Calculates base hourly tariffs, duration multipliers, 18% GST breakdown, and digital payment methods (UPI, Cards, FASTag).
- **Reservation Passes & Refunds**: Instant digital booking pass with QR reference (e.g. `PB-98A1F3`) and self-service one-click cancellation with immediate refund initiation.

### 3. User Profile & Personal Information Editor
- **Personal Information Management**: Live editable driver profile (Full Name, Phone Number, City, Address, and Emergency Contact).
- **Primary Vehicle & FastPass**: Save vehicle registration plate (e.g., `KA01MJ4321`), vehicle category (*Sedan, SUV, EV, Compact, Accessible*), make/model (*Tata Nexon EV, etc.*), and FASTag RFID ID.
- **Smart Bay Automation Preferences**: Configure automated ANPR barrier opening without manual QR scanning, Level-2 EV charging bay priority, and real-time SMS arrival/expiry alerts.

### 4. Admin Management Center
- **Live KPI Analytics**: Total facility bays, occupancy percentages, today's gross revenue, and active vehicle counts.
- **Area-Wise Booking Breakdown**: Occupancy metrics, active allotments, and localized financial summaries across each facility.
- **Bay Provisioning & Controls**: Provision new bays on the fly, adjust hourly rates, toggle EV charger availability, and switch slot states (*Available ⇄ Maintenance ⇄ Blocked*).
- **Master Booking Audit & Vehicle Release**: Real-time inspection of active reservations, vehicle plates, driver contacts, and emergency bay release.
- **User Role Management**: Promote drivers to administrators or adjust user credentials directly from the console.

### 5. Hardware & IoT Simulation (Admin Exclusive)
- **Optical ANPR Camera Barrier Gate Simulator**:
  - Animated boom barrier arm with optical OCR targeting.
  - Simulates scanning incoming vehicle license plates, matching against confirmed reservations, timestamping gate entry, and opening the barrier automatically.
  - Rejects unregistered vehicles with real-time access denied alerts.
- **Ultrasonic Distance Sensor Mesh**:
  - Simulates HC-SR04/JSN-SR04T ultrasonic distance sensors at each bay.
  - Interactive simulator to occupy or vacate bays with live distance telemetry and battery diagnostics.

### 6. FIFO Priority Waitlist Queue
- When high-demand parking facilities reach 100% occupancy, drivers can join a prioritized FIFO waiting list, automatically reserving vacated slots as soon as departures are logged.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide React Icons |
| **Backend** | Python 3.12, Flask, Flask-CORS, SQLAlchemy 2.0, Werkzeug |
| **Database** | MySQL 8.x / MariaDB (with zero-config local SQLite fallback `parkbay.db`) |
| **Containerization** | Docker, Docker Compose, Nginx |
| **Deployment Ready** | Vercel (Monorepo), Render Blueprint (`render.yaml`), Docker Compose |

---

## 📁 Repository Structure

```text
parkbay/
├── backend/
│   ├── app.py                 # Flask REST API backend server & routing
│   ├── database.py            # SQLAlchemy database engine (MySQL + SQLite fallback)
│   ├── models.py              # User, Facility, Slot, Booking, Payment, Sensor models
│   ├── schema_mysql.sql       # Production MySQL schema DDL & initial seed records
│   ├── seed_data.py           # Auto-seeder for facilities, bays, and localized accounts
│   ├── parkbay.db             # Zero-config SQLite database for instant local run
│   ├── requirements.txt       # Python backend dependencies
│   ├── Dockerfile             # Production Python Gunicorn container
│   ├── Procfile               # Process file for PaaS deployments (Render / Railway)
│   └── .env.example           # Backend environment configuration variables
├── frontend/
│   ├── src/
│   │   ├── components/        # Navigation, Parking Grid, Booking & Waitlist modals
│   │   ├── context/           # AuthContext with profile synchronization
│   │   ├── pages/             # Landing, Login, Driver, Admin, IoT Vision, Profile
│   │   ├── services/          # Resilient API client with offline fallback engine
│   │   ├── App.jsx            # Main application router and shell
│   │   └── main.jsx           # React DOM root entrypoint
│   ├── public/                # Static assets, SVG icons, parking background
│   ├── package.json           # Node scripts and dependencies
│   ├── vite.config.js         # Vite configuration with API proxy
│   ├── tailwind.config.js     # Tailwind CSS theme and styles
│   └── Dockerfile             # Multi-stage production Nginx container
├── docker-compose.yml         # Full-stack Docker Compose (MySQL + Flask + React)
├── render.yaml                # 1-Click Render Blueprint configuration
├── vercel.json                # Vercel Monorepo routing configuration
└── README.md                  # Comprehensive project documentation
```

---

## 🚀 Quick Start Guide

### 1. Clone & Set Up Backend

```bash
cd backend

# Create virtual environment (optional but recommended)
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install Python dependencies
pip install -r requirements.txt

# Start the Flask backend server
python app.py
```
*The Flask REST API will start on **`http://127.0.0.1:5000`**.*
*(If MySQL is not running locally, ParkBay automatically falls back to the bundled `parkbay.db` SQLite database with seeded demo data).*

---

### 2. Set Up Frontend

In a separate terminal window:

```bash
cd frontend

# Install Node dependencies
npm install

# Start Vite development server
npm run dev
```
*Open your browser and navigate to: **`http://127.0.0.1:5173/`***

---

## 👥 Default Demo Accounts

| Role | Email | Password | Pre-configured Name | Features Accessible |
|---|---|---|---|---|
| **Driver / Owner** | `driver@parkbay.com` | `password123` | **Aarav Sharma** | Live Bays, Time Booking, My Passes, Personal Info Profile |
| **Facility Admin** | `admin@parkbay.com` | `admin123` | **ParkBay Admin Officer** | Admin Dashboard, IoT Sensor Mesh, ANPR Vision Camera |

*Note: You can also register any new driver or admin account from the registration tab with any name and mobile number.*

---

## 📡 Key REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Authenticate driver or administrator |
| `POST` | `/api/auth/register` | Register new user account |
| `GET/PUT` | `/api/users/profile` | View and update personal information, vehicle, and preferences |
| `GET` | `/api/facilities` | List all parking facilities with live available bay counters |
| `GET` | `/api/facilities/<id>/slots` | Retrieve slot matrix for a specific time window |
| `POST` | `/api/bookings/calculate` | Calculate charges, GST, and duration multiplier |
| `POST` | `/api/bookings` | Confirm and create parking reservation |
| `POST` | `/api/bookings/<id>/cancel` | Cancel booking and issue instant refund |
| `GET` | `/api/admin/stats` | Retrieve facility metrics, occupancy %, and area breakdown |
| `POST` | `/api/camera/anpr/scan` | ANPR plate recognition & boom barrier automation |
| `POST` | `/api/iot/sensors/<code>/simulate` | Simulate ultrasonic sensor occupancy change |

---

## 🚢 Production Deployment Options

### Option 1: Docker Compose (Full Stack)

Run the entire stack (MySQL 8, Flask Gunicorn, React Nginx) with a single command:

```bash
docker compose up -d --build
```
- **Web App**: `http://localhost:80`
- **Backend API**: Reverse-proxied automatically through Nginx `/api/`

---

### Option 2: 1-Click Cloud Deployment (Render)

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com).
3. Click **New +** ➔ **Blueprint**, and select your repository.
4. Render will read `render.yaml` to deploy both frontend and backend automatically.

---

### Option 3: Split Hosting (Vercel Frontend + Render/Railway Backend)

1. **Frontend on Vercel**:
   - Set root directory to `frontend`.
   - Set Environment Variable: `VITE_API_URL=https://your-backend.onrender.com`.
   - Build Command: `npm run build`, Output Directory: `dist`.
2. **Backend on Render / Railway**:
   - Set root directory to `backend`.
   - Build Command: `pip install -r requirements.txt`.
   - Start Command: `gunicorn app:app --bind 0.0.0.0:$PORT`.

---

## 📄 License

This project is licensed under the MIT License.
