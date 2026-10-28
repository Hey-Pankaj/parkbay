import uuid
from datetime import datetime, timedelta
from werkzeug.security import generate_password_hash
from database import engine, Base, SessionLocal
from models import User, ParkingFacility, ParkingSlot, Booking, Payment, SensorTelemetry

def seed_database():
    """Initializes tables and seeds rich initial data if empty."""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # Check if users already exist
        if db.query(User).first() is not None:
            return

        print("[ParkBay Seed] Seeding database with initial facilities, slots, users, and IoT sensors...")

        # 1. Create Default Users
        admin_user = User(
            full_name="ParkBay Admin Officer",
            email="admin@parkbay.com",
            password_hash=generate_password_hash("admin123"),
            role="admin",
            phone="+91 80 4123 5678"
        )
        driver_user = User(
            full_name="Aarav Sharma",
            email="driver@parkbay.com",
            password_hash=generate_password_hash("password123"),
            role="driver",
            phone="+91 98765 43210"
        )
        db.add_all([admin_user, driver_user])
        db.flush()

        # 2. Facilities
        facilities_data = [
            {
                "name": "ParkBay Central Galleria",
                "city": "Bengaluru",
                "address": "Plot 42, Brigade Road, Ashok Nagar",
                "total_slots": 24,
                "base_rate_per_hour": 40.0,
                "image_url": "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80",
                "description": "Multi-level underground parking with direct shopping mall access, Level-2 EV fast chargers, and smart IoT bay sensors.",
                "contact_phone": "+91 80 2558 1122"
            },
            {
                "name": "ParkBay Tech Park Hub",
                "city": "Bengaluru",
                "address": "Block 3, Outer Ring Road, Bellandur",
                "total_slots": 20,
                "base_rate_per_hour": 35.0,
                "image_url": "https://images.unsplash.com/photo-1590674899484-d5640e854abe?auto=format&fit=crop&w=1200&q=80",
                "description": "Dedicated corporate and visitor parking equipped with automated boom barriers, high-speed ANPR camera recognition, and EV charging.",
                "contact_phone": "+91 80 4667 9900"
            },
            {
                "name": "ParkBay Airport Express Terminal",
                "city": "Bengaluru",
                "address": "Terminal 1 Arrivals, Devanahalli",
                "total_slots": 16,
                "base_rate_per_hour": 60.0,
                "image_url": "https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?auto=format&fit=crop&w=1200&q=80",
                "description": "24/7 guarded airport parking with complimentary luggage trolley bays, valet service, and real-time flight connection display.",
                "contact_phone": "+91 80 6678 2211"
            }
        ]

        slot_types_distribution = [
            ("standard", 1.0, False),
            ("standard", 1.0, False),
            ("ev_charging", 1.5, True),
            ("standard", 1.0, False),
            ("suv", 1.25, False),
            ("compact", 0.85, False),
            ("accessible", 1.0, False),
            ("standard", 1.0, False),
        ]

        facilities = []
        all_created_slots = []

        for f_data in facilities_data:
            fac = ParkingFacility(**f_data)
            db.add(fac)
            db.flush()
            facilities.append(fac)

            # Generate slots in blocks A & B
            num_slots = fac.total_slots
            for idx in range(num_slots):
                block = "A" if idx < (num_slots // 2) else "B"
                slot_num = (idx % (num_slots // 2)) + 1
                slot_code = f"{block}-{slot_num:02d}"

                stype, rate_mult, has_ev = slot_types_distribution[idx % len(slot_types_distribution)]
                hourly_rate = round(fac.base_rate_per_hour * rate_mult, 2)

                slot = ParkingSlot(
                    facility_id=fac.id,
                    slot_code=slot_code,
                    block=block,
                    slot_type=stype,
                    hourly_rate=hourly_rate,
                    status="available",
                    has_ev_charger=has_ev,
                    has_iot_sensor=True
                )
                db.add(slot)
                db.flush()
                all_created_slots.append(slot)

                # Add IoT sensor telemetry
                sensor = SensorTelemetry(
                    slot_id=slot.id,
                    sensor_code=f"IOT-SNSR-{fac.id}-{slot_code}",
                    distance_cm=245.0,
                    is_occupied=False,
                    battery_pct=92 + (idx % 8),
                    signal_strength_dbm=-60 - (idx % 15),
                    last_heartbeat=datetime.utcnow()
                )
                db.add(sensor)

        # 3. Create initial demo bookings on Facility 1
        fac1 = facilities[0]
        now = datetime.utcnow()

        # Slot A-01: Currently active booking
        slot1 = all_created_slots[0]
        booking1 = Booking(
            booking_ref=f"PB-{uuid.uuid4().hex[:6].upper()}",
            user_id=driver_user.id,
            facility_id=fac1.id,
            slot_id=slot1.id,
            vehicle_number="KA01MJ4321",
            vehicle_type="ev",
            driver_name="Aarav Sharma",
            driver_phone="+91 98765 43210",
            start_time=now - timedelta(hours=1),
            end_time=now + timedelta(hours=2),
            total_hours=3.0,
            hourly_rate=slot1.hourly_rate,
            estimated_amount=slot1.hourly_rate * 3.0,
            paid_amount=slot1.hourly_rate * 3.0,
            booking_status="active",
            payment_status="paid",
            anpr_entry_time=now - timedelta(hours=1)
        )
        db.add(booking1)
        db.flush()

        # Update slot sensor to occupied
        slot1.sensor.is_occupied = True
        slot1.sensor.distance_cm = 32.5

        # Slot A-03: Upcoming booking
        slot3 = all_created_slots[2]
        booking2 = Booking(
            booking_ref=f"PB-{uuid.uuid4().hex[:6].upper()}",
            user_id=driver_user.id,
            facility_id=fac1.id,
            slot_id=slot3.id,
            vehicle_number="MH02AB9876",
            vehicle_type="suv",
            driver_name="Rohan Sharma",
            driver_phone="+91 98111 22334",
            start_time=now + timedelta(hours=3),
            end_time=now + timedelta(hours=6),
            total_hours=3.0,
            hourly_rate=slot3.hourly_rate,
            estimated_amount=slot3.hourly_rate * 3.0,
            paid_amount=slot3.hourly_rate * 3.0,
            booking_status="confirmed",
            payment_status="paid"
        )
        db.add(booking2)

        # Payment records
        p1 = Payment(
            booking_id=booking1.id,
            transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            amount=booking1.paid_amount,
            payment_method="upi",
            payment_status="paid"
        )
        db.add(p1)

        db.commit()
        print("[ParkBay Seed] Database seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"[ParkBay Seed] Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
