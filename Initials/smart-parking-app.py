import os
from flask import Flask, render_template, request, redirect, url_for, session, flash
import mysql.connector
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

app = Flask(__name__)
app.secret_key = 'super_secret_key'

# Database Configuration
db_config = {
    'host': 'localhost',
    'user': 'root',
    'password': 'password',
    'database': 'smart_parking_db'
}

def get_db_connection():
    return mysql.connector.connect(**db_config)

# --- ROUTES ---

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        email = request.form['email']
        password = generate_password_hash(request.form['password'])
        
        conn = get_db_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("INSERT INTO Users (full_name, email, password_hash) VALUES (%s, %s, %s)", 
                           (name, email, password))
            conn.commit()
            flash('Registration successful! Please login.', 'success')
            return redirect(url_for('login'))
        except mysql.connector.Error as err:
            flash(f'Error: {err}', 'danger')
        finally:
            cursor.close()
            conn.close()
    return render_template('register.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM Users WHERE email = %s", (email,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['user_id']
            session['role'] = user['role']
            session['name'] = user['full_name']
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid credentials', 'danger')
    return render_template('login.html')

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    
    conn = get_db_connection()
    cursor = conn.cursor(dictionary=True)
    
    if session['role'] == 'admin':
        # Admin Stats
        cursor.execute("SELECT COUNT(*) as total FROM Parking_Slots")
        total_slots = cursor.fetchone()['total']
        cursor.execute("SELECT COUNT(*) as available FROM Parking_Slots WHERE slot_status = 'available'")
        avail_slots = cursor.fetchone()['available']
        cursor.execute("SELECT SUM(amount) as revenue FROM Payments WHERE payment_status = 'paid'")
        revenue = cursor.fetchone()['revenue'] or 0
        
        return render_template('admin_dashboard.html', total=total_slots, avail=avail_slots, revenue=revenue)
    else:
        # User Stats
        cursor.execute("SELECT * FROM Bookings WHERE user_id = %s", (session['user_id'],))
        my_bookings = cursor.fetchall()
        return render_template('user_dashboard.html', bookings=my_bookings)

@app.route('/book', methods=['POST'])
def book_slot():
    if 'user_id' not in session: return redirect(url_for('login'))
    
    slot_id = request.form['slot_id']
    vehicle_id = request.form['vehicle_id']
    start_time = request.form['start_time']
    end_time = request.form['end_time']
    
    conn = get_db_connection()
    cursor = conn.cursor()
    
    try:
        # Transactional Booking
        conn.start_transaction()
        
        # Check if still available (Locking)
        cursor.execute("SELECT slot_status FROM Parking_Slots WHERE slot_id = %s FOR UPDATE", (slot_id,))
        status = cursor.fetchone()[0]
        
        if status != 'available':
            conn.rollback()
            flash('Slot already booked!', 'danger')
            return redirect(url_for('dashboard'))
        
        # Insert Booking
        cursor.execute("INSERT INTO Bookings (user_id, vehicle_id, slot_id, start_time, end_time) VALUES (%s, %s, %s, %s, %s)",
                       (session['user_id'], vehicle_id, slot_id, start_time, end_time))
        
        # Update Slot Status
        cursor.execute("UPDATE Parking_Slots SET slot_status = 'reserved' WHERE slot_id = %s", (slot_id,))
        
        conn.commit()
        flash('Booking confirmed!', 'success')
    except Exception as e:
        conn.rollback()
        flash(f'Booking failed: {e}', 'danger')
    finally:
        cursor.close()
        conn.close()
    
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    app.run(debug=True)
