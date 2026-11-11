"""Create a ParkBay administrator interactively.

Run from the backend directory: python create_admin.py
This is an out-of-band operator task; never expose the password in command arguments.
"""
import getpass
import re

from werkzeug.security import generate_password_hash
from database import SessionLocal
from models import User


def main():
    name = input("Administrator full name: ").strip()
    email = input("Administrator email: ").strip().lower()
    if len(name) < 2 or not re.fullmatch(r"[^\s@]+@[^\s@]+\.[^\s@]+", email):
        raise SystemExit("A valid name and email address are required.")

    password = getpass.getpass("New password (minimum 16 characters): ")
    confirmation = getpass.getpass("Confirm password: ")
    if len(password) < 16 or password != confirmation:
        raise SystemExit("Passwords must match and be at least 16 characters.")

    db = SessionLocal()
    try:
        if db.query(User).filter(User.email == email).first():
            raise SystemExit("An account with this email already exists. Use a different email.")
        user = User(
            full_name=name,
            email=email,
            password_hash=generate_password_hash(password),
            role="admin",
        )
        db.add(user)
        db.commit()
        print(f"Administrator account created for {email}.")
    finally:
        db.close()


if __name__ == "__main__":
    main()
