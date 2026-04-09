from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db import get_db
from app.schemas.auth import RegisterIn, LoginIn, TokenOut
from app.services.auth import AuthService

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=TokenOut, status_code=status.HTTP_201_CREATED)
async def register(data: RegisterIn, db: Session = Depends(get_db)):
    service = AuthService(db)
    return await service.register(data)


@router.post("/login", response_model=TokenOut)
async def login(data: LoginIn, db: Session = Depends(get_db)):
    service = AuthService(db)
    return await service.login(data)


@router.post("/logout")
async def logout():
    return {"message": "Logged out successfully"}
