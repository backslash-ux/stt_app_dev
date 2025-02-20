# backend/crud/user_crud.py

from sqlalchemy.orm import Session
from passlib.context import CryptContext
from backend.models.user import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_user(db: Session, email: str, password: str) -> User:
    password_hash = pwd_context.hash(password)
    new_user = User(email=email, password_hash=password_hash)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def get_user_by_email(db: Session, email: str) -> User:
    return db.query(User).filter(User.email == email).first()
