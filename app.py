import os
import re
import uuid
from datetime import datetime, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy import or_, and_, desc

from database import engine, SessionLocal
from models import User, ParkingFacility, ParkingSlot, Booking, Payment, SensorTelemetry
from seed_data import seed_database

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "parkbay_secure_jwt_token_secret_key_2026")
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Plate validator regex (e.g., KA01MJ4321, MH02AB1234, DL3CAA1122)
PLATE_REGEX = re.compile(r"^[A-Z0-9]{5,14}$")

# In-memory FIFO waitlist queue: [{ "facility_id": 1, "name": "...", "vehicle": "...", "hours": 2, "slot_type": "standard", "created_at": ... }]
WAITLIST = []

def parse_iso_datetime(dt_str):
    """Parses standard ISO datetime string or common format."""
    if not dt_str:
        return None
    try:
        # replace Z if present
        dt_clean = dt_str.replace("Z", "+00:00")
        if "T" in dt_clean:
            return datetime.fromisoformat(dt_clean)
        return datetime.strptime(dt_clean, "%Y-%m-%d %H:%M:%S")
    except Exception:
        try:
            return datetime.strptime(dt_str[:16], "%Y-%m-%dT%H:%M")
        except Exception:
            return None

# ==============================================================================
# AUTHENTICATION ENDPOINTS
# ==============================================================================

@app.post("/api/auth/register")
def register():
    data = request.get_json(silent=True) or {}
    name = (data.get("full_name") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = data.get("role", "driver")
    phone = (data.get("phone") or "").strip()

    if not name or len(name) < 2:
        return jsonify({"error": "Full name is required."}), 400
    if not email or "@" not in email:
        return jsonify({"error": "A valid email address is required."}), 400
    if not password or len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters."}), 400

    db = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email).first()
        if existing:
            return jsonify({"error": "An account with this email already exists."}), 409

        user = User(
            full_name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role="admin" if role == "admin" else "driver",
            phone=phone
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return jsonify({"message": "Registration successful!", "user": user.to_dict()}), 201
    finally:
        db.close()


@app.post("/api/auth/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not email or not password:
        return jsonify({"error": "Please provide both email and password."}), 400

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid email or password."}), 401

        # Return simulated auth payload
        return jsonify({
            "token": f"token-{user.id}-{uuid.uuid4().hex[:8]}",
            "user": user.to_dict()
        })
    finally:
        db.close()


# ==============================================================================
# FACILITIES & REAL-TIME AVAILABILITY ENDPOINTS
# ==============================================================================

@app.get("/api/facilities")
def get_facilities():
    db = SessionLocal()
    try:
        facilities = db.query(ParkingFacility).filter(ParkingFacility.is_active == True).all()
        result = []
        now = datetime.utcnow()

        for f in facilities:
            f_dict = f.to_dict()
            total = len(f.slots)
            
            # Count currently occupied slots via active booking or maintenance
            occupied_slots = db.query(Booking.slot_id).filter(
                Booking.facility_id == f.id,
                Booking.booking_status.in_(["confirmed", "active"]),
                Booking.start_time <= now,
                Booking.end_time >= now
            ).distinct().count()

            maintenance_count = db.query(ParkingSlot).filter(
                ParkingSlot.facility_id == f.id,
                ParkingSlot.status != "available"
            ).count()

            available = max(0, total - occupied_slots - maintenance_count)
            f_dict["available_slots"] = available
            f_dict["occupancy_rate"] = round((occupied_slots / total * 100), 1) if total > 0 else 0
            result.append(f_dict)

        return jsonify({"facilities": result})
    finally:
        db.close()


@app.get("/api/facilities/<int:facility_id>")
def get_facility_detail(facility_id):
    db = SessionLocal()
    try:
        facility = db.query(ParkingFacility).filter(ParkingFacility.id == facility_id).first()
        if not facility:
            return jsonify({"error": "Facility not found"}), 404
        return jsonify({"facility": facility.to_dict()})
    finally:
        db.close()


@app.get("/api/facilities/<int:facility_id>/slots")
def get_facility_slots(facility_id):
    """
    Returns all slots for facility with calculated availability for the given time window.
    Query params:
      - start_time: ISO string (optional)
      - end_time: ISO string (optional)
    """
    start_str = request.args.get("start_time")
    end_str = request.args.get("end_time")

    now = datetime.utcnow()
    req_start = parse_iso_datetime(start_str) or now
    req_end = parse_iso_datetime(end_str) or (req_start + timedelta(hours=2))

    if req_end <= req_start:
        return jsonify({"error": "End time must be after start time."}), 400

    db = SessionLocal()
    try:
        facility = db.query(ParkingFacility).filter(ParkingFacility.id == facility_id).first()
        if not facility:
            return jsonify({"error": "Facility not found"}), 404

        slots = db.query(ParkingSlot).filter(ParkingSlot.facility_id == facility_id).order_by(
            ParkingSlot.block, ParkingSlot.slot_code
        ).all()

        # Find bookings that overlap with requested [req_start, req_end]
        overlapping_bookings = db.query(Booking).filter(
            Booking.facility_id == facility_id,
            Booking.booking_status.in_(["confirmed", "active"]),
            Booking.start_time < req_end,
            Booking.end_time > req_start
        ).all()

        slot_booking_map = {b.slot_id: b for b in overlapping_bookings}

        results = []
        for s in slots:
            slot_data = s.to_dict()
            is_under_maint = (s.status != "available")
            booking = slot_booking_map.get(s.id)
            is_busy = is_under_maint or (booking is not None)

            slot_data["busy"] = is_busy
            slot_data["is_maintenance"] = is_under_maint
            if booking:
                slot_data["active_booking"] = {
                    "id": booking.id,
                    "booking_ref": booking.booking_ref,
                    "driver_name": booking.driver_name,
                    "vehicle_number": booking.vehicle_number,
                    "start_time": booking.start_time.isoformat(),
                    "end_time": booking.end_time.isoformat(),
                    "status": booking.booking_status
                }
            results.append(slot_data)

        # Count stats
        total = len(results)
        busy_count = sum(1 for s in results if s["busy"])
        free_count = total - busy_count

        return jsonify({
            "facility_id": facility_id,
            "facility_name": facility.name,
            "base_rate": facility.base_rate_per_hour,
            "query_window": {
                "start": req_start.isoformat(),
                "end": req_end.isoformat(),
                "hours": round((req_end - req_start).total_seconds() / 3600.0, 2)
            },
            "stats": {
                "total": total,
                "available": free_count,
                "occupied": busy_count
            },
            "slots": results
        })
    finally:
        db.close()


# ==============================================================================
# BOOKING CALCULATION & RESERVATIONS
# ==============================================================================

@app.post("/api/bookings/calculate")
def calculate_charges():
    data = request.get_json(silent=True) or {}
    slot_id = data.get("slot_id")
    facility_id = data.get("facility_id")
    start_str = data.get("start_time")
    end_str = data.get("end_time")
    hours_input = data.get("hours")

    req_start = parse_iso_datetime(start_str) or datetime.utcnow()
    if end_str:
        req_end = parse_iso_datetime(end_str)
        total_hours = max(0.5, round((req_end - req_start).total_seconds() / 3600.0, 2))
    elif hours_input:
        total_hours = float(hours_input)
        req_end = req_start + timedelta(hours=total_hours)
    else:
        total_hours = 2.0
        req_end = req_start + timedelta(hours=2.0)

    db = SessionLocal()
    try:
        hourly_rate = 40.0
        slot_type = "standard"
        slot_code = "A-01"

        if slot_id:
            slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
            if slot:
                hourly_rate = slot.hourly_rate
                slot_type = slot.slot_type
                slot_code = slot.slot_code
        elif facility_id:
            facility = db.query(ParkingFacility).filter(ParkingFacility.id == facility_id).first()
            if facility:
                hourly_rate = facility.base_rate_per_hour

        base_amount = round(total_hours * hourly_rate, 2)
        gst = round(base_amount * 0.18, 2) # 18% GST standard in parking services
        total_amount = round(base_amount + gst, 2)

        return jsonify({
            "total_hours": total_hours,
            "hourly_rate": hourly_rate,
            "slot_type": slot_type,
            "slot_code": slot_code,
            "base_amount": base_amount,
            "gst_amount": gst,
            "total_amount": total_amount,
            "start_time": req_start.isoformat(),
            "end_time": req_end.isoformat()
        })
    finally:
        db.close()


@app.post("/api/bookings")
def create_booking():
    data = request.get_json(silent=True) or {}
    facility_id = data.get("facility_id")
    slot_id = data.get("slot_id")
    user_id = data.get("user_id") or 1 # fallback demo driver
    driver_name = (data.get("driver_name") or "").strip()
    driver_phone = (data.get("driver_phone") or "").strip()
    vehicle_number = re.sub(r"\s+", "", (data.get("vehicle_number") or "").upper())
    vehicle_type = data.get("vehicle_type", "sedan")
    start_str = data.get("start_time")
    end_str = data.get("end_time")
    hours_input = data.get("hours")
    payment_method = data.get("payment_method", "upi")

    # Validation
    if not driver_name:
        return jsonify({"error": "Driver name is required."}), 400
    if not vehicle_number or not PLATE_REGEX.match(vehicle_number):
        return jsonify({"error": "Please provide a valid vehicle license plate (e.g., KA01MJ4321)."}), 400

    now = datetime.utcnow()
    req_start = parse_iso_datetime(start_str) or now
    if end_str:
        req_end = parse_iso_datetime(end_str)
    elif hours_input:
        req_end = req_start + timedelta(hours=float(hours_input))
    else:
        req_end = req_start + timedelta(hours=2.0)

    if req_end <= req_start:
        return jsonify({"error": "End time must be after start time."}), 400

    total_hours = max(0.5, round((req_end - req_start).total_seconds() / 3600.0, 2))

    db = SessionLocal()
    try:
        # Check if user exists, else pick first driver
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            user = db.query(User).filter(User.role == "driver").first()
            if not user:
                user = User(
                    full_name=driver_name,
                    email=f"driver_{uuid.uuid4().hex[:4]}@parkbay.com",
                    password_hash=generate_password_hash("password123"),
                    role="driver"
                )
                db.add(user)
                db.flush()

        # If slot_id is provided, verify it
        slot = None
        if slot_id:
            slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
            if not slot:
                return jsonify({"error": "Selected parking slot does not exist."}), 404
            if slot.status != "available":
                return jsonify({"error": f"Slot {slot.slot_code} is currently under {slot.status}."}), 409

            # Check overlap on this slot
            conflict = db.query(Booking).filter(
                Booking.slot_id == slot.id,
                Booking.booking_status.in_(["confirmed", "active"]),
                Booking.start_time < req_end,
                Booking.end_time > req_start
            ).first()
            if conflict:
                return jsonify({"error": f"Slot {slot.slot_code} is already booked from {conflict.start_time.strftime('%H:%M')} to {conflict.end_time.strftime('%H:%M')}."}), 409
        else:
            # Auto-assign nearest free slot for facility
            if not facility_id:
                return jsonify({"error": "Facility ID or Slot ID required."}), 400
            
            # Find available slot
            busy_slot_ids = [b.slot_id for b in db.query(Booking.slot_id).filter(
                Booking.facility_id == facility_id,
                Booking.booking_status.in_(["confirmed", "active"]),
                Booking.start_time < req_end,
                Booking.end_time > req_start
            ).all()]

            slot = db.query(ParkingSlot).filter(
                ParkingSlot.facility_id == facility_id,
                ParkingSlot.status == "available",
                ~ParkingSlot.id.in_(busy_slot_ids)
            ).order_by(ParkingSlot.block, ParkingSlot.slot_code).first()

            if not slot:
                return jsonify({"error": "All slots are fully reserved for this time period. You can join the waiting list."}), 409

        facility_id = slot.facility_id
        facility = db.query(ParkingFacility).filter(ParkingFacility.id == facility_id).first()

        # Check if vehicle is already booked concurrently in any active slot
        vehicle_conflict = db.query(Booking).filter(
            Booking.vehicle_number == vehicle_number,
            Booking.booking_status.in_(["confirmed", "active"]),
            Booking.start_time < req_end,
            Booking.end_time > req_start
        ).first()
        if vehicle_conflict:
            return jsonify({"error": f"Vehicle {vehicle_number} already has an active reservation ({vehicle_conflict.booking_ref}) in this timeframe."}), 409

        # Calculation
        hourly_rate = slot.hourly_rate
        base_fee = total_hours * hourly_rate
        gst = base_fee * 0.18
        total_fee = round(base_fee + gst, 2)

        booking_ref = f"PB-{uuid.uuid4().hex[:6].upper()}"
        is_immediate = (req_start <= now + timedelta(minutes=15))

        booking = Booking(
            booking_ref=booking_ref,
            user_id=user.id,
            facility_id=facility_id,
            slot_id=slot.id,
            vehicle_number=vehicle_number,
            vehicle_type=vehicle_type,
            driver_name=driver_name,
            driver_phone=driver_phone or user.phone,
            start_time=req_start,
            end_time=req_end,
            total_hours=total_hours,
            hourly_rate=hourly_rate,
            estimated_amount=total_fee,
            paid_amount=total_fee,
            booking_status="active" if is_immediate else "confirmed",
            payment_status="paid"
        )
        db.add(booking)
        db.flush()

        # Create simulated payment record
        payment = Payment(
            booking_id=booking.id,
            transaction_id=f"TXN-{uuid.uuid4().hex[:10].upper()}",
            amount=total_fee,
            payment_method=payment_method,
            payment_status="paid"
        )
        db.add(payment)

        # Update IoT sensor if active right now
        if is_immediate and slot.sensor:
            slot.sensor.is_occupied = True
            slot.sensor.distance_cm = 35.0
            slot.sensor.last_heartbeat = datetime.utcnow()

        db.commit()
        db.refresh(booking)

        return jsonify({
            "ok": True,
            "message": "Parking slot reserved successfully!",
            "booking": booking.to_dict()
        }), 201
    except Exception as e:
        db.rollback()
        return jsonify({"error": f"Reservation failed: {str(e)}"}), 500
    finally:
        db.close()


@app.get("/api/bookings")
def get_bookings():
    """Returns bookings. If user_id passed, filters by user. If admin, returns all."""
    user_id = request.args.get("user_id")
    facility_id = request.args.get("facility_id")
    status = request.args.get("status")

    db = SessionLocal()
    try:
        query = db.query(Booking).order_by(desc(Booking.created_at))
        if user_id:
            query = query.filter(Booking.user_id == int(user_id))
        if facility_id:
            query = query.filter(Booking.facility_id == int(facility_id))
        if status:
            query = query.filter(Booking.booking_status == status)

        bookings = query.limit(100).all()
        return jsonify({"bookings": [b.to_dict() for b in bookings]})
    finally:
        db.close()


@app.post("/api/bookings/<int:booking_id>/cancel")
def cancel_booking(booking_id):
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return jsonify({"error": "Booking not found."}), 404

        if booking.booking_status in ["completed", "cancelled"]:
            return jsonify({"error": f"Booking is already {booking.booking_status}."}), 400

        booking.booking_status = "cancelled"
        booking.payment_status = "refunded"

        # Reset slot sensor if it was occupied
        if booking.slot and booking.slot.sensor:
            booking.slot.sensor.is_occupied = False
            booking.slot.sensor.distance_cm = 240.0

        db.commit()
        return jsonify({"ok": True, "message": "Reservation cancelled and refund initiated."})
    finally:
        db.close()


@app.post("/api/bookings/<int:booking_id>/release")
def release_booking(booking_id):
    """Mark an active booking as completed and vehicle exited."""
    db = SessionLocal()
    try:
        booking = db.query(Booking).filter(Booking.id == booking_id).first()
        if not booking:
            return jsonify({"error": "Booking not found."}), 404

        booking.booking_status = "completed"
        booking.anpr_exit_time = datetime.utcnow()

        if booking.slot and booking.slot.sensor:
            booking.slot.sensor.is_occupied = False
            booking.slot.sensor.distance_cm = 240.0

        db.commit()

        # Check if anyone in waitlist can be assigned
        assigned_driver = None
        for item in WAITLIST:
            if item["facility_id"] == booking.facility_id:
                assigned_driver = item["name"]
                WAITLIST.remove(item)
                break

        return jsonify({
            "ok": True,
            "message": f"Slot {booking.slot.slot_code if booking.slot else ''} released successfully.",
            "assigned_to_waitlist": assigned_driver
        })
    finally:
        db.close()


# ==============================================================================
# WAITLIST QUEUE (FIFO)
# ==============================================================================

@app.get("/api/waitlist")
def get_waitlist():
    facility_id = request.args.get("facility_id", type=int)
    items = WAITLIST
    if facility_id:
        items = [i for i in WAITLIST if i["facility_id"] == facility_id]
    return jsonify({"waitlist": items, "count": len(items)})


@app.post("/api/waitlist")
def join_waitlist():
    data = request.get_json(silent=True) or {}
    facility_id = data.get("facility_id") or 1
    name = (data.get("name") or "").strip()
    vehicle = re.sub(r"\s+", "", (data.get("vehicle") or "").upper())
    hours = data.get("hours", 2)
    slot_type = data.get("slot_type", "standard")

    if not name or not vehicle:
        return jsonify({"error": "Driver name and vehicle number required."}), 400

    if any(w["vehicle"] == vehicle for w in WAITLIST):
        return jsonify({"error": "This vehicle is already in the waitlist queue."}), 409

    entry = {
        "id": str(uuid.uuid4())[:8],
        "facility_id": facility_id,
        "name": name,
        "vehicle": vehicle,
        "hours": hours,
        "slot_type": slot_type,
        "created_at": datetime.utcnow().strftime("%H:%M:%S")
    }
    WAITLIST.append(entry)
    position = len(WAITLIST)
    return jsonify({"ok": True, "position": position, "entry": entry}), 201


# ==============================================================================
# ADMIN METRICS & MANAGEMENT
# ==============================================================================

@app.get("/api/admin/stats")
def get_admin_stats():
    db = SessionLocal()
    try:
        now = datetime.utcnow()
        today_start = datetime(now.year, now.month, now.day)

        total_facilities = db.query(ParkingFacility).count()
        total_slots = db.query(ParkingSlot).count()

        active_bookings_count = db.query(Booking).filter(
            Booking.booking_status.in_(["confirmed", "active"]),
            Booking.start_time <= now,
            Booking.end_time >= now
        ).count()

        today_revenue = db.query(Payment).filter(
            Payment.payment_time >= today_start,
            Payment.payment_status == "paid"
        ).with_entities(Payment.amount).all()
        revenue_sum = sum(p[0] for p in today_revenue)

        occupancy_pct = round((active_bookings_count / total_slots * 100), 1) if total_slots > 0 else 0.0

        ev_chargers_count = db.query(ParkingSlot).filter(ParkingSlot.has_ev_charger == True).count()
        maint_slots_count = db.query(ParkingSlot).filter(ParkingSlot.status == "maintenance").count()

        return jsonify({
            "total_facilities": total_facilities,
            "total_slots": total_slots,
            "occupied_slots": active_bookings_count,
            "available_slots": max(0, total_slots - active_bookings_count - maint_slots_count),
            "occupancy_rate_pct": occupancy_pct,
            "today_revenue": round(revenue_sum, 2),
            "ev_slots_count": ev_chargers_count,
            "maintenance_slots_count": maint_slots_count,
            "waitlist_count": len(WAITLIST)
        })
    finally:
        db.close()


@app.post("/api/admin/slots")
def add_slot():
    data = request.get_json(silent=True) or {}
    facility_id = data.get("facility_id")
    slot_code = (data.get("slot_code") or "").strip().upper()
    block = (data.get("block") or "A").strip().upper()
    slot_type = data.get("slot_type", "standard")
    hourly_rate = float(data.get("hourly_rate", 40.0))
    has_ev = bool(data.get("has_ev_charger", False))

    if not facility_id or not slot_code:
        return jsonify({"error": "Facility and Slot Code are required."}), 400

    db = SessionLocal()
    try:
        existing = db.query(ParkingSlot).filter(
            ParkingSlot.facility_id == facility_id,
            ParkingSlot.slot_code == slot_code
        ).first()
        if existing:
            return jsonify({"error": f"Slot {slot_code} already exists in this facility."}), 409

        slot = ParkingSlot(
            facility_id=facility_id,
            slot_code=slot_code,
            block=block,
            slot_type=slot_type,
            hourly_rate=hourly_rate,
            status="available",
            has_ev_charger=has_ev,
            has_iot_sensor=True
        )
        db.add(slot)
        db.flush()

        # Telemetry sensor
        sensor = SensorTelemetry(
            slot_id=slot.id,
            sensor_code=f"IOT-SNSR-{facility_id}-{slot_code}",
            distance_cm=240.0,
            is_occupied=False,
            battery_pct=98,
            signal_strength_dbm=-58
        )
        db.add(sensor)
        db.commit()
        return jsonify({"ok": True, "slot": slot.to_dict()}), 201
    finally:
        db.close()


@app.put("/api/admin/slots/<int:slot_id>/status")
def update_slot_status(slot_id):
    data = request.get_json(silent=True) or {}
    new_status = data.get("status") # 'available', 'maintenance', 'blocked'

    if new_status not in ["available", "maintenance", "blocked"]:
        return jsonify({"error": "Invalid status value."}), 400

    db = SessionLocal()
    try:
        slot = db.query(ParkingSlot).filter(ParkingSlot.id == slot_id).first()
        if not slot:
            return jsonify({"error": "Slot not found."}), 404

        slot.status = new_status
        db.commit()
        return jsonify({"ok": True, "slot": slot.to_dict()})
    finally:
        db.close()


# ==============================================================================
# HARDWARE / IOT SENSOR & CAMERA ANPR SIMULATION ENDPOINTS
# ==============================================================================

@app.get("/api/iot/sensors")
def get_sensor_telemetry():
    db = SessionLocal()
    try:
        telemetry = db.query(SensorTelemetry).all()
        return jsonify({"sensors": [t.to_dict() for t in telemetry]})
    finally:
        db.close()


@app.post("/api/iot/sensors/<sensor_code>/simulate")
def simulate_sensor_event(sensor_code):
    """
    Simulates hardware ultrasonic distance change (e.g. car parked or vacated).
    """
    data = request.get_json(silent=True) or {}
    action = data.get("action") # 'occupy', 'vacate', 'toggle'

    db = SessionLocal()
    try:
        sensor = db.query(SensorTelemetry).filter(SensorTelemetry.sensor_code == sensor_code).first()
        if not sensor:
            return jsonify({"error": "Sensor not found."}), 404

        if action == "occupy":
            sensor.is_occupied = True
            sensor.distance_cm = 32.0
        elif action == "vacate":
            sensor.is_occupied = False
            sensor.distance_cm = 240.0
        else: # toggle
            sensor.is_occupied = not sensor.is_occupied
            sensor.distance_cm = 32.0 if sensor.is_occupied else 240.0

        sensor.last_heartbeat = datetime.utcnow()
        db.commit()
        return jsonify({
            "ok": True,
            "sensor": sensor.to_dict(),
            "message": f"Sensor {sensor_code} status updated: {'OCCUPIED' if sensor.is_occupied else 'VACANT'}"
        })
    finally:
        db.close()


@app.post("/api/camera/anpr/scan")
def simulate_anpr_camera():
    """
    Simulates Automatic Number Plate Recognition (ANPR) camera scanning a plate at Entry Barrier.
    Matches against active/confirmed bookings, stamps timestamp, and commands barrier arm.
    """
    data = request.get_json(silent=True) or {}
    plate = re.sub(r"\s+", "", (data.get("vehicle_number") or "").upper())
    gate_id = data.get("gate_id", "GATE-01")

    if not plate:
        return jsonify({"error": "Vehicle license plate required."}), 400

    db = SessionLocal()
    try:
        now = datetime.utcnow()
        # Find active or upcoming booking matching this plate
        booking = db.query(Booking).filter(
            Booking.vehicle_number == plate,
            Booking.booking_status.in_(["confirmed", "active"]),
            Booking.end_time >= now
        ).first()

        if booking:
            # Grant access
            booking.anpr_entry_time = now
            booking.booking_status = "active"
            if booking.slot and booking.slot.sensor:
                booking.slot.sensor.is_occupied = True
                booking.slot.sensor.distance_cm = 30.0

            db.commit()
            return jsonify({
                "access_granted": True,
                "barrier_status": "OPEN",
                "message": f"Welcome {booking.driver_name}! Proceed to Bay {booking.slot.slot_code if booking.slot else 'assigned'}.",
                "gate": gate_id,
                "vehicle": plate,
                "booking": booking.to_dict()
            })
        else:
            return jsonify({
                "access_granted": False,
                "barrier_status": "CLOSED",
                "message": f"Access Denied: No active reservation found for vehicle '{plate}'. Please reserve a slot first.",
                "gate": gate_id,
                "vehicle": plate
            }), 403
    finally:
        db.close()


DIST_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "dist")

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path.startswith("api/"):
        return jsonify({"error": "Endpoint not found"}), 404
    if os.path.exists(DIST_DIR):
        file_path = os.path.join(DIST_DIR, path)
        if path != "" and os.path.exists(file_path):
            return send_from_directory(DIST_DIR, path)
        return send_from_directory(DIST_DIR, "index.html")
    return jsonify({
        "message": "ParkBay Unified API & Management Engine Active",
        "status": "online",
        "endpoints": ["/api/facilities", "/api/auth/login", "/api/bookings", "/api/slots"]
    })


# ==============================================================================
# MAIN ENTRYPOINT
# ==============================================================================

if __name__ == "__main__":
    seed_database()
    print("==========================================================")
    print("  ParkBay Backend Server running on http://127.0.0.1:5000  ")
    print("  REST APIs ready: /api/facilities, /api/bookings, /api/iot")
    print("==========================================================")
    app.run(host="0.0.0.0", port=5000, debug=True)
