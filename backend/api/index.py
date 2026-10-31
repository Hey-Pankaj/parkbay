import sys
import os

# Insert backend root directory into sys.path so app, database, models are discoverable
backend_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_root not in sys.path:
    sys.path.insert(0, backend_root)

from app import app
