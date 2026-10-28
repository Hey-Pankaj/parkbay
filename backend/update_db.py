import sqlite3

conn = sqlite3.connect('parkbay/backend/parkbay.db')
cursor = conn.cursor()

# Update any occurrences of Alex Driver
cursor.execute("UPDATE users SET full_name = 'Aarav Sharma' WHERE full_name = 'Alex Driver'")
cursor.execute("UPDATE bookings SET driver_name = 'Aarav Sharma' WHERE driver_name = 'Alex Driver'")

# Check if new columns exist in users table
cursor.execute("PRAGMA table_info(users)")
cols = [r[1] for r in cursor.fetchall()]
for col, ctype in [('vehicle_number', 'VARCHAR(50)'), ('vehicle_type', 'VARCHAR(50)'), ('city', 'VARCHAR(100)'), ('address', 'VARCHAR(255)'), ('emergency_contact', 'VARCHAR(100)')]:
    if col not in cols:
        cursor.execute(f"ALTER TABLE users ADD COLUMN {col} {ctype}")
        print(f"Added column {col}")

conn.commit()
conn.close()
print("Database successfully synchronized with Indian names and user profile fields!")

