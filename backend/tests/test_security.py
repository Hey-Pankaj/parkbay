"""Security regression tests for ParkBay API authorization.

Run from the backend directory with: python -m unittest discover -s tests
"""
import os
import unittest
from datetime import datetime, timedelta

os.environ.setdefault("FLASK_ENV", "development")
os.environ.setdefault("SECRET_KEY", "parkbay-security-test-key")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from werkzeug.security import generate_password_hash

import app as parkbay_app
from database import Base
from models import User, ParkingFacility, ParkingSlot, Booking


class SecurityAuthorizationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(bind=cls.engine)
        cls.Session = sessionmaker(bind=cls.engine)
        parkbay_app.SessionLocal = cls.Session
        parkbay_app.app.config.update(TESTING=True)
        cls.client = parkbay_app.app.test_client()

    @classmethod
    def tearDownClass(cls):
        cls.engine.dispose()

    def setUp(self):
        Base.metadata.drop_all(bind=self.engine)
        Base.metadata.create_all(bind=self.engine)
        db = self.Session()
        self.admin = User(
            full_name="Test Admin",
            email="admin@test.invalid",
            password_hash=generate_password_hash("a-very-long-test-password"),
            role="admin",
        )
        self.driver = User(
            full_name="Test Driver",
            email="driver@test.invalid",
            password_hash=generate_password_hash("a-very-long-test-password"),
            role="driver",
        )
        db.add_all([self.admin, self.driver])
        db.commit()
        self.admin_id = self.admin.id
        facility = ParkingFacility(
            name="Test Facility", city="Test City", address="1 Test Street",
            total_slots=1, base_rate_per_hour=20.0,
        )
        db.add(facility)
        db.flush()
        slot = ParkingSlot(
            facility_id=facility.id, slot_code="A-01", block="A",
            slot_type="standard", hourly_rate=20.0, status="available",
        )
        db.add(slot)
        db.flush()
        booking = Booking(
            booking_ref="PB-TEST-01", user_id=self.admin.id,
            facility_id=facility.id, slot_id=slot.id,
            vehicle_number="MH01AB1234", vehicle_type="sedan",
            driver_name=self.admin.full_name, start_time=datetime.utcnow(),
            end_time=datetime.utcnow() + timedelta(hours=2), total_hours=2.0,
            hourly_rate=20.0, estimated_amount=47.2, paid_amount=47.2,
            booking_status="confirmed", payment_status="paid",
        )
        db.add(booking)
        db.commit()
        self.booking_id = booking.id
        self.driver_id = self.driver.id
        db.close()
        self.admin_token = parkbay_app.TOKEN_SERIALIZER.dumps({"user_id": self.admin_id})
        self.driver_token = parkbay_app.TOKEN_SERIALIZER.dumps({"user_id": self.driver_id})

    def test_admin_routes_require_authentication(self):
        response = self.client.get("/api/admin/stats")
        self.assertEqual(response.status_code, 401)

    def test_driver_cannot_access_admin_routes(self):
        response = self.client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(response.status_code, 403)

    def test_admin_can_access_admin_routes(self):
        response = self.client.get(
            "/api/admin/stats",
            headers={"Authorization": f"Bearer {self.admin_token}"},
        )
        self.assertEqual(response.status_code, 200)

    def test_public_registration_cannot_create_admin(self):
        response = self.client.post("/api/auth/register", json={
            "full_name": "New Account",
            "email": "new-driver@test.invalid",
            "password": "a-long-registration-password",
            "role": "admin",
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["user"]["role"], "driver")

    def test_driver_cannot_cancel_another_users_booking(self):
        response = self.client.post(
            f"/api/bookings/{self.booking_id}/cancel",
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(response.status_code, 403)

    def test_driver_booking_list_cannot_be_switched_to_another_user(self):
        response = self.client.get(
            f"/api/bookings?user_id={self.admin_id}",
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["bookings"], [])

    def test_profile_ignores_client_supplied_user_id(self):
        response = self.client.get(
            f"/api/users/profile?user_id={self.admin_id}",
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["id"], self.driver_id)


if __name__ == "__main__":
    unittest.main()
