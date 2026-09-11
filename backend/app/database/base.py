from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy ORM models.
    
    Tomorrow's problem-specific models should inherit from this Base.
    Example:
        class User(Base):
            __tablename__ = "users"
            id = Column(Integer, primary_key=True)
    """
    pass
