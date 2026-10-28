-- =====================================================================
-- ParkBay: Smart Parking Management and Reservation System
-- Database Schema for MySQL 8.x / MariaDB
-- Character set: utf8mb4 | Collation: utf8mb4_unicode_ci
-- =====================================================================

CREATE DATABASE IF NOT EXISTS smart_parking_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE smart_parking_db;

-- 1. USERS TABLE
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('driver', 'admin') NOT NULL DEFAULT 'driver',
    phone VARCHAR(20),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. PARKING FACILITIES TABLE
CREATE TABLE IF NOT EXISTS parking_facilities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    city VARCHAR(100) NOT NULL DEFAULT 'Bengaluru',
    address VARCHAR(255) NOT NULL,
    total_slots INT NOT NULL DEFAULT 24,
    base_rate_per_hour DECIMAL(8, 2) NOT NULL DEFAULT 40.00,
    image_url VARCHAR(500),
    description TEXT,
    contact_phone VARCHAR(30) DEFAULT '+91 80 4123 5678',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_facility_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. PARKING SLOTS TABLE
CREATE TABLE IF NOT EXISTS parking_slots (
    id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT NOT NULL,
    slot_code VARCHAR(20) NOT NULL,
    block VARCHAR(10) NOT NULL DEFAULT 'A',
    slot_type ENUM('standard', 'ev_charging', 'compact', 'accessible', 'suv') NOT NULL DEFAULT 'standard',
    hourly_rate DECIMAL(8, 2) NOT NULL DEFAULT 40.00,
    status ENUM('available', 'maintenance', 'blocked') NOT NULL DEFAULT 'available',
    has_ev_charger BOOLEAN NOT NULL DEFAULT FALSE,
    has_iot_sensor BOOLEAN NOT NULL DEFAULT TRUE,
    FOREIGN KEY (facility_id) REFERENCES parking_facilities(id) ON DELETE CASCADE,
    UNIQUE KEY uq_facility_slot (facility_id, slot_code),
    INDEX idx_slot_status (status),
    INDEX idx_slot_type (slot_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_ref VARCHAR(30) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    facility_id INT NOT NULL,
    slot_id INT NOT NULL,
    vehicle_number VARCHAR(20) NOT NULL,
    vehicle_type ENUM('sedan', 'suv', 'hatchback', 'ev', 'two_wheeler') NOT NULL DEFAULT 'sedan',
    driver_name VARCHAR(100) NOT NULL,
    driver_phone VARCHAR(20),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    total_hours DECIMAL(5, 2) NOT NULL,
    hourly_rate DECIMAL(8, 2) NOT NULL,
    estimated_amount DECIMAL(10, 2) NOT NULL,
    paid_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    booking_status ENUM('confirmed', 'active', 'completed', 'cancelled') NOT NULL DEFAULT 'confirmed',
    payment_status ENUM('unpaid', 'paid', 'refunded') NOT NULL DEFAULT 'unpaid',
    anpr_entry_time DATETIME NULL,
    anpr_exit_time DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (facility_id) REFERENCES parking_facilities(id) ON DELETE CASCADE,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE,
    INDEX idx_booking_time_slot (slot_id, start_time, end_time),
    INDEX idx_booking_status (booking_status),
    INDEX idx_booking_vehicle (vehicle_number)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. PAYMENTS TABLE
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    booking_id INT NOT NULL,
    transaction_id VARCHAR(64) NOT NULL UNIQUE,
    amount DECIMAL(10, 2) NOT NULL,
    payment_method ENUM('upi', 'card', 'wallet', 'cash') NOT NULL DEFAULT 'upi',
    payment_status ENUM('paid', 'refunded', 'failed') NOT NULL DEFAULT 'paid',
    payment_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE CASCADE,
    INDEX idx_payment_tx (transaction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 6. IOT SENSOR TELEMETRY TABLE (Hardware / Camera Integration Foundation)
CREATE TABLE IF NOT EXISTS sensor_telemetry (
    id INT AUTO_INCREMENT PRIMARY KEY,
    slot_id INT NOT NULL UNIQUE,
    sensor_code VARCHAR(40) NOT NULL UNIQUE,
    distance_cm DECIMAL(6, 2) NOT NULL DEFAULT 240.00,
    is_occupied BOOLEAN NOT NULL DEFAULT FALSE,
    battery_pct INT NOT NULL DEFAULT 95,
    signal_strength_dbm INT NOT NULL DEFAULT -65,
    last_heartbeat DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (slot_id) REFERENCES parking_slots(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================================
-- INITIAL SEED DATA
-- =====================================================================

-- Default Users (Passwords hashed via Werkzeug pbkdf2)
-- Default driver password: 'password123'
-- Default admin password:  'admin123'
INSERT INTO users (id, full_name, email, password_hash, role, phone)
VALUES 
(1, 'Aarav Sharma', 'driver@parkbay.com', 'scrypt:32768:8:1$7U60pLh9c5K1J4Fm$8c39e2365287ba304b4cf5da3e30f40d7c7689a7da1cfbf442d7653697e88229', 'driver', '+91 98765 43210'),
(2, 'ParkBay Admin', 'admin@parkbay.com', 'scrypt:32768:8:1$y5k4Zq1p6L8m3B0v$f81665a4439cba91f76d9cfd1b117565eb631baad7a35fe6f6a73602fc5f0be1', 'admin', '+91 80 4123 5678')
ON DUPLICATE KEY UPDATE id=id;

-- Facilities
INSERT INTO parking_facilities (id, name, city, address, total_slots, base_rate_per_hour, image_url, description, contact_phone)
VALUES
(1, 'ParkBay Central Galleria', 'Bengaluru', 'Plot 42, Brigade Road, Ashok Nagar', 24, 40.00, 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80', 'Premium multi-level underground parking with direct shopping mall access, Level-2 EV fast chargers, and smart IoT bay sensors.', '+91 80 2558 1122'),
(2, 'ParkBay Tech Park Hub', 'Bengaluru', 'Block 3, Outer Ring Road, Bellandur', 24, 30.00, 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80', 'Dedicated corporate and visitor parking equipped with automated boom barriers, high-speed ANPR camera recognition, and EV charging.', '+91 80 4667 9900'),
(3, 'ParkBay Airport Express Terminal', 'Bengaluru', 'Terminal 1 Arrivals, Devanahalli', 18, 60.00, 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80', '24/7 guarded airport parking with complimentary luggage trolley bays, valet service, and real-time flight connection display.', '+91 80 6678 2211')
ON DUPLICATE KEY UPDATE id=id;
