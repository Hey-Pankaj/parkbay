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
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "smart_parking_db")
IS_PRODUCTION = os.getenv("FLASK_ENV", "development").lower() == "production"

# If an explicit DATABASE_URL is set, prioritize it
EXPLICIT_DB_URL = os.getenv("DATABASE_URL")

def get_engine():
    """
    Connect to the configured database. SQLite fallback is development-only.
    """
    if EXPLICIT_DB_URL:
        try:
            engine = create_engine(EXPLICIT_DB_URL, pool_recycle=3600)
            with engine.connect():
                logger.info("Connected to explicitly configured database.")
            return engine
        except Exception:
            logger.exception("Could not connect to explicitly configured DATABASE_URL.")
            if IS_PRODUCTION:
                raise
            logger.warning("Falling back to local SQLite for development.")

    # Production must have an explicit durable database URL.
    if IS_PRODUCTION and (not MYSQL_USER or not MYSQL_PASSWORD):
        raise RuntimeError("MYSQL_USER and MYSQL_PASSWORD must be configured in production.")
    if not MYSQL_PASSWORD and not IS_PRODUCTION:
        logger.warning("MYSQL_PASSWORD is unset; local MySQL may reject the connection.")
    from sqlalchemy.engine import URL
    mysql_url = URL.create(
        "mysql+pymysql", username=MYSQL_USER, password=MYSQL_PASSWORD,
        host=MYSQL_HOST, port=int(MYSQL_PORT), database=MYSQL_DB,
        query={"charset": "utf8mb4"}
    )
    try:
        engine = create_engine(mysql_url, pool_recycle=3600, pool_pre_ping=True)
        with engine.connect() as conn:
            logger.info(f"Successfully connected to MySQL database '{MYSQL_DB}' at {MYSQL_HOST}:{MYSQL_PORT}")
        return engine
    except Exception:
        logger.exception("Unable to connect to the configured MySQL database.")
        if IS_PRODUCTION:
            raise
        logger.info("Switching to SQLite fallback for local development only.")

        # On Vercel or other serverless containers, only /tmp is writable
        if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
            sqlite_path = os.path.join("/tmp", "parkbay.db")
        else:
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
