from datetime import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, Enum
)
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), default="driver", nullable=False) # 'driver' or 'admin'
    phone = Column(String(20), nullable=True)
    vehicle_number = Column(String(50), nullable=True, default="KA01MJ4321")
    vehicle_type = Column(String(50), nullable=True, default="sedan")
    city = Column(String(100), nullable=True, default="Bengaluru")
    address = Column(String(255), nullable=True)
    emergency_contact = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    bookings = relationship("Booking", back_populates="user", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "full_name": self.full_name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "vehicle_number": getattr(self, "vehicle_number", None) or "KA01MJ4321",
            "vehicle_type": getattr(self, "vehicle_type", None) or "sedan",
            "city": getattr(self, "city", None) or "Bengaluru",
            "address": getattr(self, "address", None) or "",
            "emergency_contact": getattr(self, "emergency_contact", None) or "",
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ParkingFacility(Base):
    __tablename__ = "parking_facilities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    city = Column(String(100), nullable=False, default="Bengaluru")
    address = Column(String(255), nullable=False)
    total_slots = Column(Integer, default=24)
    base_rate_per_hour = Column(Float, default=40.0) # INR
    image_url = Column(String(500), nullable=True)
    description = Column(Text, nullable=True)
    contact_phone = Column(String(30), nullable=True, default="+91 80 4123 5678")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    slots = relationship("ParkingSlot", back_populates="facility", cascade="all, delete-orphan")
    bookings = relationship("Booking", back_populates="facility", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "city": self.city,
            "address": self.address,
            "total_slots": self.total_slots,
            "base_rate_per_hour": self.base_rate_per_hour,
            "image_url": self.image_url,
            "description": self.description,
            "contact_phone": self.contact_phone,
            "is_active": self.is_active,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class ParkingSlot(Base):
    __tablename__ = "parking_slots"

    id = Column(Integer, primary_key=True, index=True)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False)
    slot_code = Column(String(20), nullable=False, index=True) # e.g., 'A-01', 'B-12'
    block = Column(String(10), nullable=False, default="A")
    slot_type = Column(String(30), default="standard") # 'standard', 'ev_charging', 'compact', 'accessible', 'suv'
    hourly_rate = Column(Float, default=40.0)
    status = Column(String(20), default="available") # 'available', 'maintenance', 'blocked'
    has_ev_charger = Column(Boolean, default=False)
    has_iot_sensor = Column(Boolean, default=True)

    facility = relationship("ParkingFacility", back_populates="slots")
    bookings = relationship("Booking", back_populates="slot", cascade="all, delete-orphan")
    sensor = relationship("SensorTelemetry", back_populates="slot", uselist=False, cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "facility_id": self.facility_id,
            "slot_code": self.slot_code,
            "block": self.block,
            "slot_type": self.slot_type,
            "hourly_rate": self.hourly_rate,
            "status": self.status,
            "has_ev_charger": self.has_ev_charger,
            "has_iot_sensor": self.has_iot_sensor,
            "sensor": self.sensor.to_dict() if self.sensor else None
        }


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    booking_ref = Column(String(30), unique=True, index=True, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    facility_id = Column(Integer, ForeignKey("parking_facilities.id", ondelete="CASCADE"), nullable=False)
    slot_id = Column(Integer, ForeignKey("parking_slots.id", ondelete="CASCADE"), nullable=False)
    
    vehicle_number = Column(String(20), nullable=False, index=True)
    vehicle_type = Column(String(30), default="sedan") # 'sedan', 'suv', 'hatchback', 'ev', 'two_wheeler'
    driver_name = Column(String(100), nullable=False)
    driver_phone = Column(String(20), nullable=True)

    start_time = Column(DateTime, nullable=False, index=True)
    end_time = Column(DateTime, nullable=False, index=True)
    total_hours = Column(Float, nullable=False)
    hourly_rate = Column(Float, nullable=False)
    estimated_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)

    booking_status = Column(String(20), default="confirmed") # 'confirmed', 'active', 'completed', 'cancelled'
    payment_status = Column(String(20), default="unpaid") # 'unpaid', 'paid', 'refunded'

    anpr_entry_time = Column(DateTime, nullable=True)
    anpr_exit_time = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="bookings")
    facility = relationship("ParkingFacility", back_populates="bookings")
    slot = relationship("ParkingSlot", back_populates="bookings")
    payments = relationship("Payment", back_populates="booking", cascade="all, delete-orphan")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_ref": self.booking_ref,
            "user_id": self.user_id,
            "facility_id": self.facility_id,
            "facility_name": self.facility.name if self.facility else "",
            "facility_city": self.facility.city if self.facility else "",
            "slot_id": self.slot_id,
            "slot_code": self.slot.slot_code if self.slot else "",
            "slot_type": self.slot.slot_type if self.slot else "standard",
            "vehicle_number": self.vehicle_number,
            "vehicle_type": self.vehicle_type,
            "driver_name": self.driver_name,
            "driver_phone": self.driver_phone,
            "start_time": self.start_time.isoformat() if self.start_time else None,
            "end_time": self.end_time.isoformat() if self.end_time else None,
            "total_hours": self.total_hours,
            "hourly_rate": self.hourly_rate,
            "estimated_amount": self.estimated_amount,
            "paid_amount": self.paid_amount,
            "booking_status": self.booking_status,
            "payment_status": self.payment_status,
            "anpr_entry_time": self.anpr_entry_time.isoformat() if self.anpr_entry_time else None,
            "anpr_exit_time": self.anpr_exit_time.isoformat() if self.anpr_exit_time else None,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id", ondelete="CASCADE"), nullable=False)
    transaction_id = Column(String(64), unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(30), default="upi") # 'upi', 'card', 'wallet', 'cash'
    payment_status = Column(String(20), default="paid") # 'paid', 'refunded', 'failed'
    payment_time = Column(DateTime, default=datetime.utcnow)

    booking = relationship("Booking", back_populates="payments")

    def to_dict(self):
        return {
            "id": self.id,
            "booking_id": self.booking_id,
            "transaction_id": self.transaction_id,
            "amount": self.amount,
            "payment_method": self.payment_method,
            "payment_status": self.payment_status,
            "payment_time": self.payment_time.isoformat() if self.payment_time else None
        }


class SensorTelemetry(Base):
    __tablename__ = "sensor_telemetry"

    id = Column(Integer, primary_key=True, index=True)
    slot_id = Column(Integer, ForeignKey("parking_slots.id", ondelete="CASCADE"), unique=True, nullable=False)
    sensor_code = Column(String(40), unique=True, nullable=False)
    distance_cm = Column(Float, default=240.0) # > 100cm means empty, < 50cm means vehicle parked
    is_occupied = Column(Boolean, default=False)
    battery_pct = Column(Integer, default=94)
    signal_strength_dbm = Column(Integer, default=-62)
    last_heartbeat = Column(DateTime, default=datetime.utcnow)

    slot = relationship("ParkingSlot", back_populates="sensor")

    def to_dict(self):
        return {
            "id": self.id,
            "slot_id": self.slot_id,
            "sensor_code": self.sensor_code,
            "distance_cm": self.distance_cm,
            "is_occupied": self.is_occupied,
            "battery_pct": self.battery_pct,
            "signal_strength_dbm": self.signal_strength_dbm,
            "last_heartbeat": self.last_heartbeat.isoformat() if self.last_heartbeat else None
        }
