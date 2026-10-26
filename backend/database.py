import os
import logging
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ParkBayDB")

# Default MySQL configuration parameters
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "password")
MYSQL_DB = os.getenv("MYSQL_DB", "smart_parking_db")

# If an explicit DATABASE_URL is set, prioritize it
EXPLICIT_DB_URL = os.getenv("DATABASE_URL")

def get_engine():
    """
    Attempts to connect to MySQL database.
    If MySQL server is unavailable or fails, gracefully falls back to local SQLite.
    """
    if EXPLICIT_DB_URL:
        try:
            engine = create_engine(EXPLICIT_DB_URL, pool_recycle=3600)
            with engine.connect() as conn:
                logger.info(f"Connected to explicitly configured database: {EXPLICIT_DB_URL}")
            return engine
        except Exception as e:
            logger.warning(f"Could not connect to explicit DATABASE_URL ({e}). Falling back.")

    # Try MySQL with PyMySQL driver
    mysql_url = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}?charset=utf8mb4"
    try:
        engine = create_engine(mysql_url, pool_recycle=3600, pool_pre_ping=True)
        with engine.connect() as conn:
            logger.info(f"Successfully connected to MySQL database '{MYSQL_DB}' at {MYSQL_HOST}:{MYSQL_PORT}")
        return engine
    except Exception as e:
        logger.info(f"[Notice] MySQL server at {MYSQL_HOST}:{MYSQL_PORT} not reachable ({e}).")
        logger.info("[Notice] Switching to SQLite fallback (parkbay.db) so you can run the app immediately.")
        
        base_dir = os.path.dirname(os.path.abspath(__file__))
        sqlite_path = os.path.join(base_dir, "parkbay.db")
        sqlite_url = f"sqlite:///{sqlite_path}"
        engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
        return engine

engine = get_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db_session():
    """Context manager helper for database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
