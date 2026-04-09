from fastapi import HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import Optional
from app.config import settings
from app.schemas.auth import RegisterIn, LoginIn, TokenOut

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )


def get_current_user_id(authorization: Optional[str] = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    payload = decode_token(token)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid token")
    return user_id


# In-memory user store for demo (replace with Supabase or DB users table in production)
_users: dict[str, dict] = {}


class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def register(self, data: RegisterIn) -> TokenOut:
        if data.email in _users:
            raise HTTPException(status_code=400, detail="Email already registered")
        import uuid
        user_id = str(uuid.uuid4())
        _users[data.email] = {
            "id": user_id,
            "email": data.email,
            "name": data.name,
            "password_hash": hash_password(data.password),
        }
        token = create_access_token({"sub": user_id, "email": data.email})
        return TokenOut(
            access_token=token,
            user_id=user_id,
            email=data.email,
            name=data.name,
        )

    async def login(self, data: LoginIn) -> TokenOut:
        user = _users.get(data.email)
        if not user or not verify_password(data.password, user["password_hash"]):
            raise HTTPException(status_code=401, detail="Invalid credentials")
        token = create_access_token({"sub": user["id"], "email": data.email})
        return TokenOut(
            access_token=token,
            user_id=user["id"],
            email=data.email,
            name=user.get("name"),
        )
