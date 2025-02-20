# backend/routers/auth.py

from fastapi import APIRouter, HTTPException, Depends, status, Request
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from backend.database import SessionLocal
from backend.crud.user_crud import create_user, get_user_by_email
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
from backend.utils.dependencies import get_current_user
from backend.models.user import User

router = APIRouter()

SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(
    req: RegisterRequest,
    db: Session = Depends(get_db),
    request: Request = None
):
    allowed_hosts = {"127.0.0.1", "::1"}
    if request.client.host not in allowed_hosts:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Registration is only allowed via localhost"
        )

    existing = get_user_by_email(db, req.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered"
        )

    user = create_user(db, req.email, req.password)
    return {"message": "User registered successfully", "user_id": user.id}


@router.post("/login", status_code=status.HTTP_200_OK)
def login_user(req: LoginRequest, db: Session = Depends(get_db)):
    try:
        print(f"Received login request: {req}")
        user = get_user_by_email(db, req.email)

        if not user or not pwd_context.verify(req.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )

        access_token = create_access_token({"sub": str(user.id)})
        return {"access_token": access_token, "token_type": "bearer"}

    except Exception as e:
        print(f"Login Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error"
        )


@router.get("/me", response_model=dict, status_code=status.HTTP_200_OK)
def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Returns the logged-in user's details"""
    return {"id": current_user.id, "email": current_user.email}


def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
