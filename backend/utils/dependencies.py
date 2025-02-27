# backend/utils/dependencies.py
from fastapi import Depends, HTTPException, status, Request
from jose import JWTError, jwt
from backend.database import SessionLocal
from backend.models.user import User
from backend.config import settings
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET_KEY = settings.SECRET_KEY
ALGORITHM = "HS256"


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_current_user(request: Request, db: SessionLocal = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    token = request.cookies.get("token")
    if not token:
        logger.info("No token found in cookies")
        raise credentials_exception
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            logger.info("Token payload missing 'sub'")
            raise credentials_exception
        user_id = int(user_id_str)
    except (JWTError, ValueError) as e:
        logger.info(f"JWT decode error: {str(e)}")
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        logger.info(f"No user found for ID: {user_id}")
        raise credentials_exception
    return user
