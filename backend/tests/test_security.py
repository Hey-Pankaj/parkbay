"""Security regression tests for ParkBay API authorization.

Run from the backend directory with: python -m unittest discover -s tests
"""
import unittest

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from werkzeug.security import generate_password_hash

import app as parkbay_app
from database import Base
from models import User


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
        db = self.Session()
        db.query(User).delete()
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

    def test_profile_ignores_client_supplied_user_id(self):
        response = self.client.get(
            f"/api/users/profile?user_id={self.admin_id}",
            headers={"Authorization": f"Bearer {self.driver_token}"},
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["id"], self.driver_id)


if __name__ == "__main__":
    unittest.main()
