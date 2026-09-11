import time
from typing import Generator, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Construct the database URL from settings (supports Supabase & local PostgreSQL)
db_url = settings.get_database_url()

# Configure SQLAlchemy engine with resilient connection settings
engine = create_engine(
    db_url,
    pool_pre_ping=True,
    pool_recycle=300,
    connect_args={"connect_timeout": 5},
    echo=settings.SQL_ECHO,
)

# Session factory for handling database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency that provides a transactional SQLAlchemy database session.
    
    Usage in routes:
        @router.get("/items")
        def read_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def check_db_connection() -> bool:
    """Safe boolean check to verify if the configured database is reachable."""
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


def test_db_connectivity() -> Dict[str, Any]:
    """Detailed and safe connectivity test for diagnostics and health reporting.
    
    Guarantees no credentials or sensitive URLs are leaked.
    """
    start_time = time.perf_counter()
    target = settings.get_masked_database_target()
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1")).scalar()
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            return {
                "connected": result == 1,
                "target": target,
                "latency_ms": latency_ms,
                "error": None,
            }
    except Exception as e:
        latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
        # Clean exception string to prevent any password leakage
        error_msg = str(e).split("\n")[0]
        if "@" in error_msg:
            # Mask any connection string that might appear in driver error messages
            error_msg = "Database connection error (failed to reach database host)"
        return {
            "connected": False,
            "target": target,
            "latency_ms": latency_ms,
            "error": error_msg,
        }


if __name__ == "__main__":
    print(f"[*] Testing database connectivity to: {settings.get_masked_database_target()}...")
    status = test_db_connectivity()
    if status["connected"]:
        print(f"[OK] Database connected successfully in {status['latency_ms']}ms")
    else:
        print(f"[FAIL] Database connection failed: {status['error']} ({status['latency_ms']}ms)")
