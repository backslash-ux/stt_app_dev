# backend/utils/dependencies.py

from fastapi import Depends, HTTPException, status, Request  # Add Request
from jose import JWTError, jwt
from backend.database import SessionLocal
from backend.models.user import User
from backend.config import settings

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: SessionLocal = Depends(get_db)) -> User:  # Add request param
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract token from cookie instead of Authorization header
    token = request.cookies.get("token")
    if not token:
        raise credentials_exception

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str: str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception

        user_id = int(user_id_str)
    except (JWTError, ValueError):
        raise credentials_exception

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise credentials_exception

    return user
