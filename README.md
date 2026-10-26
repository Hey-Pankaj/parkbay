# ParkBay: Smart Parking Management and Reservation System

**ParkBay** is an enterprise-grade smart parking management and reservation platform designed to streamline urban parking discovery, time-based slot reservations, automated charge calculations, and administrative oversight. 

The platform features an architectural live bay floor plan, ultrasonic sensor telemetry simulation, and optical Automatic Number Plate Recognition (ANPR) camera barrier automation.

---

## 🌟 Key Features

1. **Branded Public Landing Page**:
   - Modern, high-conversion landing page presenting ParkBay's value proposition, interactive performance metrics, feature pillars, 3-step workflow, and facility previews.
2. **Dedicated Authentication Portal**:
   - Role-based login and registration (Driver / Vehicle Owner vs Facility Administrator).
   - Instant One-Click Demo Logins (`Driver Demo` & `Admin Demo`) for immediate zero-typing testing.
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
4. **Hardware-Assisted Foundation (IoT & ANPR Camera Vision)**:
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

## 🚀 Quick Start Guide

### 1. Backend Server Setup
The backend dependencies (`flask`, `flask-cors`, `sqlalchemy`, `pymysql`, `werkzeug`) are pre-installed.

```bash
cd backend

# (Optional) Configure MySQL in .env or run directly:
python app.py
```
*The server will start on `http://127.0.0.1:5000`.*
*(If MySQL is not running on port 3306, ParkBay automatically initializes the local SQLite database `parkbay.db` and seeds initial facilities, slots, accounts, and bookings).*

### 2. Frontend Development Server Setup
```bash
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite dev server with proxy to Flask
npm run dev
```
*Open your browser and navigate to: **`http://127.0.0.1:5173/`***

---

## 🔑 Demo Credentials

| Role | Email | Password | Quick Access |
|---|---|---|---|
| **Driver / Vehicle Owner** | `driver@parkbay.com` | `password123` | Click **"Driver Demo"** button on Login Page |
| **Facility Administrator** | `admin@parkbay.com` | `admin123` | Click **"Admin Demo"** button on Login Page |

---

## 🗄️ MySQL Database Setup (Optional for Production)

If you wish to use a local MySQL or cloud MariaDB instance:
1. Open your MySQL client (MySQL Workbench, phpMyAdmin, or terminal CLI).
2. Execute the provided DDL script:
   ```bash
   mysql -u root -p < backend/schema_mysql.sql
   ```
3. Set your MySQL credentials in `backend/.env` or set the environment variable:
   ```bash
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DB=smart_parking_db
   ```
4. Restart the backend: `python app.py`.

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | User/Admin authentication |
| `POST` | `/api/auth/register` | Register new user account |
| `GET` | `/api/facilities` | List all parking facilities with live availability counts |
| `GET` | `/api/facilities/<id>/slots` | Real-time slots for facility within query time window |
| `POST` | `/api/bookings/calculate` | Compute dynamic fee, base rate, duration, and GST |
| `POST` | `/api/bookings` | Atomically reserve a parking bay and process payment |
| `GET` | `/api/bookings` | Get user's bookings (or all bookings for admin) |
| `POST` | `/api/bookings/<id>/cancel` | Cancel reservation & issue instant refund |
| `POST` | `/api/bookings/<id>/release` | Complete booking, vacate bay, and notify waitlist |
| `POST` | `/api/waitlist` | Join FIFO waiting queue when lot is full |
| `GET` | `/api/admin/stats` | KPI metrics (occupancy %, total slots, today's revenue) |
| `POST` | `/api/admin/slots` | Provision a new parking bay |
| `PUT` | `/api/admin/slots/<id>/status` | Update slot status (available/maintenance/blocked) |
| `POST` | `/api/camera/anpr/scan` | Simulate ANPR camera OCR license plate recognition & gate lift |
| `GET` | `/api/iot/sensors` | Stream live ultrasonic distance telemetry |
| `POST` | `/api/iot/sensors/<code>/simulate` | Toggle hardware sensor detection |
