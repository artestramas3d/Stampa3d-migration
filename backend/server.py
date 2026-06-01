from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, UploadFile, File
from fastapi.responses import StreamingResponse
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
import os
import logging
import bcrypt
import jwt
import secrets
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
from datetime import datetime, timezone, timedelta
import io
import csv
import uuid
import re
import base64
import asyncio
import zipfile
import json
import xml.etree.ElementTree as ET
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Frontend URL for links
FRONTEND_URL = os.environ.get("FRONTEND_URL", "https://filament-profit.preview.emergentagent.com")

# SMTP Config
SMTP_HOST = os.environ.get("SMTP_HOST", "smtps.aruba.it")
SMTP_PORT = int(os.environ.get("SMTP_PORT", "465"))
SMTP_EMAIL = os.environ.get("SMTP_EMAIL", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

def send_email(to_email: str, subject: str, body: str, link: str = ""):
    """Send email via SMTP. Falls back to logging if SMTP not configured."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.info("=== EMAIL SIMULATA (SMTP non configurato) ===")
        logger.info(f"A: {to_email} | Oggetto: {subject}")
        if link:
            logger.info(f"Link: {link}")
        return

    try:
        html_body = f"""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Artes&Tramas - Calcolatore</h2>
            <p style="color: #555; font-size: 15px; line-height: 1.6;">{body}</p>
            {f'<p style="margin: 20px 0;"><a href="{link}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Clicca qui</a></p>' if link else ''}
            {f'<p style="color: #999; font-size: 12px;">Oppure copia questo link: {link}</p>' if link else ''}
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 11px;">Artes&Tramas 3D - Email automatica, non rispondere.</p>
        </div>
        """
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        logger.info(f"Email inviata a {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Errore invio email a {to_email}: {e}")

def send_html_email(to_email: str, subject: str, html_content: str):
    """Send email with custom HTML body via SMTP."""
    if not SMTP_EMAIL or not SMTP_PASSWORD:
        logger.info("=== EMAIL SIMULATA (SMTP non configurato) ===")
        logger.info(f"A: {to_email} | Oggetto: {subject}")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["From"] = SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(subject, "plain"))
        msg.attach(MIMEText(html_content, "html"))
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT) as server:
            server.login(SMTP_EMAIL, SMTP_PASSWORD)
            server.sendmail(SMTP_EMAIL, to_email, msg.as_string())
        logger.info(f"Email HTML inviata a {to_email}: {subject}")
    except Exception as e:
        logger.error(f"Errore invio email HTML a {to_email}: {e}")

def send_welcome_email(to_email: str, user_name: str):
    """Send welcome email explaining all app features with guide link."""
    name = user_name or "Utente"
    guide_url = f"{FRONTEND_URL}/guide"
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background: #f9f9f9;">
      <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 30px 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Benvenuto in Artes&Tramas!</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 15px;">Il tuo calcolatore costi stampa 3D</p>
      </div>
      <div style="padding: 24px; background: white;">
        <p style="color: #333; font-size: 16px; line-height: 1.6;">Ciao <strong>{name}</strong>,</p>
        <p style="color: #555; font-size: 15px; line-height: 1.6;">
          La tua email è stata verificata con successo! Ecco tutto quello che puoi fare con il calcolatore:
        </p>

        <div style="margin: 20px 0; padding: 16px; background: #fff7ed; border-left: 4px solid #f97316; border-radius: 4px;">
          <h3 style="color: #ea580c; margin: 0 0 12px; font-size: 16px;">Le Funzionalità</h3>

          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Dashboard</strong> — Panoramica completa: fatturato, profitti, trend mensili, scorte basse e prodotti più venduti.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Gestione Filamenti</strong> — Registra tutte le tue bobine con materiale, colore, brand, peso e prezzo. Avviso automatico quando le scorte scendono sotto i 200g.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Gestione Accessori</strong> — Tieni traccia di gancetti, magneti, packaging e altri materiali con costi unitari e quantità in stock.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Calcolatore Costi</strong> — Il cuore dell'app! Calcola il costo esatto di ogni stampa considerando: filamento (anche multicolore), elettricità, ammortamento stampante, accessori, tempo di design e margine di profitto. Imposta un prezzo manuale o lascia calcolare al sistema.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Importa .3mf</strong> — Importa direttamente i file .3mf da Bambu Studio, OrcaSlicer o Creality Print per compilare automaticamente tempo e grammi di filamento.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Registro Vendite</strong> — Salva ogni vendita con tutti i dettagli. Segna se è stata pagata o meno. Esporta tutto in CSV.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Acquisti</strong> — Registra gli acquisti di materiale. I filamenti vengono aggiornati automaticamente in magazzino.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Impostazioni</strong> — Gestisci le tue stampanti con costo, vita stimata, potenza e costo elettricità per calcoli precisi.
          </p>
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Profilo</strong> — Cambia nome, lingua (IT/EN/ES/FR) e password.
          </p>
        </div>

        <!-- Guide section -->
        <div style="margin: 20px 0; padding: 16px; background: #f0fdf4; border-left: 4px solid #22c55e; border-radius: 4px;">
          <h3 style="color: #16a34a; margin: 0 0 8px; font-size: 16px;">Guida Completa</h3>
          <p style="color: #555; font-size: 14px; line-height: 1.5; margin: 0 0 12px;">
            Abbiamo preparato una guida dettagliata con istruzioni passo-passo per ogni funzionalità. Puoi anche stamparla!
          </p>
          <a href="{guide_url}" style="background-color: #22c55e; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block; font-size: 14px; font-weight: bold;">Leggi la Guida</a>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="{FRONTEND_URL}" style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Inizia ad usare il Calcolatore</a>
        </div>

        <div style="margin: 20px 0; padding: 12px 16px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px;">
          <p style="color: #555; font-size: 13px; line-height: 1.5; margin: 0;">
            <strong>Consiglio per iniziare:</strong> Aggiungi prima le tue stampanti nelle Impostazioni, poi i filamenti che hai in magazzino. Dopo potrai usare il Calcolatore per avere il costo preciso di ogni stampa!
          </p>
        </div>
      </div>
      <div style="padding: 16px 24px; background: #f3f4f6; text-align: center;">
        <p style="color: #999; font-size: 11px; margin: 0;">Artes&Tramas 3D — Email automatica, non rispondere.</p>
      </div>
    </div>
    """
    send_html_email(to_email, "Benvenuto in Artes&Tramas! - Guida alle Funzionalità", html)



# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get("JWT_SECRET", secrets.token_hex(32))
JWT_ALGORITHM = "HS256"

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Password Hashing
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

# JWT Token Management
def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(minutes=60), "type": "access"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "refresh"}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Non autenticato")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Tipo token non valido")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="Utente non trovato")
        return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", ""), "is_admin": user.get("is_admin", False), "email_verified": user.get("email_verified", True)}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token scaduto")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token non valido")

# Pydantic Models
class UserRegister(BaseModel):
    email: str
    password: str
    name: str = ""

class UserLogin(BaseModel):
    email: str
    password: str

class FilamentCreate(BaseModel):
    material_type: str
    color: str
    brand: str
    spool_weight_g: float
    spool_price: float
    color_hex: str = "#FFFFFF"
    color_hex2: str = ""
    notes: str = ""
    remaining_grams: Optional[float] = None  # If not provided, defaults to spool_weight_g

class FilamentUpdate(BaseModel):
    material_type: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    spool_weight_g: Optional[float] = None
    spool_price: Optional[float] = None
    color_hex: Optional[str] = None
    color_hex2: Optional[str] = None
    notes: Optional[str] = None
    remaining_grams: Optional[float] = None

class FixedCostsCreate(BaseModel):
    printer_name: str
    printer_cost: float
    estimated_life_hours: float
    electricity_cost_kwh: float
    average_power_watts: float

class FixedCostsUpdate(BaseModel):
    printer_name: Optional[str] = None
    printer_cost: Optional[float] = None
    estimated_life_hours: Optional[float] = None
    electricity_cost_kwh: Optional[float] = None
    average_power_watts: Optional[float] = None

class PurchaseCreate(BaseModel):
    date: str
    material_type: str
    brand: str
    color: str
    color_hex: str = "#FFFFFF"
    color_hex2: str = ""
    quantity_spools: int
    price_total: float
    grams_total: float
    notes: str = ""
    # Filament integration
    filament_id: Optional[str] = None  # Link to existing filament
    create_filament: bool = True  # Auto-create or update filament

class AccessoryCreate(BaseModel):
    name: str
    category: str  # gancetto, magnete, packaging, altro
    unit_cost: float
    stock_quantity: int = 0
    notes: str = ""

class AccessoryUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit_cost: Optional[float] = None
    stock_quantity: Optional[int] = None
    notes: Optional[str] = None

class AccessoryUsage(BaseModel):
    accessory_id: str
    quantity: int

class FilamentUsage(BaseModel):
    filament_id: str
    grams_used: float

class PrintCalculationCreate(BaseModel):
    filaments: List[FilamentUsage] = []  # For multicolor
    filament_id: Optional[str] = None  # Legacy single filament
    grams_used: Optional[float] = None  # Legacy
    print_time_hours: float
    printer_id: str
    labor_hours: float = 0
    design_hours: float = 0
    margin_percent: float = 30
    manual_price: Optional[float] = None  # Manual sale price override
    quantity: int = 1  # Number of products in this print
    product_name: str = ""
    accessories: List[AccessoryUsage] = []

class SaleCreate(BaseModel):
    date: str
    product_name: str
    filaments: List[FilamentUsage] = []  # For multicolor
    filament_id: Optional[str] = None  # Legacy
    grams_used: Optional[float] = None  # Legacy
    print_time_hours: float
    printer_id: str
    sale_price: float
    labor_hours: float = 0
    design_hours: float = 0
    quantity: int = 1
    accessories: List[AccessoryUsage] = []
    client_id: Optional[str] = None
    shipping_cost: float = 0

# Template for saving print configurations
class PrintTemplateCreate(BaseModel):
    name: str
    filaments: List[FilamentUsage]
    printer_id: str
    print_time_hours: float
    labor_hours: float = 0
    design_hours: float = 0
    margin_percent: float = 30
    accessories: List[AccessoryUsage] = []

# Auth Endpoints
@api_router.post("/auth/register")
async def register(user: UserRegister, response: Response):
    email = user.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    hashed = hash_password(user.password)
    verification_token = str(uuid.uuid4())
    result = await db.users.insert_one({
        "email": email,
        "password_hash": hashed,
        "name": user.name,
        "is_admin": False,
        "email_verified": False,
        "verification_token": verification_token,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user_id = str(result.inserted_id)
    
    # Send verification email (simulated)
    verify_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    send_email(
        to_email=email,
        subject="Conferma la tua email - FilamentProfit",
        body=f"Ciao {user.name}, clicca sul link per verificare la tua email.",
        link=verify_link
    )
    
    # Store email log for admin visibility
    await db.email_logs.insert_one({
        "to": email,
        "subject": "Conferma email",
        "link": verify_link,
        "type": "verification",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": user.name, "is_admin": False, "email_verified": False}

@api_router.post("/auth/login")
async def login(user: UserLogin, response: Response):
    email = user.email.lower().strip()
    db_user = await db.users.find_one({"email": email})
    if not db_user or not verify_password(user.password, db_user["password_hash"]):
        raise HTTPException(status_code=401, detail="Credenziali non valide")
    user_id = str(db_user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    await db.users.update_one({"_id": db_user["_id"]}, {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}})
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": db_user.get("name", ""), "is_admin": db_user.get("is_admin", False), "email_verified": db_user.get("email_verified", True)}

@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Disconnesso"}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

# Filaments CRUD
@api_router.get("/filaments")
async def get_filaments(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.filaments.find({"user_id": current_user["id"]}):
        remaining = doc.get("remaining_grams")
        if remaining is None:
            remaining = doc.get("spool_weight_g", 0)
        result.append({
            "id": str(doc["_id"]),
            "material_type": doc.get("material_type", ""),
            "color": doc.get("color", ""),
            "brand": doc.get("brand", ""),
            "spool_weight_g": doc.get("spool_weight_g", 0),
            "spool_price": doc.get("spool_price", 0),
            "cost_per_gram": doc.get("cost_per_gram", 0),
            "color_hex": doc.get("color_hex", "#FFFFFF"),
            "color_hex2": doc.get("color_hex2", ""),
            "notes": doc.get("notes", ""),
            "remaining_grams": remaining,
            "low_stock": remaining < 200
        })
    return result

@api_router.post("/filaments")
async def create_filament(filament: FilamentCreate, current_user: dict = Depends(get_current_user)):
    cost_per_gram = filament.spool_price / filament.spool_weight_g if filament.spool_weight_g > 0 else 0
    remaining = filament.remaining_grams if filament.remaining_grams is not None else filament.spool_weight_g
    doc = {
        "user_id": current_user["id"],
        "material_type": filament.material_type,
        "color": filament.color,
        "brand": filament.brand,
        "spool_weight_g": filament.spool_weight_g,
        "spool_price": filament.spool_price,
        "cost_per_gram": cost_per_gram,
        "color_hex": filament.color_hex,
        "color_hex2": filament.color_hex2,
        "notes": filament.notes,
        "remaining_grams": remaining,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.filaments.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["low_stock"] = remaining < 200
    doc.pop("_id", None)
    return doc

@api_router.put("/filaments/{filament_id}")
async def update_filament(filament_id: str, filament: FilamentUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in filament.model_dump().items() if v is not None}
    if "spool_price" in update_data or "spool_weight_g" in update_data:
        existing = await db.filaments.find_one({"_id": ObjectId(filament_id), "user_id": current_user["id"]})
        if existing:
            weight = update_data.get("spool_weight_g", existing.get("spool_weight_g", 1))
            price = update_data.get("spool_price", existing.get("spool_price", 0))
            update_data["cost_per_gram"] = price / weight if weight > 0 else 0
    await db.filaments.update_one({"_id": ObjectId(filament_id), "user_id": current_user["id"]}, {"$set": update_data})
    return {"message": "Filamento aggiornato"}

@api_router.delete("/filaments/{filament_id}")
async def delete_filament(filament_id: str, current_user: dict = Depends(get_current_user)):
    await db.filaments.delete_one({"_id": ObjectId(filament_id), "user_id": current_user["id"]})
    return {"message": "Filamento eliminato"}

# Fixed Costs (Printers) CRUD
@api_router.get("/printers")
async def get_printers(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.printers.find({"user_id": current_user["id"]}):
        depreciation = doc.get("printer_cost", 0) / doc.get("estimated_life_hours", 1) if doc.get("estimated_life_hours", 0) > 0 else 0
        electricity_per_hour = (doc.get("average_power_watts", 0) / 1000) * doc.get("electricity_cost_kwh", 0)
        result.append({
            "id": str(doc["_id"]),
            "printer_name": doc.get("printer_name", ""),
            "printer_cost": doc.get("printer_cost", 0),
            "estimated_life_hours": doc.get("estimated_life_hours", 0),
            "electricity_cost_kwh": doc.get("electricity_cost_kwh", 0),
            "average_power_watts": doc.get("average_power_watts", 0),
            "depreciation_per_hour": depreciation,
            "electricity_cost_per_hour": electricity_per_hour
        })
    return result

@api_router.post("/printers")
async def create_printer(printer: FixedCostsCreate, current_user: dict = Depends(get_current_user)):
    depreciation = printer.printer_cost / printer.estimated_life_hours if printer.estimated_life_hours > 0 else 0
    electricity_per_hour = (printer.average_power_watts / 1000) * printer.electricity_cost_kwh
    doc = {
        "user_id": current_user["id"],
        "printer_name": printer.printer_name,
        "printer_cost": printer.printer_cost,
        "estimated_life_hours": printer.estimated_life_hours,
        "electricity_cost_kwh": printer.electricity_cost_kwh,
        "average_power_watts": printer.average_power_watts,
        "depreciation_per_hour": depreciation,
        "electricity_cost_per_hour": electricity_per_hour,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.printers.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@api_router.put("/printers/{printer_id}")
async def update_printer(printer_id: str, printer: FixedCostsUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in printer.model_dump().items() if v is not None}
    existing = await db.printers.find_one({"_id": ObjectId(printer_id), "user_id": current_user["id"]})
    if existing:
        cost = update_data.get("printer_cost", existing.get("printer_cost", 0))
        hours = update_data.get("estimated_life_hours", existing.get("estimated_life_hours", 1))
        watts = update_data.get("average_power_watts", existing.get("average_power_watts", 0))
        kwh = update_data.get("electricity_cost_kwh", existing.get("electricity_cost_kwh", 0))
        update_data["depreciation_per_hour"] = cost / hours if hours > 0 else 0
        update_data["electricity_cost_per_hour"] = (watts / 1000) * kwh
    await db.printers.update_one({"_id": ObjectId(printer_id), "user_id": current_user["id"]}, {"$set": update_data})
    return {"message": "Stampante aggiornata"}

@api_router.delete("/printers/{printer_id}")
async def delete_printer(printer_id: str, current_user: dict = Depends(get_current_user)):
    await db.printers.delete_one({"_id": ObjectId(printer_id), "user_id": current_user["id"]})
    return {"message": "Stampante eliminata"}

# Purchases CRUD
@api_router.get("/purchases")
async def get_purchases(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.purchases.find({"user_id": current_user["id"]}).sort("date", -1):
        result.append({
            "id": str(doc["_id"]),
            "date": doc.get("date", ""),
            "material_type": doc.get("material_type", ""),
            "brand": doc.get("brand", ""),
            "color": doc.get("color", ""),
            "quantity_spools": doc.get("quantity_spools", 0),
            "price_total": doc.get("price_total", 0),
            "grams_total": doc.get("grams_total", 0),
            "cost_per_gram": doc.get("cost_per_gram", 0),
            "notes": doc.get("notes", "")
        })
    return result

@api_router.post("/purchases")
async def create_purchase(purchase: PurchaseCreate, current_user: dict = Depends(get_current_user)):
    cost_per_gram = purchase.price_total / purchase.grams_total if purchase.grams_total > 0 else 0
    
    filament_id = None
    
    # Handle filament creation/update
    if purchase.create_filament:
        if purchase.filament_id:
            # Update existing filament - add grams
            await db.filaments.update_one(
                {"_id": ObjectId(purchase.filament_id), "user_id": current_user["id"]},
                {"$inc": {"remaining_grams": purchase.grams_total}}
            )
            filament_id = purchase.filament_id
        else:
            # Check if filament with same material/brand/color exists
            existing = await db.filaments.find_one({
                "user_id": current_user["id"],
                "material_type": purchase.material_type,
                "brand": purchase.brand,
                "color": purchase.color
            })
            
            if existing:
                # Update existing filament - add grams
                await db.filaments.update_one(
                    {"_id": existing["_id"]},
                    {"$inc": {"remaining_grams": purchase.grams_total}}
                )
                filament_id = str(existing["_id"])
            else:
                # Create new filament
                spool_weight = purchase.grams_total / purchase.quantity_spools if purchase.quantity_spools > 0 else purchase.grams_total
                spool_price = purchase.price_total / purchase.quantity_spools if purchase.quantity_spools > 0 else purchase.price_total
                
                filament_doc = {
                    "user_id": current_user["id"],
                    "material_type": purchase.material_type,
                    "color": purchase.color,
                    "brand": purchase.brand,
                    "spool_weight_g": spool_weight,
                    "spool_price": spool_price,
                    "cost_per_gram": cost_per_gram,
                    "color_hex": purchase.color_hex,
                    "color_hex2": purchase.color_hex2,
                    "notes": f"Creato da acquisto del {purchase.date}",
                    "remaining_grams": purchase.grams_total,
                    "created_at": datetime.now(timezone.utc).isoformat()
                }
                filament_result = await db.filaments.insert_one(filament_doc)
                filament_id = str(filament_result.inserted_id)
    
    doc = {
        "user_id": current_user["id"],
        "date": purchase.date,
        "material_type": purchase.material_type,
        "brand": purchase.brand,
        "color": purchase.color,
        "quantity_spools": purchase.quantity_spools,
        "price_total": purchase.price_total,
        "grams_total": purchase.grams_total,
        "cost_per_gram": cost_per_gram,
        "notes": purchase.notes,
        "filament_id": filament_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.purchases.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@api_router.delete("/purchases/{purchase_id}")
async def delete_purchase(purchase_id: str, current_user: dict = Depends(get_current_user)):
    await db.purchases.delete_one({"_id": ObjectId(purchase_id), "user_id": current_user["id"]})
    return {"message": "Acquisto eliminato"}

# Accessories CRUD
@api_router.get("/accessories")
async def get_accessories(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.accessories.find({"user_id": current_user["id"]}):
        result.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "category": doc.get("category", ""),
            "unit_cost": doc.get("unit_cost", 0),
            "stock_quantity": doc.get("stock_quantity", 0),
            "notes": doc.get("notes", "")
        })
    return result

@api_router.post("/accessories")
async def create_accessory(accessory: AccessoryCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "user_id": current_user["id"],
        "name": accessory.name,
        "category": accessory.category,
        "unit_cost": accessory.unit_cost,
        "stock_quantity": accessory.stock_quantity,
        "notes": accessory.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.accessories.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@api_router.put("/accessories/{accessory_id}")
async def update_accessory(accessory_id: str, accessory: AccessoryUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in accessory.model_dump().items() if v is not None}
    await db.accessories.update_one({"_id": ObjectId(accessory_id), "user_id": current_user["id"]}, {"$set": update_data})
    return {"message": "Accessorio aggiornato"}

@api_router.delete("/accessories/{accessory_id}")
async def delete_accessory(accessory_id: str, current_user: dict = Depends(get_current_user)):
    await db.accessories.delete_one({"_id": ObjectId(accessory_id), "user_id": current_user["id"]})
    return {"message": "Accessorio eliminato"}

# ==== Categorie Accessori personalizzabili ====
DEFAULT_ACC_CATEGORIES = ["gancetto", "magnete", "packaging", "altro"]

class AccessoryCategoryCreate(BaseModel):
    name: str

@api_router.get("/accessory-categories")
async def get_accessory_categories(current_user: dict = Depends(get_current_user)):
    """Restituisce le categorie accessori dell'utente. Se vuoto, restituisce i default."""
    cats = []
    async for doc in db.accessory_categories.find({"user_id": current_user["id"]}).sort("name", 1):
        cats.append(doc.get("name", ""))
    return cats or DEFAULT_ACC_CATEGORIES

@api_router.post("/accessory-categories")
async def add_accessory_category(cat: AccessoryCategoryCreate, current_user: dict = Depends(get_current_user)):
    name = cat.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Nome non valido")
    # Se l'utente non ha ancora alcuna categoria, copia i default + la nuova
    exists = await db.accessory_categories.count_documents({"user_id": current_user["id"]})
    if exists == 0:
        for d in DEFAULT_ACC_CATEGORIES:
            await db.accessory_categories.insert_one({"user_id": current_user["id"], "name": d})
    # Evita duplicati
    dup = await db.accessory_categories.find_one({"user_id": current_user["id"], "name": name})
    if not dup:
        await db.accessory_categories.insert_one({"user_id": current_user["id"], "name": name})
    return {"message": "Categoria aggiunta", "name": name}

@api_router.delete("/accessory-categories/{name}")
async def delete_accessory_category(name: str, current_user: dict = Depends(get_current_user)):
    # Se utente non ha mai personalizzato, materializza i default per poter cancellare
    exists = await db.accessory_categories.count_documents({"user_id": current_user["id"]})
    if exists == 0:
        for d in DEFAULT_ACC_CATEGORIES:
            await db.accessory_categories.insert_one({"user_id": current_user["id"], "name": d})
    await db.accessory_categories.delete_one({"user_id": current_user["id"], "name": name})
    return {"message": "Categoria rimossa"}

# Print Calculator
@api_router.post("/calculate")
async def calculate_print(calc: PrintCalculationCreate, current_user: dict = Depends(get_current_user)):
    printer = await db.printers.find_one({"_id": ObjectId(calc.printer_id), "user_id": current_user["id"]})
    if not printer:
        raise HTTPException(status_code=404, detail="Stampante non trovata")
    
    # Handle multicolor filaments or legacy single filament
    filament_list = calc.filaments if calc.filaments else []
    if not filament_list and calc.filament_id and calc.grams_used:
        filament_list = [FilamentUsage(filament_id=calc.filament_id, grams_used=calc.grams_used)]
    
    if not filament_list:
        raise HTTPException(status_code=400, detail="Nessun filamento selezionato")
    
    # Calculate material cost for all filaments
    material_cost = 0
    filaments_details = []
    total_grams = 0
    
    for f_usage in filament_list:
        filament = await db.filaments.find_one({"_id": ObjectId(f_usage.filament_id), "user_id": current_user["id"]})
        if filament:
            cost = f_usage.grams_used * filament.get("cost_per_gram", 0)
            material_cost += cost
            total_grams += f_usage.grams_used
            filaments_details.append({
                "filament_id": f_usage.filament_id,
                "material_type": filament.get("material_type", ""),
                "color": filament.get("color", ""),
                "color_hex": filament.get("color_hex", "#FFFFFF"),
                "color_hex2": filament.get("color_hex2", ""),
                "grams_used": f_usage.grams_used,
                "cost_per_gram": filament.get("cost_per_gram", 0),
                "total": round(cost, 2)
            })
    
    electricity_cost = calc.print_time_hours * printer.get("electricity_cost_per_hour", 0)
    depreciation_cost = calc.print_time_hours * printer.get("depreciation_per_hour", 0)
    
    # Calculate accessories cost
    accessories_cost = 0
    accessories_details = []
    for acc_usage in calc.accessories:
        acc = await db.accessories.find_one({"_id": ObjectId(acc_usage.accessory_id), "user_id": current_user["id"]})
        if acc:
            cost = acc.get("unit_cost", 0) * acc_usage.quantity
            accessories_cost += cost
            accessories_details.append({
                "name": acc.get("name", ""),
                "quantity": acc_usage.quantity,
                "unit_cost": acc.get("unit_cost", 0),
                "total": cost
            })
    
    production_cost = material_cost + electricity_cost + depreciation_cost + accessories_cost
    labor_cost = calc.labor_hours * 15  # 15€/hour labor
    design_cost = calc.design_hours * 20  # 20€/hour design
    total_cost = production_cost + labor_cost + design_cost
    
    # Calculate per-unit cost if quantity > 1
    quantity = max(1, calc.quantity)
    cost_per_unit = total_cost / quantity
    
    # Use manual price or calculate from margin
    if calc.manual_price is not None and calc.manual_price > 0:
        sale_price_per_unit = calc.manual_price
        sale_price_total = calc.manual_price * quantity
        margin_percent = ((sale_price_per_unit - cost_per_unit) / cost_per_unit * 100) if cost_per_unit > 0 else 0
    else:
        sale_price_per_unit = cost_per_unit * (1 + calc.margin_percent / 100)
        sale_price_total = sale_price_per_unit * quantity
        margin_percent = calc.margin_percent
    
    net_profit_per_unit = sale_price_per_unit - cost_per_unit
    net_profit_total = net_profit_per_unit * quantity
    
    return {
        "material_cost": round(material_cost, 2),
        "filaments_details": filaments_details,
        "total_grams": round(total_grams, 2),
        "electricity_cost": round(electricity_cost, 2),
        "depreciation_cost": round(depreciation_cost, 2),
        "accessories_cost": round(accessories_cost, 2),
        "accessories_details": accessories_details,
        "production_cost": round(production_cost, 2),
        "labor_cost": round(labor_cost, 2),
        "design_cost": round(design_cost, 2),
        "total_cost": round(total_cost, 2),
        "quantity": quantity,
        "cost_per_unit": round(cost_per_unit, 2),
        "sale_price_per_unit": round(sale_price_per_unit, 2),
        "sale_price_total": round(sale_price_total, 2),
        "net_profit_per_unit": round(net_profit_per_unit, 2),
        "net_profit_total": round(net_profit_total, 2),
        "margin_percent": round(margin_percent, 1),
        # Legacy fields for compatibility
        "sale_price": round(sale_price_total, 2),
        "net_profit": round(net_profit_total, 2)
    }

# Sales CRUD
@api_router.get("/sales")
async def get_sales(current_user: dict = Depends(get_current_user)):
    # Pre-load clients map per nome
    clients_map = {}
    async for c in db.clients.find({"user_id": current_user["id"]}):
        clients_map[str(c["_id"])] = c.get("name", "")
    result = []
    async for doc in db.sales.find({"user_id": current_user["id"]}).sort("date", -1):
        cid = doc.get("client_id", "") or ""
        result.append({
            "id": str(doc["_id"]),
            "date": doc.get("date", ""),
            "product_name": doc.get("product_name", ""),
            "material_type": doc.get("material_type", ""),
            "grams_used": doc.get("grams_used", 0),
            "print_time_hours": doc.get("print_time_hours", 0),
            "filament_cost": doc.get("filament_cost", 0),
            "electricity_cost": doc.get("electricity_cost", 0),
            "depreciation_cost": doc.get("depreciation_cost", 0),
            "total_cost": doc.get("total_cost", 0),
            "sale_price": doc.get("sale_price", 0),
            "net_profit": doc.get("net_profit", 0),
            "quantity": doc.get("quantity", 1),
            "printer_id": doc.get("printer_id", ""),
            "filaments": doc.get("filaments", []),
            "accessories": doc.get("accessories", []),
            "labor_hours": doc.get("labor_hours", 0),
            "design_hours": doc.get("design_hours", 0),
            "paid": doc.get("paid", False),
            "batch_id": doc.get("batch_id"),
            "batch_index": doc.get("batch_index"),
            "batch_total": doc.get("batch_total"),
            "client_id": cid,
            "client_name": clients_map.get(cid, ""),
            "shipping_cost": doc.get("shipping_cost", 0)
        })
    return result

# Update sale payment status
class UpdatePaidRequest(BaseModel):
    paid: bool

@api_router.patch("/sales/{sale_id}/paid")
async def update_sale_paid(sale_id: str, request: UpdatePaidRequest, current_user: dict = Depends(get_current_user)):
    # First check if sale exists
    sale = await db.sales.find_one({"_id": ObjectId(sale_id), "user_id": current_user["id"]})
    if not sale:
        raise HTTPException(status_code=404, detail="Vendita non trovata")
    
    await db.sales.update_one(
        {"_id": ObjectId(sale_id), "user_id": current_user["id"]},
        {"$set": {"paid": request.paid}}
    )
    return {"message": "Stato pagamento aggiornato", "paid": request.paid}

# Update sale price/details
class UpdateSaleRequest(BaseModel):
    sale_price: Optional[float] = None
    product_name: Optional[str] = None
    client_id: Optional[str] = None
    accessories: Optional[List[AccessoryUsage]] = None
    shipping_cost: Optional[float] = None

@api_router.patch("/sales/{sale_id}")
async def update_sale(sale_id: str, request: UpdateSaleRequest, current_user: dict = Depends(get_current_user)):
    sale = await db.sales.find_one({"_id": ObjectId(sale_id), "user_id": current_user["id"]})
    if not sale:
        raise HTTPException(status_code=404, detail="Vendita non trovata")

    update_fields = {}
    if request.product_name is not None:
        update_fields["product_name"] = request.product_name
    if request.client_id is not None:
        update_fields["client_id"] = request.client_id

    # Ricalcola accessory_cost se accessori cambiati
    new_accessory_cost = None
    if request.accessories is not None:
        # Restore old accessory stock first
        for usage in sale.get("accessories", []):
            if usage.get("accessory_id"):
                try:
                    await db.accessories.update_one(
                        {"_id": ObjectId(usage["accessory_id"]), "user_id": current_user["id"]},
                        {"$inc": {"stock_quantity": usage.get("quantity", 0)}}
                    )
                except Exception:
                    pass
        # Charge new stock and compute cost
        accessory_cost = 0
        new_acc_list = []
        for usage in request.accessories:
            acc = await db.accessories.find_one({"_id": ObjectId(usage.accessory_id), "user_id": current_user["id"]})
            if not acc:
                continue
            accessory_cost += acc.get("unit_cost", 0) * usage.quantity
            try:
                await db.accessories.update_one(
                    {"_id": ObjectId(usage.accessory_id), "user_id": current_user["id"]},
                    {"$inc": {"stock_quantity": -usage.quantity}}
                )
            except Exception:
                pass
            new_acc_list.append({
                "accessory_id": usage.accessory_id,
                "accessory_name": acc.get("name", ""),
                "category": acc.get("category", ""),
                "quantity": usage.quantity,
                "unit_cost": acc.get("unit_cost", 0),
                "total_cost": round(acc.get("unit_cost", 0) * usage.quantity, 2)
            })
        update_fields["accessories"] = new_acc_list
        new_accessory_cost = round(accessory_cost, 2)
        update_fields["accessory_cost"] = new_accessory_cost

    # Spese di spedizione
    new_shipping = sale.get("shipping_cost", 0)
    if request.shipping_cost is not None:
        new_shipping = max(0.0, float(request.shipping_cost))
        update_fields["shipping_cost"] = new_shipping

    # Ricalcola total_cost e net_profit se accessori o spedizione cambiati
    base_cost = sale.get("filament_cost", 0) + sale.get("electricity_cost", 0) + sale.get("depreciation_cost", 0) + sale.get("labor_cost", 0) + sale.get("design_cost", 0)
    accessory_cost_final = new_accessory_cost if new_accessory_cost is not None else sale.get("accessory_cost", 0)
    new_total = round(base_cost + accessory_cost_final + new_shipping, 2)
    if request.accessories is not None or request.shipping_cost is not None:
        update_fields["total_cost"] = new_total

    # Sale price + ricalcolo net_profit
    sale_price = sale.get("sale_price", 0)
    if request.sale_price is not None:
        update_fields["sale_price"] = request.sale_price
        sale_price = request.sale_price
    if "sale_price" in update_fields or "total_cost" in update_fields:
        update_fields["net_profit"] = round(sale_price - new_total, 2)

    if update_fields:
        await db.sales.update_one(
            {"_id": ObjectId(sale_id), "user_id": current_user["id"]},
            {"$set": update_fields}
        )
    return {"message": "Vendita aggiornata"}

# Get recent sales for copy feature
@api_router.get("/sales/recent")
async def get_recent_sales(current_user: dict = Depends(get_current_user), limit: int = 10):
    result = []
    async for doc in db.sales.find({"user_id": current_user["id"]}).sort("created_at", -1).limit(limit):
        result.append({
            "id": str(doc["_id"]),
            "date": doc.get("date", ""),
            "product_name": doc.get("product_name", ""),
            "material_type": doc.get("material_type", ""),
            "grams_used": doc.get("grams_used", 0),
            "print_time_hours": doc.get("print_time_hours", 0),
            "sale_price": doc.get("sale_price", 0),
            "quantity": doc.get("quantity", 1),
            "printer_id": doc.get("printer_id", ""),
            "filaments": doc.get("filaments", []),
            "accessories": doc.get("accessories", []),
            "labor_hours": doc.get("labor_hours", 0),
            "design_hours": doc.get("design_hours", 0),
            "client_id": doc.get("client_id", ""),
            "client_name": doc.get("client_name", "")
        })
    return result

@api_router.post("/sales")
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_user)):
    printer = await db.printers.find_one({"_id": ObjectId(sale.printer_id), "user_id": current_user["id"]})
    if not printer:
        raise HTTPException(status_code=404, detail="Stampante non trovata")
    
    # Handle multicolor filaments or legacy single filament
    filament_list = sale.filaments if sale.filaments else []
    if not filament_list and sale.filament_id and sale.grams_used:
        filament_list = [FilamentUsage(filament_id=sale.filament_id, grams_used=sale.grams_used)]
    
    if not filament_list:
        raise HTTPException(status_code=400, detail="Nessun filamento selezionato")
    
    # Calculate material cost and decrement stock for all filaments
    material_cost = 0
    total_grams = 0
    material_types = []
    
    for f_usage in filament_list:
        filament = await db.filaments.find_one({"_id": ObjectId(f_usage.filament_id), "user_id": current_user["id"]})
        if filament:
            material_cost += f_usage.grams_used * filament.get("cost_per_gram", 0)
            total_grams += f_usage.grams_used
            material_types.append(f"{filament.get('material_type', '')} {filament.get('color', '')}")
            # Decrement filament remaining grams
            await db.filaments.update_one(
                {"_id": ObjectId(f_usage.filament_id)},
                {"$inc": {"remaining_grams": -f_usage.grams_used}}
            )
    
    electricity_cost = sale.print_time_hours * printer.get("electricity_cost_per_hour", 0)
    depreciation_cost = sale.print_time_hours * printer.get("depreciation_per_hour", 0)
    labor_cost = sale.labor_hours * 15
    design_cost = sale.design_hours * 20
    
    # Calculate accessories cost
    accessories_cost = 0
    for acc_usage in sale.accessories:
        acc = await db.accessories.find_one({"_id": ObjectId(acc_usage.accessory_id), "user_id": current_user["id"]})
        if acc:
            accessories_cost += acc.get("unit_cost", 0) * acc_usage.quantity
            # Decrement stock
            await db.accessories.update_one(
                {"_id": ObjectId(acc_usage.accessory_id)},
                {"$inc": {"stock_quantity": -acc_usage.quantity}}
            )
    
    total_cost = material_cost + electricity_cost + depreciation_cost + labor_cost + design_cost + accessories_cost
    # Spese di spedizione: applicate al batch intero, non per unita'
    shipping_cost = max(0.0, float(getattr(sale, "shipping_cost", 0) or 0))
    total_cost += shipping_cost
    
    # Store filaments data for copy feature
    filaments_data = [{"filament_id": f.filament_id, "grams_used": f.grams_used} for f in filament_list]
    accessories_data = [{"accessory_id": a.accessory_id, "quantity": a.quantity} for a in sale.accessories]
    
    quantity = max(1, sale.quantity)
    
    # Per-unit costs
    cost_per_unit = round(total_cost / quantity, 2)
    price_per_unit = round(sale.sale_price / quantity, 2)
    profit_per_unit = round(price_per_unit - cost_per_unit, 2)
    grams_per_unit = round(total_grams / quantity, 2)
    
    # Generate a batch_id to group items from the same print run
    batch_id = datetime.now(timezone.utc).strftime("%Y%m%d%H%M%S") + "_" + str(ObjectId())[:6]
    
    # Create individual rows for each unit
    created_docs = []
    for i in range(quantity):
        doc = {
            "user_id": current_user["id"],
            "date": sale.date,
            "product_name": sale.product_name,
            "material_type": " + ".join(material_types) if material_types else "",
            "grams_used": grams_per_unit,
            "print_time_hours": sale.print_time_hours,
            "printer_id": sale.printer_id,
            "filaments": filaments_data,
            "accessories": accessories_data,
            "labor_hours": sale.labor_hours,
            "design_hours": sale.design_hours,
            "quantity": 1,
            "batch_id": batch_id,
            "batch_total": quantity,
            "batch_index": i + 1,
            "filament_cost": round(material_cost / quantity, 2),
            "electricity_cost": round(electricity_cost / quantity, 2),
            "depreciation_cost": round(depreciation_cost / quantity, 2),
            "accessories_cost": round(accessories_cost / quantity, 2),
            "total_cost": cost_per_unit,
            "sale_price": price_per_unit,
            "net_profit": profit_per_unit,
            "paid": False,
            "client_id": sale.client_id or "",
            "shipping_cost": round(shipping_cost / quantity, 2),
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        result = await db.sales.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        created_docs.append(doc)
    
    return {"items": created_docs, "count": quantity, "batch_id": batch_id}

@api_router.delete("/sales/{sale_id}")
async def delete_sale(sale_id: str, current_user: dict = Depends(get_current_user)):
    await db.sales.delete_one({"_id": ObjectId(sale_id), "user_id": current_user["id"]})
    return {"message": "Vendita eliminata"}

# Dashboard Stats
@api_router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    sales = await db.sales.find({"user_id": current_user["id"]}).to_list(10000)
    purchases = await db.purchases.find({"user_id": current_user["id"]}).to_list(10000)
    
    total_sales = sum(s.get("sale_price", 0) for s in sales)
    total_profit = sum(s.get("net_profit", 0) for s in sales)
    total_grams = sum(s.get("grams_used", 0) for s in sales)
    total_hours = sum(s.get("print_time_hours", 0) for s in sales)
    total_purchases = sum(p.get("price_total", 0) for p in purchases)
    
    avg_margin = 0
    if sales and total_sales > 0:
        avg_margin = (total_profit / total_sales) * 100
    
    # Most profitable product
    product_profits = {}
    for s in sales:
        name = s.get("product_name", "Sconosciuto")
        product_profits[name] = product_profits.get(name, 0) + s.get("net_profit", 0)
    most_profitable = max(product_profits, key=product_profits.get) if product_profits else "N/A"
    
    # Monthly data for charts
    monthly_data = {}
    for s in sales:
        month = s.get("date", "")[:7]  # YYYY-MM
        if month not in monthly_data:
            monthly_data[month] = {"revenue": 0, "profit": 0, "grams": 0}
        monthly_data[month]["revenue"] += s.get("sale_price", 0)
        monthly_data[month]["profit"] += s.get("net_profit", 0)
        monthly_data[month]["grams"] += s.get("grams_used", 0)
    
    chart_data = [{"month": k, **v} for k, v in sorted(monthly_data.items())]
    
    # Top products
    top_products = sorted(product_profits.items(), key=lambda x: x[1], reverse=True)[:5]
    
    # Low stock alerts
    filaments = await db.filaments.find({"user_id": current_user["id"]}).to_list(1000)
    low_stock_filaments = []
    for f in filaments:
        remaining = f.get("remaining_grams", f.get("spool_weight_g", 0))
        if remaining < 200:
            low_stock_filaments.append({
                "id": str(f["_id"]),
                "material_type": f.get("material_type", ""),
                "color": f.get("color", ""),
                "brand": f.get("brand", ""),
                "remaining_grams": remaining
            })
    
    # Low stock accessories
    accessories = await db.accessories.find({"user_id": current_user["id"]}).to_list(1000)
    low_stock_accessories = [
        {"id": str(a["_id"]), "name": a.get("name", ""), "stock_quantity": a.get("stock_quantity", 0)}
        for a in accessories if a.get("stock_quantity", 0) < 10
    ]

    # Spedizioni: totale del mese corrente + media per vendita (vendite con spedizione)
    current_month = datetime.now(timezone.utc).strftime("%Y-%m")
    shipping_total_month = 0.0
    shipping_total_all = 0.0
    sales_with_shipping = 0
    sales_with_shipping_month = 0
    for s in sales:
        sc = float(s.get("shipping_cost", 0) or 0)
        if sc > 0:
            shipping_total_all += sc
            sales_with_shipping += 1
            if s.get("date", "")[:7] == current_month:
                shipping_total_month += sc
                sales_with_shipping_month += 1
    shipping_avg = round(shipping_total_all / sales_with_shipping, 2) if sales_with_shipping > 0 else 0

    return {
        "total_sales": round(total_sales, 2),
        "total_profit": round(total_profit, 2),
        "total_grams": round(total_grams, 0),
        "total_hours": round(total_hours, 1),
        "total_purchases": round(total_purchases, 2),
        "avg_margin": round(avg_margin, 1),
        "most_profitable": most_profitable,
        "sales_count": len(sales),
        "chart_data": chart_data,
        "top_products": [{"name": p[0], "profit": round(p[1], 2)} for p in top_products],
        "low_stock_filaments": low_stock_filaments,
        "low_stock_accessories": low_stock_accessories,
        "shipping_total_month": round(shipping_total_month, 2),
        "shipping_total_all": round(shipping_total_all, 2),
        "shipping_avg_per_sale": shipping_avg,
        "shipping_sales_count_month": sales_with_shipping_month
    }

# Export CSV
@api_router.get("/export/sales")
async def export_sales_csv(current_user: dict = Depends(get_current_user)):
    sales = await db.sales.find({"user_id": current_user["id"]}).sort("date", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Data", "Prodotto", "Materiale", "Grammi", "Ore Stampa", "Costo Totale", "Prezzo Vendita", "Profitto"])
    
    for s in sales:
        writer.writerow([
            s.get("date", ""),
            s.get("product_name", ""),
            s.get("material_type", ""),
            s.get("grams_used", 0),
            s.get("print_time_hours", 0),
            s.get("total_cost", 0),
            s.get("sale_price", 0),
            s.get("net_profit", 0)
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=vendite.csv"}
    )

@api_router.get("/export/purchases")
async def export_purchases_csv(current_user: dict = Depends(get_current_user)):
    purchases = await db.purchases.find({"user_id": current_user["id"]}).sort("date", -1).to_list(10000)
    
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Data", "Materiale", "Brand", "Colore", "Bobine", "Totale €", "Grammi", "€/g"])
    
    for p in purchases:
        writer.writerow([
            p.get("date", ""),
            p.get("material_type", ""),
            p.get("brand", ""),
            p.get("color", ""),
            p.get("quantity_spools", 0),
            p.get("price_total", 0),
            p.get("grams_total", 0),
            round(p.get("cost_per_gram", 0), 4)
        ])
    
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=acquisti.csv"}
    )

# Admin guard
async def require_admin(current_user: dict = Depends(get_current_user)):
    if not current_user.get("is_admin"):
        raise HTTPException(status_code=403, detail="Accesso non autorizzato")
    return current_user

# Profile endpoints
class ProfileUpdate(BaseModel):
    name: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

@api_router.put("/auth/profile")
async def update_profile(profile: ProfileUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {}
    if profile.name is not None:
        update_data["name"] = profile.name
    if update_data:
        await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": update_data})
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user.get("name", ""),
        "is_admin": user.get("is_admin", False),
        "email_verified": user.get("email_verified", True)
    }

@api_router.post("/auth/change-password")
async def change_password(req: ChangePasswordRequest, current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user or not verify_password(req.current_password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Password attuale non corretta")
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="La nuova password deve avere almeno 6 caratteri")
    hashed = hash_password(req.new_password)
    await db.users.update_one({"_id": ObjectId(current_user["id"])}, {"$set": {"password_hash": hashed}})
    return {"message": "Password cambiata con successo"}

# Banner Models
class BannerCreate(BaseModel):
    position: str  # header, sidebar, footer, content
    name: str
    html_code: str
    is_active: bool = True
    pages: List[str] = ["app"]  # app, demo, shop

class BannerUpdate(BaseModel):
    position: Optional[str] = None
    name: Optional[str] = None
    html_code: Optional[str] = None
    is_active: Optional[bool] = None
    pages: Optional[List[str]] = None

# Banner Endpoints (Admin only)
@api_router.get("/banners")
async def get_banners(current_user: dict = Depends(require_admin)):
    result = []
    async for doc in db.banners.find().sort("created_at", -1):
        result.append({
            "id": str(doc["_id"]),
            "position": doc.get("position", ""),
            "name": doc.get("name", ""),
            "html_code": doc.get("html_code", ""),
            "is_active": doc.get("is_active", False),
            "pages": doc.get("pages", ["app"]),
            "created_at": doc.get("created_at", "")
        })
    return result

@api_router.post("/banners")
async def create_banner(banner: BannerCreate, current_user: dict = Depends(require_admin)):
    doc = {
        "position": banner.position,
        "name": banner.name,
        "html_code": banner.html_code,
        "is_active": banner.is_active,
        "pages": banner.pages or ["app"],
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.banners.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@api_router.put("/banners/{banner_id}")
async def update_banner(banner_id: str, banner: BannerUpdate, current_user: dict = Depends(require_admin)):
    update_data = {k: v for k, v in banner.model_dump().items() if v is not None}
    await db.banners.update_one({"_id": ObjectId(banner_id)}, {"$set": update_data})
    return {"message": "Banner aggiornato"}

@api_router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, current_user: dict = Depends(require_admin)):
    await db.banners.delete_one({"_id": ObjectId(banner_id)})
    return {"message": "Banner eliminato"}

# Public endpoint - active banners for app (loggato)
@api_router.get("/banners/active")
async def get_active_banners(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.banners.find({"is_active": True, "pages": {"$in": ["app"]}}):
        result.append({
            "id": str(doc["_id"]),
            "position": doc.get("position", ""),
            "html_code": doc.get("html_code", "")
        })
    return result

# Public endpoint - active banners for demo/shop (no auth)
@api_router.get("/public/banners/{page}")
async def get_public_banners(page: str):
    if page not in ("demo", "shop"):
        raise HTTPException(status_code=400, detail="Pagina non valida")
    result = []
    async for doc in db.banners.find({"is_active": True, "pages": {"$in": [page]}}):
        result.append({
            "id": str(doc["_id"]),
            "position": doc.get("position", ""),
            "html_code": doc.get("html_code", "")
        })
    return result

# Email Verification
@api_router.get("/auth/verify-email")
async def verify_email(token: str):
    user = await db.users.find_one({"verification_token": token})
    if not user:
        raise HTTPException(status_code=400, detail="Token di verifica non valido")
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"email_verified": True}, "$unset": {"verification_token": ""}}
    )
    # Send welcome email
    send_welcome_email(user["email"], user.get("name", ""))
    await db.email_logs.insert_one({
        "to": user["email"],
        "subject": "Email di benvenuto",
        "link": "",
        "type": "welcome",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Email verificata con successo"}

@api_router.post("/auth/resend-verification")
async def resend_verification(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["id"])})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    if user.get("email_verified"):
        return {"message": "Email già verificata"}
    
    verification_token = str(uuid.uuid4())
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"verification_token": verification_token}}
    )
    verify_link = f"{FRONTEND_URL}/verify-email?token={verification_token}"
    send_email(
        to_email=user["email"],
        subject="Conferma la tua email - FilamentProfit",
        body="Clicca sul link per verificare la tua email.",
        link=verify_link
    )
    await db.email_logs.insert_one({
        "to": user["email"],
        "subject": "Conferma email (reinvio)",
        "link": verify_link,
        "type": "verification",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Email di verifica reinviata"}

# Password Recovery
class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email = req.email.lower().strip()
    user = await db.users.find_one({"email": email})
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "Se l'email è registrata, riceverai un link per reimpostare la password"}
    
    reset_token = str(uuid.uuid4())
    await db.password_resets.insert_one({
        "user_id": str(user["_id"]),
        "email": email,
        "token": reset_token,
        "expires_at": (datetime.now(timezone.utc) + timedelta(hours=1)).isoformat(),
        "used": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    reset_link = f"{FRONTEND_URL}/reset-password?token={reset_token}"
    send_email(
        to_email=email,
        subject="Recupero Password - FilamentProfit",
        body="Clicca sul link per reimpostare la tua password. Il link scade tra 1 ora.",
        link=reset_link
    )
    await db.email_logs.insert_one({
        "to": email,
        "subject": "Recupero password",
        "link": reset_link,
        "type": "password_reset",
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    return {"message": "Se l'email è registrata, riceverai un link per reimpostare la password"}

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordRequest):
    reset = await db.password_resets.find_one({"token": req.token, "used": False})
    if not reset:
        raise HTTPException(status_code=400, detail="Token non valido o scaduto")
    
    expires = datetime.fromisoformat(reset["expires_at"])
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(status_code=400, detail="Token scaduto")
    
    hashed = hash_password(req.new_password)
    await db.users.update_one(
        {"_id": ObjectId(reset["user_id"])},
        {"$set": {"password_hash": hashed}}
    )
    await db.password_resets.update_one(
        {"_id": reset["_id"]},
        {"$set": {"used": True}}
    )
    return {"message": "Password reimpostata con successo"}

# ========== ADMIN PANEL ENDPOINTS ==========

# Admin - User Management
@api_router.get("/admin/users")
async def admin_get_users(current_user: dict = Depends(require_admin)):
    result = []
    async for doc in db.users.find().sort("created_at", -1):
        result.append({
            "id": str(doc["_id"]),
            "email": doc.get("email", ""),
            "name": doc.get("name", ""),
            "is_admin": doc.get("is_admin", False),
            "email_verified": doc.get("email_verified", False),
            "created_at": doc.get("created_at", ""),
            "last_login": doc.get("last_login", "")
        })
    return result

@api_router.post("/admin/verify-user/{user_id}")
async def admin_verify_user(user_id: str, current_user: dict = Depends(require_admin)):
    await db.users.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"email_verified": True}, "$unset": {"verification_token": ""}}
    )
    return {"message": "Utente verificato manualmente"}

@api_router.post("/admin/toggle-admin/{user_id}")
async def admin_toggle_admin(user_id: str, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    new_admin = not user.get("is_admin", False)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {"is_admin": new_admin}})
    return {"message": f"Admin {'attivato' if new_admin else 'disattivato'}", "is_admin": new_admin}

@api_router.delete("/admin/users/{user_id}")
async def admin_delete_user(user_id: str, current_user: dict = Depends(require_admin)):
    if user_id == current_user["id"]:
        raise HTTPException(status_code=400, detail="Non puoi eliminare te stesso")
    await db.users.delete_one({"_id": ObjectId(user_id)})
    # Clean up user data
    await db.filaments.delete_many({"user_id": user_id})
    await db.printers.delete_many({"user_id": user_id})
    await db.sales.delete_many({"user_id": user_id})
    await db.purchases.delete_many({"user_id": user_id})
    await db.accessories.delete_many({"user_id": user_id})
    return {"message": "Utente e dati eliminati"}

# Admin - View User Profile (all their data)
@api_router.get("/admin/users/{user_id}/profile")
async def admin_get_user_profile(user_id: str, current_user: dict = Depends(require_admin)):
    user = await db.users.find_one({"_id": ObjectId(user_id)})
    if not user:
        raise HTTPException(status_code=404, detail="Utente non trovato")

    # Get user stats
    filaments_count = await db.filaments.count_documents({"user_id": user_id})
    sales_count = await db.sales.count_documents({"user_id": user_id})
    purchases_count = await db.purchases.count_documents({"user_id": user_id})
    printers_count = await db.printers.count_documents({"user_id": user_id})

    # Recent sales
    recent_sales = []
    async for doc in db.sales.find({"user_id": user_id}).sort("created_at", -1).limit(10):
        recent_sales.append({
            "id": str(doc["_id"]),
            "product_name": doc.get("product_name", ""),
            "sale_price": doc.get("sale_price", 0),
            "total_cost": doc.get("total_cost", 0),
            "profit": doc.get("profit", 0),
            "is_paid": doc.get("is_paid", False),
            "created_at": doc.get("created_at", "")
        })

    # Recent purchases
    recent_purchases = []
    async for doc in db.purchases.find({"user_id": user_id}).sort("created_at", -1).limit(10):
        recent_purchases.append({
            "id": str(doc["_id"]),
            "material_type": doc.get("material_type", ""),
            "brand": doc.get("brand", ""),
            "color": doc.get("color", ""),
            "price_total": doc.get("price_total", 0),
            "grams_total": doc.get("grams_total", 0),
            "date": doc.get("date", "")
        })

    # Filaments
    filaments = []
    async for doc in db.filaments.find({"user_id": user_id}).sort("created_at", -1):
        filaments.append({
            "id": str(doc["_id"]),
            "material_type": doc.get("material_type", ""),
            "color": doc.get("color", ""),
            "brand": doc.get("brand", ""),
            "color_hex": doc.get("color_hex", "#FFFFFF"),
            "color_hex2": doc.get("color_hex2", ""),
            "remaining_grams": doc.get("remaining_grams", 0),
            "spool_price": doc.get("spool_price", 0)
        })

    return {
        "user": {
            "id": str(user["_id"]),
            "email": user.get("email", ""),
            "name": user.get("name", ""),
            "is_admin": user.get("is_admin", False),
            "email_verified": user.get("email_verified", False),
            "language": user.get("language", "it"),
            "created_at": user.get("created_at", "")
        },
        "stats": {
            "filaments": filaments_count,
            "sales": sales_count,
            "purchases": purchases_count,
            "printers": printers_count
        },
        "recent_sales": recent_sales,
        "recent_purchases": recent_purchases,
        "filaments": filaments
    }

# Admin - Email Logs
@api_router.get("/admin/email-logs")
async def admin_get_email_logs(current_user: dict = Depends(require_admin)):
    result = []
    async for doc in db.email_logs.find().sort("created_at", -1).limit(50):
        result.append({
            "id": str(doc["_id"]),
            "to": doc.get("to", ""),
            "subject": doc.get("subject", ""),
            "link": doc.get("link", ""),
            "type": doc.get("type", ""),
            "created_at": doc.get("created_at", "")
        })
    return result

# Admin - Newsletter
class NewsletterCreate(BaseModel):
    subject: str
    body: str
    is_html: bool = False
    recipient_ids: Optional[list] = None  # None or [] = all verified users
    scheduled_at: Optional[str] = None  # ISO date string, None = send immediately

@api_router.get("/admin/newsletters")
async def admin_get_newsletters(current_user: dict = Depends(require_admin)):
    result = []
    async for doc in db.newsletters.find().sort("created_at", -1):
        result.append({
            "id": str(doc["_id"]),
            "subject": doc.get("subject", ""),
            "body": doc.get("body", ""),
            "recipients_count": doc.get("recipients_count", 0),
            "status": doc.get("status", "sent"),
            "scheduled_at": doc.get("scheduled_at", ""),
            "sent_at": doc.get("sent_at", ""),
            "created_at": doc.get("created_at", "")
        })
    return result

@api_router.post("/admin/newsletters")
async def admin_create_newsletter(newsletter: NewsletterCreate, current_user: dict = Depends(require_admin)):
    now = datetime.now(timezone.utc).isoformat()

    # Determine recipients
    async def get_recipients():
        if newsletter.recipient_ids and len(newsletter.recipient_ids) > 0:
            # Targeted: specific users
            users = []
            for uid in newsletter.recipient_ids:
                try:
                    u = await db.users.find_one({"_id": ObjectId(uid)})
                    if u:
                        users.append(u["email"])
                except Exception:
                    pass
            return users
        else:
            # All verified users
            emails = []
            async for u in db.users.find({"email_verified": True}):
                emails.append(u["email"])
            async for u in db.users.find({"email_verified": {"$exists": False}}):
                emails.append(u["email"])
            return emails

    if newsletter.scheduled_at:
        doc = {
            "subject": newsletter.subject,
            "body": newsletter.body,
            "is_html": newsletter.is_html,
            "recipient_ids": newsletter.recipient_ids or [],
            "status": "scheduled",
            "scheduled_at": newsletter.scheduled_at,
            "recipients_count": 0,
            "sent_by": current_user["email"],
            "created_at": now
        }
        result = await db.newsletters.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        return doc
    else:
        recipients = await get_recipients()

        for email in recipients:
            if newsletter.is_html:
                send_html_email(to_email=email, subject=newsletter.subject, html_content=newsletter.body)
            else:
                send_email(to_email=email, subject=newsletter.subject, body=newsletter.body)

        doc = {
            "subject": newsletter.subject,
            "body": newsletter.body,
            "is_html": newsletter.is_html,
            "recipient_ids": newsletter.recipient_ids or [],
            "status": "sent",
            "recipients_count": len(recipients),
            "recipients": recipients,
            "sent_by": current_user["email"],
            "sent_at": now,
            "created_at": now
        }
        result = await db.newsletters.insert_one(doc)
        doc["id"] = str(result.inserted_id)
        doc.pop("_id", None)
        doc.pop("recipients", None)
        return doc

@api_router.delete("/admin/newsletters/{newsletter_id}")
async def admin_delete_newsletter(newsletter_id: str, current_user: dict = Depends(require_admin)):
    await db.newsletters.delete_one({"_id": ObjectId(newsletter_id)})
    return {"message": "Newsletter eliminata"}

# ========== SITE SETTINGS ==========

class SiteSettingsUpdate(BaseModel):
    brand_name: Optional[str] = None
    subtitle: Optional[str] = None
    primary_color: Optional[str] = None
    accent_color: Optional[str] = None
    head_scripts: Optional[str] = None
    body_scripts: Optional[str] = None
    demo_banner_text: Optional[str] = None
    demo_banner_enabled: Optional[bool] = None
    demo_banner_color: Optional[str] = None
    demo_banner_link: Optional[str] = None

@api_router.get("/site-settings")
async def get_site_settings(current_user: dict = Depends(get_current_user)):
    doc = await db.site_settings.find_one({"_id": "global"})
    if not doc:
        return {"brand_name": "Artes&Tramas", "subtitle": "Calcolatore", "primary_color": "#f97316", "accent_color": "#2563eb", "head_scripts": "", "body_scripts": "", "demo_banner_text": "", "demo_banner_enabled": False, "demo_banner_color": "#f97316", "demo_banner_link": ""}
    return {
        "brand_name": doc.get("brand_name", "Artes&Tramas"),
        "subtitle": doc.get("subtitle", "Calcolatore"),
        "primary_color": doc.get("primary_color", "#f97316"),
        "accent_color": doc.get("accent_color", "#2563eb"),
        "head_scripts": doc.get("head_scripts", ""),
        "body_scripts": doc.get("body_scripts", ""),
        "demo_banner_text": doc.get("demo_banner_text", ""),
        "demo_banner_enabled": doc.get("demo_banner_enabled", False),
        "demo_banner_color": doc.get("demo_banner_color", "#f97316"),
        "demo_banner_link": doc.get("demo_banner_link", ""),
    }

# Public endpoint for scripts (no auth needed)
@api_router.get("/public/site-scripts")
async def get_public_site_scripts():
    doc = await db.site_settings.find_one({"_id": "global"})
    if not doc:
        return {"head_scripts": "", "body_scripts": "", "demo_banner_text": "", "demo_banner_enabled": False, "demo_banner_color": "#f97316", "demo_banner_link": ""}
    return {
        "head_scripts": doc.get("head_scripts", ""),
        "body_scripts": doc.get("body_scripts", ""),
        "demo_banner_text": doc.get("demo_banner_text", ""),
        "demo_banner_enabled": doc.get("demo_banner_enabled", False),
        "demo_banner_color": doc.get("demo_banner_color", "#f97316"),
        "demo_banner_link": doc.get("demo_banner_link", ""),
    }

@api_router.put("/admin/site-settings")
async def update_site_settings(settings: SiteSettingsUpdate, current_user: dict = Depends(require_admin)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    if update_data:
        await db.site_settings.update_one(
            {"_id": "global"},
            {"$set": update_data},
            upsert=True
        )
    doc = await db.site_settings.find_one({"_id": "global"})
    return {
        "brand_name": doc.get("brand_name", "Artes&Tramas"),
        "subtitle": doc.get("subtitle", "Calcolatore"),
        "primary_color": doc.get("primary_color", "#f97316"),
        "accent_color": doc.get("accent_color", "#2563eb"),
        "head_scripts": doc.get("head_scripts", ""),
        "body_scripts": doc.get("body_scripts", ""),
        "demo_banner_text": doc.get("demo_banner_text", ""),
        "demo_banner_enabled": doc.get("demo_banner_enabled", False),
        "demo_banner_color": doc.get("demo_banner_color", "#f97316"),
        "demo_banner_link": doc.get("demo_banner_link", ""),
    }

# ========== BUG REPORTS ==========

class BugReportCreate(BaseModel):
    title: str
    description: str
    priority: str = "media"  # bassa, media, alta
    screenshot: Optional[str] = None  # base64 encoded image

@api_router.post("/bug-reports")
async def create_bug_report(report: BugReportCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "user_id": current_user["id"],
        "user_email": current_user["email"],
        "user_name": current_user.get("name", ""),
        "title": report.title,
        "description": report.description,
        "priority": report.priority,
        "screenshot": report.screenshot,
        "status": "aperto",
        "admin_note": "",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.bug_reports.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    doc.pop("screenshot", None)  # Don't return screenshot in list
    return doc

@api_router.get("/bug-reports")
async def get_my_bug_reports(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.bug_reports.find({"user_id": current_user["id"]}).sort("created_at", -1):
        result.append({
            "id": str(doc["_id"]),
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "priority": doc.get("priority", "media"),
            "status": doc.get("status", "aperto"),
            "admin_note": doc.get("admin_note", ""),
            "has_screenshot": bool(doc.get("screenshot")),
            "created_at": doc.get("created_at", "")
        })
    return result

@api_router.get("/admin/bug-reports")
async def admin_get_bug_reports(current_user: dict = Depends(require_admin)):
    result = []
    async for doc in db.bug_reports.find().sort("created_at", -1):
        result.append({
            "id": str(doc["_id"]),
            "user_email": doc.get("user_email", ""),
            "user_name": doc.get("user_name", ""),
            "title": doc.get("title", ""),
            "description": doc.get("description", ""),
            "priority": doc.get("priority", "media"),
            "status": doc.get("status", "aperto"),
            "admin_note": doc.get("admin_note", ""),
            "has_screenshot": bool(doc.get("screenshot")),
            "created_at": doc.get("created_at", "")
        })
    return result

@api_router.get("/admin/bug-reports/{report_id}/screenshot")
async def admin_get_screenshot(report_id: str, current_user: dict = Depends(require_admin)):
    doc = await db.bug_reports.find_one({"_id": ObjectId(report_id)})
    if not doc or not doc.get("screenshot"):
        raise HTTPException(status_code=404, detail="Screenshot non trovato")
    return {"screenshot": doc["screenshot"]}

class BugReportStatusUpdate(BaseModel):
    status: str  # aperto, in_lavorazione, risolto
    admin_note: Optional[str] = None

@api_router.put("/admin/bug-reports/{report_id}")
async def admin_update_bug_report(report_id: str, update: BugReportStatusUpdate, current_user: dict = Depends(require_admin)):
    update_data = {"status": update.status}
    if update.admin_note is not None:
        update_data["admin_note"] = update.admin_note
    await db.bug_reports.update_one({"_id": ObjectId(report_id)}, {"$set": update_data})
    return {"message": "Segnalazione aggiornata"}

# ========== PRODUCT CATALOG ==========

class ProductCreate(BaseModel):
    name: str
    description: str = ""  # Descrizione breve (card)
    description_long: str = ""  # Descrizione estesa (pagina dettaglio)
    price: float
    category: str = ""
    materials: str = ""  # Legacy stringa; nuove varianti in `material_options`
    photos: List[str] = []  # list of base64 images
    photo: Optional[str] = None  # legacy single photo
    is_public: bool = True
    # Varianti (semplici, senza prezzo extra - prezzo definito su contatto)
    color_options: List[str] = []   # es. ["Rosso", "Blu", "Nero"]
    material_options: List[str] = []  # es. ["PLA", "PETG", "ABS"]
    size_options: List[str] = []   # es. ["S", "M", "L", "XL"]
    # Personalizzazione
    is_customizable: bool = False
    custom_field_label: str = ""  # es. "Nome da incidere", "Dedica"
    show_price: bool = True  # Se False, nel pubblico esce "Scrivici per sapere il prezzo"

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    description_long: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    materials: Optional[str] = None
    photos: Optional[List[str]] = None
    photo: Optional[str] = None
    is_public: Optional[bool] = None
    color_options: Optional[List[str]] = None
    material_options: Optional[List[str]] = None
    size_options: Optional[List[str]] = None
    is_customizable: Optional[bool] = None
    custom_field_label: Optional[str] = None
    show_price: Optional[bool] = None


def _slugify(text: str) -> str:
    """Slug semplice URL-safe (no librerie esterne)"""
    import re, unicodedata
    text = unicodedata.normalize("NFKD", text or "").encode("ascii", "ignore").decode()
    text = re.sub(r"[^\w\s-]", "", text).strip().lower()
    return re.sub(r"[\s_-]+", "-", text) or "prodotto"


def _serialize_product(doc: dict, include_long: bool = True) -> dict:
    photos = doc.get("photos", [])
    if not photos and doc.get("photo"):
        photos = [doc["photo"]]
    out = {
        "id": str(doc["_id"]),
        "slug": doc.get("slug") or _slugify(doc.get("name", "")) + "-" + str(doc["_id"])[-6:],
        "name": doc.get("name", ""),
        "description": doc.get("description", ""),
        "price": doc.get("price", 0),
        "category": doc.get("category", ""),
        "materials": doc.get("materials", ""),
        "photos": photos,
        "photo": photos[0] if photos else "",
        "is_public": doc.get("is_public", True),
        "color_options": doc.get("color_options", []),
        "material_options": doc.get("material_options", []),
        "size_options": doc.get("size_options", []),
        "is_customizable": doc.get("is_customizable", False),
        "custom_field_label": doc.get("custom_field_label", ""),
        "show_price": doc.get("show_price", True),
        "created_at": doc.get("created_at", ""),
    }
    if include_long:
        out["description_long"] = doc.get("description_long", "")
    return out


@api_router.get("/products")
async def get_products(current_user: dict = Depends(get_current_user)):
    # Gli admin vedono e gestiscono TUTTI i prodotti (collaborazione tra admin).
    # Gli utenti normali vedono solo i propri.
    query = {} if current_user.get("is_admin") else {"user_id": current_user["id"]}
    result = []
    async for doc in db.products.find(query).sort("created_at", -1):
        result.append(_serialize_product(doc))
    return result

@api_router.post("/products")
async def create_product(product: ProductCreate, current_user: dict = Depends(get_current_user)):
    photos = product.photos if product.photos else ([product.photo] if product.photo else [])
    slug = _slugify(product.name)
    # Unicita' slug
    base_slug = slug
    n = 2
    while await db.products.find_one({"slug": slug}):
        slug = f"{base_slug}-{n}"
        n += 1
    doc = {
        "user_id": current_user["id"],
        "name": product.name,
        "slug": slug,
        "description": product.description,
        "description_long": product.description_long,
        "price": product.price,
        "category": product.category,
        "materials": product.materials,
        "photos": photos,
        "photo": photos[0] if photos else "",
        "is_public": product.is_public,
        "color_options": product.color_options,
        "material_options": product.material_options,
        "size_options": product.size_options,
        "is_customizable": product.is_customizable,
        "custom_field_label": product.custom_field_label,
        "show_price": product.show_price,
        "views": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.products.insert_one(doc)
    doc["_id"] = result.inserted_id
    return _serialize_product(doc)

@api_router.put("/products/{product_id}")
async def update_product(product_id: str, product: ProductUpdate, current_user: dict = Depends(get_current_user)):
    update_data = {k: v for k, v in product.model_dump().items() if v is not None}
    # Se cambia il nome, rigenera lo slug
    if "name" in update_data:
        new_slug = _slugify(update_data["name"])
        existing = await db.products.find_one({"slug": new_slug, "_id": {"$ne": ObjectId(product_id)}})
        if not existing:
            update_data["slug"] = new_slug
    # Admin puo' modificare qualunque prodotto (collaborazione), utente solo i propri
    q = {"_id": ObjectId(product_id)}
    if not current_user.get("is_admin"):
        q["user_id"] = current_user["id"]
    await db.products.update_one(q, {"$set": update_data})
    return {"message": "Prodotto aggiornato"}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    q = {"_id": ObjectId(product_id)}
    if not current_user.get("is_admin"):
        q["user_id"] = current_user["id"]
    await db.products.delete_one(q)
    return {"message": "Prodotto eliminato"}

# ========== PUBLIC ENDPOINTS (no auth) ==========

@api_router.get("/public/listino")
async def get_public_listino():
    """Public price list - no auth required"""
    settings = await db.site_settings.find_one({"_id": "global"})
    brand = settings.get("brand_name", "Artes&Tramas") if settings else "Artes&Tramas"
    primary = settings.get("primary_color", "#f97316") if settings else "#f97316"

    products = []
    async for doc in db.products.find({"is_public": True}).sort("category", 1):
        products.append(_serialize_product(doc, include_long=False))
    return {"brand_name": brand, "primary_color": primary, "products": products}


@api_router.get("/public/product/{slug}")
async def get_public_product(slug: str):
    """Public product detail by slug + increments view counter"""
    doc = await db.products.find_one({"slug": slug, "is_public": True})
    if not doc:
        # Fallback: prova ad usare l'id (per retrocompat con prodotti senza slug)
        try:
            doc = await db.products.find_one({"_id": ObjectId(slug), "is_public": True})
        except Exception:
            doc = None
    if not doc:
        raise HTTPException(status_code=404, detail="Prodotto non trovato")
    # Increment view counter (non blocca la risposta in caso di errore)
    try:
        await db.products.update_one({"_id": doc["_id"]}, {"$inc": {"views": 1}})
        today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        await db.product_views.update_one(
            {"product_id": str(doc["_id"]), "date": today},
            {"$inc": {"count": 1}},
            upsert=True
        )
    except Exception:
        pass
    settings = await db.site_settings.find_one({"_id": "global"})
    brand = settings.get("brand_name", "Artes&Tramas") if settings else "Artes&Tramas"
    primary = settings.get("primary_color", "#f97316") if settings else "#f97316"
    return {
        "brand_name": brand,
        "primary_color": primary,
        "product": _serialize_product(doc, include_long=True)
    }


class ProductInquiry(BaseModel):
    product_id: Optional[str] = None
    product_name: str = ""
    customer_name: str
    customer_email: str
    customer_phone: str = ""
    message: str
    is_custom: bool = False
    # Nuovi campi shop avanzato
    selected_color: str = ""
    selected_material: str = ""
    selected_size: str = ""
    custom_text: str = ""
    inquiry_type: str = "info"  # info | quote (preventivo)

@api_router.post("/public/product-inquiry")
async def product_inquiry(inquiry: ProductInquiry):
    """Send inquiry email for a product or custom request"""
    if inquiry.is_custom:
        subject_prefix = "Richiesta Personalizzata"
    elif inquiry.inquiry_type == "quote":
        subject_prefix = f"Richiesta Preventivo: {inquiry.product_name}"
    else:
        subject_prefix = f"Richiesta Info: {inquiry.product_name}"

    # Costruisci righe varianti / personalizzazione
    variant_rows = ""
    if inquiry.selected_color:
        variant_rows += f"<tr><td style='padding:8px;color:#666;'>Colore:</td><td style='padding:8px;font-weight:bold;'>{inquiry.selected_color}</td></tr>"
    if inquiry.selected_material:
        variant_rows += f"<tr><td style='padding:8px;color:#666;'>Materiale:</td><td style='padding:8px;font-weight:bold;'>{inquiry.selected_material}</td></tr>"
    if inquiry.selected_size:
        variant_rows += f"<tr><td style='padding:8px;color:#666;'>Dimensione:</td><td style='padding:8px;font-weight:bold;'>{inquiry.selected_size}</td></tr>"
    custom_block = ""
    if inquiry.custom_text:
        custom_block = f"""
        <div style="margin-top:12px;padding:12px;background:#fff7ed;border-left:3px solid #f97316;border-radius:4px;">
            <p style="font-size:12px;color:#92400e;margin:0 0 4px;font-weight:bold;">Personalizzazione richiesta:</p>
            <p style="font-size:14px;margin:0;color:#1f2937;">{inquiry.custom_text}</p>
        </div>"""

    html = f"""
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;text-align:center;">
            <h2 style="color:white;margin:0;">{subject_prefix}</h2>
        </div>
        <div style="padding:20px;background:white;">
            <table style="width:100%;font-size:14px;">
                <tr><td style="padding:8px;color:#666;width:120px;">Nome:</td><td style="padding:8px;font-weight:bold;">{inquiry.customer_name}</td></tr>
                <tr><td style="padding:8px;color:#666;">Email:</td><td style="padding:8px;"><a href="mailto:{inquiry.customer_email}">{inquiry.customer_email}</a></td></tr>
                {"<tr><td style='padding:8px;color:#666;'>Telefono:</td><td style='padding:8px;'>" + inquiry.customer_phone + "</td></tr>" if inquiry.customer_phone else ""}
                {"<tr><td style='padding:8px;color:#666;'>Prodotto:</td><td style='padding:8px;font-weight:bold;'>" + inquiry.product_name + "</td></tr>" if inquiry.product_name else ""}
                {variant_rows}
            </table>
            {custom_block}
            <div style="margin-top:15px;padding:15px;background:#f8fafc;border-radius:8px;">
                <p style="font-size:13px;color:#666;margin:0 0 5px;">Messaggio:</p>
                <p style="font-size:14px;margin:0;white-space:pre-wrap;">{inquiry.message}</p>
            </div>
        </div>
    </div>"""

    send_html_email(to_email="info@artestramas3d.it", subject=f"{subject_prefix} - {inquiry.customer_name}", html_content=html)

    await db.inquiries.insert_one({
        "product_id": inquiry.product_id,
        "product_name": inquiry.product_name,
        "customer_name": inquiry.customer_name,
        "customer_email": inquiry.customer_email,
        "customer_phone": inquiry.customer_phone,
        "message": inquiry.message,
        "is_custom": inquiry.is_custom,
        "inquiry_type": inquiry.inquiry_type,
        "selected_color": inquiry.selected_color,
        "selected_material": inquiry.selected_material,
        "selected_size": inquiry.selected_size,
        "custom_text": inquiry.custom_text,
        "status": "nuova",
        "created_at": datetime.now(timezone.utc).isoformat()
    })

    return {"message": "Richiesta inviata con successo"}

@api_router.get("/public/landing")
async def get_public_landing():
    """Landing page data - no auth required"""
    settings = await db.site_settings.find_one({"_id": "global"})
    landing = await db.landing_settings.find_one({"_id": "global"})
    brand = settings.get("brand_name", "Artes&Tramas") if settings else "Artes&Tramas"
    primary = settings.get("primary_color", "#f97316") if settings else "#f97316"
    data = {
        "brand_name": brand,
        "primary_color": primary,
        "hero_title": landing.get("hero_title", "") if landing else "",
        "hero_subtitle": landing.get("hero_subtitle", "") if landing else "",
        "about_text": landing.get("about_text", "") if landing else "",
        "services": landing.get("services", []) if landing else [],
        "contact_email": landing.get("contact_email", "") if landing else "",
        "contact_phone": landing.get("contact_phone", "") if landing else "",
        "social_instagram": landing.get("social_instagram", "") if landing else "",
        "social_facebook": landing.get("social_facebook", "") if landing else "",
    }
    # Include public products as portfolio
    products = []
    async for doc in db.products.find({"is_public": True}).sort("created_at", -1).limit(12):
        products.append({
            "name": doc.get("name", ""),
            "description": doc.get("description", ""),
            "price": doc.get("price", 0),
            "photo": doc.get("photo", ""),
            "category": doc.get("category", ""),
        })
    data["portfolio"] = products
    return data

class ContactFormRequest(BaseModel):
    name: str
    email: str
    message: str
    phone: str = ""

@api_router.post("/public/contact")
async def submit_contact_form(form: ContactFormRequest):
    """Public contact form - sends email to info@artestramas3d.it"""
    # Save to DB
    await db.contact_requests.insert_one({
        "name": form.name,
        "email": form.email,
        "phone": form.phone,
        "message": form.message,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    # Send email notification to info@artestramas3d.it
    send_email(
        to_email="info@artestramas3d.it",
        subject=f"Nuova richiesta preventivo da {form.name}",
        body=f"Nome: {form.name}\nEmail: {form.email}\nTelefono: {form.phone}\n\nMessaggio:\n{form.message}"
    )
    return {"message": "Richiesta inviata con successo"}

# Landing Settings (Admin)
class LandingSettingsUpdate(BaseModel):
    hero_title: Optional[str] = None
    hero_subtitle: Optional[str] = None
    about_text: Optional[str] = None
    services: Optional[List[str]] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    social_instagram: Optional[str] = None
    social_facebook: Optional[str] = None

@api_router.get("/admin/landing-settings")
async def get_landing_settings(current_user: dict = Depends(require_admin)):
    doc = await db.landing_settings.find_one({"_id": "global"})
    if not doc:
        return {"hero_title": "", "hero_subtitle": "", "about_text": "", "services": [], "contact_email": "", "contact_phone": "", "social_instagram": "", "social_facebook": ""}
    return {k: doc.get(k, "") for k in ["hero_title", "hero_subtitle", "about_text", "services", "contact_email", "contact_phone", "social_instagram", "social_facebook"]}

@api_router.put("/admin/landing-settings")
async def update_landing_settings(settings: LandingSettingsUpdate, current_user: dict = Depends(require_admin)):
    update_data = {k: v for k, v in settings.model_dump().items() if v is not None}
    if update_data:
        await db.landing_settings.update_one({"_id": "global"}, {"$set": update_data}, upsert=True)
    doc = await db.landing_settings.find_one({"_id": "global"})
    return {k: doc.get(k, "") for k in ["hero_title", "hero_subtitle", "about_text", "services", "contact_email", "contact_phone", "social_instagram", "social_facebook"]}

# Admin - Contact Requests
@api_router.get("/admin/contact-requests")
async def get_contact_requests(current_user: dict = Depends(require_admin)):
    result = []
    async for doc in db.contact_requests.find().sort("created_at", -1).limit(50):
        result.append({
            "id": str(doc["_id"]),
            "name": doc.get("name", ""),
            "email": doc.get("email", ""),
            "phone": doc.get("phone", ""),
            "message": doc.get("message", ""),
            "created_at": doc.get("created_at", "")
        })
    return result

# ========== BAMBU STUDIO .3MF IMPORT ==========

def _parse_time_string(time_str):
    """Parse time strings like '2h 36m 25s', '1h 30m', etc. Returns seconds."""
    secs = 0
    h = re.search(r'(\d+)\s*h', time_str)
    m = re.search(r'(\d+)\s*m', time_str)
    s = re.search(r'(\d+)\s*s', time_str)
    if h: secs += int(h.group(1)) * 3600
    if m: secs += int(m.group(1)) * 60
    if s: secs += int(s.group(1))
    return secs

def _parse_3mf_zip(zf):
    """Multi-slicer 3MF parser: Bambu Studio, OrcaSlicer, Creality Print, PrusaSlicer, Cura"""
    result = {"plates": [], "total_time_seconds": 0, "total_filament_grams": 0}
    file_list = zf.namelist()
    logger.info(f"3MF files: {file_list}")

    # === Strategy 1: Bambu/Orca plate JSON (Metadata/plate_*.json) ===
    has_plate_json = False
    for name in file_list:
        if name.startswith('Metadata/plate_') and name.endswith('.json'):
            has_plate_json = True
            try:
                plate_data = json.loads(zf.read(name).decode('utf-8'))
                plate_info = {"plate": name, "print_time_seconds": 0, "filament_grams": 0, "filament_details": []}

                raw_time = plate_data.get("prediction", plate_data.get("print_time", 0))
                if isinstance(raw_time, (int, float)):
                    plate_info["print_time_seconds"] = int(raw_time)
                elif isinstance(raw_time, str):
                    plate_info["print_time_seconds"] = _parse_time_string(raw_time)

                filament_data = plate_data.get("filament", [])
                total_grams = 0
                items = filament_data if isinstance(filament_data, list) else (filament_data.values() if isinstance(filament_data, dict) else [])
                for f in items:
                    if not isinstance(f, dict):
                        continue
                    g = float(f.get("used_g", f.get("g", 0)) or 0)
                    if g == 0:
                        used_m = float(f.get("used_m", 0) or 0)
                        if used_m > 0:
                            diameter = float(f.get("diameter", 1.75) or 1.75)
                            density = float(f.get("density", 1.24) or 1.24)
                            radius_cm = (diameter / 2) / 10
                            length_cm = used_m / 10
                            volume_cm3 = 3.14159 * radius_cm * radius_cm * length_cm
                            g = volume_cm3 * density
                    total_grams += g
                    plate_info["filament_details"].append({
                        "type": f.get("type", f.get("filament_type", "")),
                        "color": f.get("color", ""),
                        "grams": round(g, 2)
                    })

                if total_grams == 0:
                    weight = plate_data.get("weight", 0)
                    if weight:
                        total_grams = float(weight)

                # Only add plate if it has actual data
                if plate_info["print_time_seconds"] > 0 or total_grams > 0:
                    plate_info["filament_grams"] = round(total_grams, 2)
                    plate_info["print_time_hours"] = round(plate_info["print_time_seconds"] / 3600, 2)
                    result["plates"].append(plate_info)
                    result["total_time_seconds"] += plate_info["print_time_seconds"]
                    result["total_filament_grams"] += total_grams
            except Exception as e:
                logger.warning(f"Errore parsing plate {name}: {e}")

    if result["total_time_seconds"] > 0 or result["total_filament_grams"] > 0:
        return result

    # === Strategy 2: Bambu/Orca slice_info.config (XML metadata) ===
    for name in file_list:
        if 'slice_info' in name.lower():
            try:
                content = zf.read(name).decode('utf-8', errors='ignore')
                
                # Try XML parsing first (Bambu Studio v2.x format)
                try:
                    import xml.etree.ElementTree as ET
                    root = ET.fromstring(content)
                    for plate_elem in root.iter('plate'):
                        time_secs = 0
                        weight_g = 0.0
                        filament_details = []
                        
                        for meta in plate_elem.findall('metadata'):
                            key = meta.get('key', '')
                            val = meta.get('value', '')
                            if key == 'prediction' and val:
                                try:
                                    time_secs = int(float(val))
                                except ValueError:
                                    time_secs = _parse_time_string(val)
                            elif key == 'weight' and val:
                                try:
                                    weight_g = float(val.replace(',', '.'))
                                except ValueError:
                                    pass
                        
                        # Parse filament elements
                        filament_total_g = 0
                        for fil in plate_elem.findall('filament'):
                            g = float(fil.get('used_g', 0) or 0)
                            filament_details.append({
                                "type": fil.get('type', ''),
                                "color": fil.get('color', ''),
                                "grams": round(g, 2)
                            })
                            filament_total_g += g
                        
                        # Use filament sum if available, otherwise use weight from metadata
                        if filament_total_g > 0:
                            weight_g = filament_total_g
                        
                        if time_secs > 0 or weight_g > 0:
                            result["total_time_seconds"] = time_secs
                            result["total_filament_grams"] = round(weight_g, 2)
                            result["plates"].append({
                                "plate": name,
                                "print_time_seconds": time_secs,
                                "print_time_hours": round(time_secs / 3600, 2),
                                "filament_grams": round(weight_g, 2),
                                "filament_details": filament_details
                            })
                            return result
                except ET.ParseError:
                    pass
                
                # Fallback: comment-style parsing (older format)
                time_match = re.search(r'estimated printing time.*?=\s*(.+)', content)
                weight_match = re.search(r'total filament used \[g\]\s*=\s*([\d.]+)', content)
                length_match = re.search(r'filament used \[mm\]\s*=\s*([\d.]+)', content)
                if time_match:
                    result["total_time_seconds"] = _parse_time_string(time_match.group(1))
                if weight_match:
                    g = float(weight_match.group(1))
                    if g > 0:
                        result["total_filament_grams"] = g
                if result["total_filament_grams"] == 0 and length_match:
                    length_mm = float(length_match.group(1))
                    radius_cm = (1.75 / 2) / 10
                    length_cm = length_mm / 10
                    result["total_filament_grams"] = round(3.14159 * radius_cm * radius_cm * length_cm * 1.24, 2)
                if result["total_time_seconds"] > 0 or result["total_filament_grams"] > 0:
                    result["plates"].append({
                        "plate": name,
                        "print_time_seconds": result["total_time_seconds"],
                        "print_time_hours": round(result["total_time_seconds"] / 3600, 2),
                        "filament_grams": result["total_filament_grams"],
                        "filament_details": []
                    })
                    return result
            except Exception as e:
                logger.warning(f"Errore parsing slice_info {name}: {e}")

    # === Strategy 3: Creality Print PrintTicket.xml ===
    for name in file_list:
        if 'printticket' in name.lower() or name == '3D/PrintTicket.xml':
            try:
                import xml.etree.ElementTree as ET
                xml_content = zf.read(name).decode('utf-8', errors='ignore')
                root = ET.fromstring(xml_content)
                # Search recursively for filament and time data
                for elem in root.iter():
                    tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
                    if tag == 'Weight' and elem.text:
                        try:
                            result["total_filament_grams"] = round(float(elem.text), 2)
                        except ValueError:
                            pass
                    if tag == 'EstimatedPrintTime' and elem.text:
                        try:
                            result["total_time_seconds"] = int(float(elem.text))
                        except ValueError:
                            pass
                if result["total_time_seconds"] > 0 or result["total_filament_grams"] > 0:
                    result["plates"].append({
                        "plate": name,
                        "print_time_seconds": result["total_time_seconds"],
                        "print_time_hours": round(result["total_time_seconds"] / 3600, 2),
                        "filament_grams": result["total_filament_grams"],
                        "filament_details": []
                    })
                    return result
            except Exception as e:
                logger.warning(f"Errore parsing PrintTicket {name}: {e}")

    # === Strategy 4: Creality Print XML model metadata ===
    for name in file_list:
        if name.endswith('.model') or (name.endswith('.xml') and '3d' in name.lower()):
            try:
                import xml.etree.ElementTree as ET
                xml_content = zf.read(name).decode('utf-8', errors='ignore')
                root = ET.fromstring(xml_content)
                for elem in root.iter():
                    tag = elem.tag.split('}')[-1] if '}' in elem.tag else elem.tag
                    if tag == 'metadata' or tag == 'meta':
                        attr_name = elem.get('name', '').lower()
                        val = elem.text or elem.get('value', '')
                        if not val:
                            continue
                        if 'weight' in attr_name and 'filament' in attr_name:
                            try:
                                result["total_filament_grams"] = round(float(val), 2)
                            except ValueError:
                                pass
                        if 'time' in attr_name and ('print' in attr_name or 'estimated' in attr_name):
                            try:
                                result["total_time_seconds"] = int(float(val))
                            except ValueError:
                                result["total_time_seconds"] = _parse_time_string(val)
            except Exception:
                pass

    if result["total_time_seconds"] > 0 or result["total_filament_grams"] > 0:
        result["plates"].append({
            "plate": "xml_metadata",
            "print_time_seconds": result["total_time_seconds"],
            "print_time_hours": round(result["total_time_seconds"] / 3600, 2),
            "filament_grams": result["total_filament_grams"],
            "filament_details": []
        })
        return result

    # === Strategy 5: GCode comments (all slicers) ===
    for name in file_list:
        if name.endswith('.gcode'):
            try:
                gcode = zf.read(name).decode('utf-8', errors='ignore')[:50000]
                time_secs = 0
                weight_g = 0.0

                # Bambu v2: "; total estimated time: 11m 42s" or "; model printing time: 4m 43s"
                t0 = re.search(r'; total estimated time:\s*(.+?)(?:;|$)', gcode)
                if t0:
                    time_secs = _parse_time_string(t0.group(1))
                if time_secs == 0:
                    t0b = re.search(r'; model printing time:\s*(.+?)(?:;|$)', gcode)
                    if t0b:
                        time_secs = _parse_time_string(t0b.group(1))

                # Bambu/Orca: "; estimated printing time (normal mode) = 2h 36m 25s"
                if time_secs == 0:
                    t1 = re.search(r'; estimated printing time.*?=\s*(.+)', gcode)
                    if t1:
                        time_secs = _parse_time_string(t1.group(1))

                # Creality: ";TIME:9185" or ";TIME:<9185.19>"
                if time_secs == 0:
                    t2 = re.search(r';TIME:<?(\d+\.?\d*)>?', gcode)
                    if t2:
                        time_secs = int(float(t2.group(1)))

                # Cura/PrusaSlicer: ";TIME_ELAPSED:9185"
                if time_secs == 0:
                    t3 = re.search(r';TIME_ELAPSED:([\d.]+)', gcode)
                    if t3:
                        time_secs = int(float(t3.group(1)))

                # PrusaSlicer: "; estimated printing time = 2h 36m 25s"
                if time_secs == 0:
                    t4 = re.search(r'; estimated printing time\s*=\s*(.+)', gcode)
                    if t4:
                        time_secs = _parse_time_string(t4.group(1))

                # Bambu: "; total filament used [g] = 43.85"
                w1 = re.search(r'; total filament used \[g\]\s*=\s*([\d.]+)', gcode)
                if w1:
                    weight_g = float(w1.group(1))

                # Bambu v2: "; total filament weight [g] : 1.13"
                if weight_g == 0:
                    w1b = re.search(r'; total filament weight \[g\]\s*:\s*([\d.]+)', gcode)
                    if w1b:
                        weight_g = float(w1b.group(1))

                # Creality: ";Filament Weight:25.58"
                if weight_g == 0:
                    w2 = re.search(r';Filament Weight:([\d.]+)', gcode)
                    if w2:
                        weight_g = float(w2.group(1))

                # Fallback: ";Filament used: 8.57m" or "; filament used [mm] = 14664"
                if weight_g == 0:
                    w3 = re.search(r';Filament used:([\d.]+)m', gcode)
                    w4 = re.search(r'; filament used \[mm\]\s*=\s*([\d.]+)', gcode)
                    length_mm = 0
                    if w3:
                        length_mm = float(w3.group(1)) * 1000
                    elif w4:
                        length_mm = float(w4.group(1))
                    if length_mm > 0:
                        radius_cm = (1.75 / 2) / 10
                        length_cm = length_mm / 10
                        weight_g = round(3.14159 * radius_cm * radius_cm * length_cm * 1.24, 2)

                if time_secs > 0 or weight_g > 0:
                    result["total_time_seconds"] = time_secs
                    result["total_filament_grams"] = round(weight_g, 2)
                    result["plates"].append({
                        "plate": name,
                        "print_time_seconds": time_secs,
                        "print_time_hours": round(time_secs / 3600, 2),
                        "filament_grams": round(weight_g, 2),
                        "filament_details": []
                    })
                    return result
            except Exception:
                pass

    return result

@api_router.post("/import/3mf")
async def import_3mf(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    """Parse .3mf file from Bambu Studio, OrcaSlicer, Creality Print, PrusaSlicer, Cura"""
    if not file.filename.endswith('.3mf'):
        raise HTTPException(status_code=400, detail="Il file deve essere in formato .3mf")

    content = await file.read()
    if len(content) > 50 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File troppo grande (max 50MB)")

    try:
        with zipfile.ZipFile(io.BytesIO(content), 'r') as zf:
            result = _parse_3mf_zip(zf)

        result["total_time_hours"] = round(result["total_time_seconds"] / 3600, 2)
        result["total_filament_grams"] = round(result["total_filament_grams"], 2)

        if not result["plates"]:
            # Detect why no data was found
            file_list = []
            with zipfile.ZipFile(io.BytesIO(content), 'r') as zf:
                file_list = zf.namelist()
            has_gcode = any(n.endswith('.gcode') for n in file_list)
            has_plate_json = any(n.startswith('Metadata/plate_') and n.endswith('.json') for n in file_list)
            has_model = any(n.endswith('.model') for n in file_list)
            
            if has_model and has_plate_json and not has_gcode:
                # Bambu Studio project saved but NOT exported as sliced file
                raise HTTPException(status_code=400, detail="Questo file .3mf è un progetto Bambu Studio/OrcaSlicer ma NON contiene i dati di slicing. Per importare tempo e grammi devi: 1) Fare lo Slicing nel slicer 2) Usare 'File → Esporta → Esporta file piatto slicato' (NON 'Salva progetto')")
            elif has_model and not has_gcode and not has_plate_json:
                raise HTTPException(status_code=400, detail="Il file .3mf contiene solo il modello 3D ma non i dati di stampa. Devi prima eseguire lo SLICING nel tuo slicer (Bambu Studio, OrcaSlicer, Creality Print) e poi esportare il file .3mf.")
            else:
                raise HTTPException(status_code=400, detail="Nessun dato di stampa trovato nel file .3mf. Assicurati di aver eseguito lo slicing e di esportare il file slicato (non il progetto).")

        return result
    except zipfile.BadZipFile:
        raise HTTPException(status_code=400, detail="Il file non è un archivio .3mf valido")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Errore parsing .3mf: {e}")
        raise HTTPException(status_code=500, detail=f"Errore nell'analisi del file: {str(e)}")

# Admin - Stats
@api_router.get("/admin/stats")
async def admin_get_stats(current_user: dict = Depends(require_admin)):
    total_users = await db.users.count_documents({})
    verified_users = await db.users.count_documents({"email_verified": True})
    # Count legacy users (without email_verified field) as verified
    legacy_users = await db.users.count_documents({"email_verified": {"$exists": False}})
    total_sales = await db.sales.count_documents({})
    total_newsletters = await db.newsletters.count_documents({})
    return {
        "total_users": total_users,
        "verified_users": verified_users + legacy_users,
        "unverified_users": total_users - verified_users - legacy_users,
        "total_sales": total_sales,
        "total_newsletters": total_newsletters
    }


# ========== CLIENTS / RUBRICA ==========
class ClientCreate(BaseModel):
    name: str
    surname: str = ""
    phone: str = ""
    email: str = ""
    address: str = ""
    notes: str = ""

@api_router.get("/clients")
async def get_clients(current_user: dict = Depends(get_current_user)):
    clients = []
    async for doc in db.clients.find({"user_id": current_user["id"]}).sort("name", 1):
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        clients.append(doc)
    return clients

@api_router.post("/clients")
async def create_client(client: ClientCreate, current_user: dict = Depends(get_current_user)):
    doc = {
        "user_id": current_user["id"],
        **client.dict(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.clients.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

@api_router.put("/clients/{client_id}")
async def update_client(client_id: str, client: ClientCreate, current_user: dict = Depends(get_current_user)):
    result = await db.clients.update_one(
        {"_id": ObjectId(client_id), "user_id": current_user["id"]},
        {"$set": client.dict()}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return {"message": "Cliente aggiornato"}

@api_router.delete("/clients/{client_id}")
async def delete_client(client_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.clients.delete_one({"_id": ObjectId(client_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Cliente non trovato")
    return {"message": "Cliente eliminato"}

@api_router.get("/clients/{client_id}/sales")
async def get_client_sales(client_id: str, current_user: dict = Depends(get_current_user)):
    sales = []
    async for doc in db.sales.find({"user_id": current_user["id"], "client_id": client_id}).sort("date", -1):
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        sales.append(doc)
    return sales

# ========== BUSINESS SETTINGS ==========
class BusinessSettings(BaseModel):
    company_name: str = ""
    address: str = ""
    city: str = ""
    zip_code: str = ""
    vat_number: str = ""
    phone: str = ""
    email: str = ""
    logo_base64: str = ""

@api_router.get("/business-settings")
async def get_business_settings(current_user: dict = Depends(get_current_user)):
    settings = await db.business_settings.find_one({"user_id": current_user["id"]})
    if not settings:
        return {"company_name": "", "address": "", "city": "", "zip_code": "", "vat_number": "", "phone": "", "email": "", "logo_base64": ""}
    settings.pop("_id", None)
    return settings

@api_router.put("/business-settings")
async def update_business_settings(data: BusinessSettings, current_user: dict = Depends(get_current_user)):
    await db.business_settings.update_one(
        {"user_id": current_user["id"]},
        {"$set": {**data.dict(), "user_id": current_user["id"]}},
        upsert=True
    )
    return {"message": "Dati aziendali aggiornati"}

# ========== QUOTE / PREVENTIVO PDF ==========
class QuoteItem(BaseModel):
    description: str
    quantity: int = 1
    unit_price: float

class QuoteCreate(BaseModel):
    client_id: Optional[str] = None
    client_name: str = ""
    items: List[QuoteItem]
    notes: str = ""
    valid_days: int = 30

@api_router.post("/quotes/generate-pdf")
async def generate_quote_pdf(quote: QuoteCreate, current_user: dict = Depends(get_current_user)):
    # Get business settings
    biz = await db.business_settings.find_one({"user_id": current_user["id"]})
    if not biz:
        biz = {}
    
    # Get client info
    client = None
    if quote.client_id:
        client = await db.clients.find_one({"_id": ObjectId(quote.client_id), "user_id": current_user["id"]})
    
    client_name = client.get("name", "") + " " + client.get("surname", "") if client else quote.client_name
    client_address = client.get("address", "") if client else ""
    client_email = client.get("email", "") if client else ""
    client_phone = client.get("phone", "") if client else ""
    
    now = datetime.now(timezone.utc)
    quote_number = f"PRV-{now.strftime('%Y%m%d')}-{now.strftime('%H%M%S')}"
    valid_until = (now + timedelta(days=quote.valid_days)).strftime("%d/%m/%Y")
    
    # Calculate totals
    subtotal = sum(item.quantity * item.unit_price for item in quote.items)
    
    # Save quote to DB
    quote_doc = {
        "user_id": current_user["id"],
        "quote_number": quote_number,
        "client_id": quote.client_id,
        "client_name": client_name.strip(),
        "items": [i.dict() for i in quote.items],
        "subtotal": round(subtotal, 2),
        "notes": quote.notes,
        "valid_until": valid_until,
        "created_at": now.isoformat()
    }
    await db.quotes.insert_one(quote_doc)
    quote_doc.pop("_id", None)
    
    # Generate HTML for PDF
    logo_html = ""
    if biz.get("logo_base64"):
        logo_html = f'<img src="{biz["logo_base64"]}" style="max-height:60px;max-width:200px;" />'
    
    items_html = ""
    for item in quote.items:
        total = item.quantity * item.unit_price
        items_html += f"""
        <tr>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;">{item.description}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">{item.quantity}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">&euro;{item.unit_price:.2f}</td>
            <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">&euro;{total:.2f}</td>
        </tr>"""
    
    client_block = ""
    if client_name.strip():
        client_lines = [f"<strong>{client_name.strip()}</strong>"]
        if client_address: client_lines.append(client_address)
        if client_email: client_lines.append(client_email)
        if client_phone: client_lines.append(client_phone)
        client_block = f'<div style="margin-bottom:20px;">{"<br/>".join(client_lines)}</div>'
    
    biz_name = biz.get("company_name", "")
    biz_lines = []
    if biz.get("address"): biz_lines.append(biz["address"])
    if biz.get("city") or biz.get("zip_code"): biz_lines.append(f'{biz.get("zip_code","")} {biz.get("city","")}'.strip())
    if biz.get("vat_number"): biz_lines.append(f'P.IVA: {biz["vat_number"]}')
    if biz.get("phone"): biz_lines.append(f'Tel: {biz["phone"]}')
    if biz.get("email"): biz_lines.append(biz["email"])
    
    html = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"/>
<style>
body {{ font-family: Arial, sans-serif; color: #333; margin: 0; padding: 30px; }}
.header {{ display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }}
.company {{ text-align: right; font-size: 13px; color: #555; line-height: 1.6; }}
.company h2 {{ color: #333; margin: 0 0 5px; font-size: 18px; }}
.quote-info {{ background: #fff7ed; padding: 15px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; }}
.quote-info div {{ font-size: 13px; }}
.quote-info strong {{ color: #ea580c; }}
table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
th {{ background: #f97316; color: white; padding: 10px 12px; text-align: left; font-size: 13px; }}
th:nth-child(2), th:nth-child(3), th:nth-child(4) {{ text-align: center; }}
th:last-child {{ text-align: right; }}
td {{ font-size: 13px; }}
.total-row {{ font-size: 18px; text-align: right; padding: 15px 0; border-top: 2px solid #f97316; }}
.notes {{ background: #f8fafc; padding: 15px; border-radius: 8px; margin-top: 20px; font-size: 12px; color: #555; }}
.footer {{ text-align: center; margin-top: 40px; font-size: 11px; color: #999; border-top: 1px solid #eee; padding-top: 15px; }}
</style></head><body>
<div class="header">
    <div>{logo_html}</div>
    <div class="company">
        <h2>{biz_name}</h2>
        {'<br/>'.join(biz_lines)}
    </div>
</div>
<div class="quote-info">
    <div>
        <strong>PREVENTIVO {quote_number}</strong><br/>
        Data: {now.strftime("%d/%m/%Y")}<br/>
        Valido fino al: {valid_until}
    </div>
    <div style="text-align:right;">
        {client_block}
    </div>
</div>
<table>
    <thead>
        <tr><th>Descrizione</th><th>Qta</th><th>Prezzo Unit.</th><th>Totale</th></tr>
    </thead>
    <tbody>
        {items_html}
    </tbody>
</table>
<div class="total-row">
    <strong>TOTALE: &euro;{subtotal:.2f}</strong>
</div>
{"<div class='notes'><strong>Note:</strong> " + quote.notes + "</div>" if quote.notes else ""}
<div class="footer">{biz_name} {(' - ' + biz.get('vat_number','')) if biz.get('vat_number') else ''}</div>
</body></html>"""
    
    return {"html": html, "quote_number": quote_number, "total": round(subtotal, 2)}

@api_router.get("/quotes")
async def get_quotes(current_user: dict = Depends(get_current_user)):
    quotes = []
    async for doc in db.quotes.find({"user_id": current_user["id"]}).sort("created_at", -1):
        doc["id"] = str(doc["_id"])
        del doc["_id"]
        quotes.append(doc)
    return quotes

# ========== DEMO VISIT COUNTER ==========
@api_router.post("/public/demo-visit")
async def record_demo_visit():
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    await db.demo_visits.update_one(
        {"date": today},
        {"$inc": {"count": 1}},
        upsert=True
    )
    # Also increment total
    await db.demo_visits.update_one(
        {"_id": "total"},
        {"$inc": {"count": 1}},
        upsert=True
    )
    return {"ok": True}

@api_router.get("/admin/demo-stats")
async def get_demo_stats(current_user: dict = Depends(require_admin)):
    total_doc = await db.demo_visits.find_one({"_id": "total"})
    total = total_doc.get("count", 0) if total_doc else 0
    
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    today_doc = await db.demo_visits.find_one({"date": today})
    today_count = today_doc.get("count", 0) if today_doc else 0
    
    # Last 7 days
    daily = []
    for i in range(7):
        d = (datetime.now(timezone.utc) - timedelta(days=i)).strftime("%Y-%m-%d")
        doc = await db.demo_visits.find_one({"date": d})
        daily.append({"date": d, "count": doc.get("count", 0) if doc else 0})
    
    return {"total": total, "today": today_count, "daily": daily}


# ========== ADMIN - INQUIRIES (Richieste prodotto/personalizzate) ==========

@api_router.get("/admin/inquiries")
async def admin_get_inquiries(current_user: dict = Depends(require_admin)):
    """Lista tutte le richieste prodotti / personalizzate / preventivi"""
    result = []
    async for doc in db.inquiries.find().sort("created_at", -1):
        result.append({
            "id": str(doc["_id"]),
            "product_id": doc.get("product_id"),
            "product_name": doc.get("product_name", ""),
            "customer_name": doc.get("customer_name", ""),
            "customer_email": doc.get("customer_email", ""),
            "customer_phone": doc.get("customer_phone", ""),
            "message": doc.get("message", ""),
            "is_custom": doc.get("is_custom", False),
            "inquiry_type": doc.get("inquiry_type", "info"),
            "selected_color": doc.get("selected_color", ""),
            "selected_material": doc.get("selected_material", ""),
            "selected_size": doc.get("selected_size", ""),
            "custom_text": doc.get("custom_text", ""),
            "status": doc.get("status", "nuova"),
            "admin_note": doc.get("admin_note", ""),
            "created_at": doc.get("created_at", "")
        })
    return result


class InquiryStatusUpdate(BaseModel):
    status: str  # nuova | in_lavorazione | preventivo_inviato | chiusa
    admin_note: Optional[str] = None


@api_router.put("/admin/inquiries/{inquiry_id}")
async def admin_update_inquiry(inquiry_id: str, update: InquiryStatusUpdate, current_user: dict = Depends(require_admin)):
    valid = {"nuova", "in_lavorazione", "preventivo_inviato", "chiusa"}
    if update.status not in valid:
        raise HTTPException(status_code=400, detail="Stato non valido")
    upd = {"status": update.status}
    if update.admin_note is not None:
        upd["admin_note"] = update.admin_note
    await db.inquiries.update_one({"_id": ObjectId(inquiry_id)}, {"$set": upd})
    return {"message": "Richiesta aggiornata"}


@api_router.delete("/admin/inquiries/{inquiry_id}")
async def admin_delete_inquiry(inquiry_id: str, current_user: dict = Depends(require_admin)):
    await db.inquiries.delete_one({"_id": ObjectId(inquiry_id)})
    return {"message": "Richiesta eliminata"}


# ========== ADMIN - PRODUCT ANALYTICS ==========

@api_router.get("/admin/product-stats")
async def admin_product_stats(current_user: dict = Depends(require_admin)):
    """Top prodotti per visualizzazioni + inquiries totali per prodotto"""
    # Aggrega inquiry per product_name
    inquiry_counts = {}
    async for doc in db.inquiries.find({"is_custom": {"$ne": True}}):
        name = doc.get("product_name") or "(senza nome)"
        inquiry_counts[name] = inquiry_counts.get(name, 0) + 1

    # Top prodotti per views
    top = []
    async for doc in db.products.find({}).sort("views", -1).limit(10):
        photos = doc.get("photos", [])
        if not photos and doc.get("photo"):
            photos = [doc["photo"]]
        name = doc.get("name", "")
        top.append({
            "id": str(doc["_id"]),
            "name": name,
            "slug": doc.get("slug", ""),
            "photo": photos[0] if photos else "",
            "price": doc.get("price", 0),
            "views": doc.get("views", 0),
            "inquiries": inquiry_counts.get(name, 0),
            "is_public": doc.get("is_public", True)
        })

    total_inquiries = await db.inquiries.count_documents({})
    custom_requests = await db.inquiries.count_documents({"is_custom": True})
    quote_requests = await db.inquiries.count_documents({"inquiry_type": "quote"})

    return {
        "top_products": top,
        "total_inquiries": total_inquiries,
        "custom_requests": custom_requests,
        "quote_requests": quote_requests
    }


@api_router.delete("/quotes/{quote_id}")
async def delete_quote(quote_id: str, current_user: dict = Depends(get_current_user)):
    result = await db.quotes.delete_one({"_id": ObjectId(quote_id), "user_id": current_user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    return {"message": "Preventivo eliminato"}

@api_router.put("/quotes/{quote_id}")
async def update_quote(quote_id: str, quote: QuoteCreate, current_user: dict = Depends(get_current_user)):
    existing = await db.quotes.find_one({"_id": ObjectId(quote_id), "user_id": current_user["id"]})
    if not existing:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    
    subtotal = sum(item.quantity * item.unit_price for item in quote.items)
    client = None
    if quote.client_id:
        client = await db.clients.find_one({"_id": ObjectId(quote.client_id), "user_id": current_user["id"]})
    client_name = client.get("name", "") + " " + client.get("surname", "") if client else quote.client_name
    
    update_data = {
        "client_id": quote.client_id,
        "client_name": client_name.strip(),
        "items": [i.dict() for i in quote.items],
        "subtotal": round(subtotal, 2),
        "notes": quote.notes,
        "valid_until": (datetime.now(timezone.utc) + timedelta(days=quote.valid_days)).strftime("%d/%m/%Y"),
    }
    await db.quotes.update_one({"_id": ObjectId(quote_id)}, {"$set": update_data})
    return {"message": "Preventivo aggiornato"}

class QuoteEmailRequest(BaseModel):
    quote_id: str
    to_email: str

@api_router.post("/quotes/send-email")
async def send_quote_email(req: QuoteEmailRequest, current_user: dict = Depends(get_current_user)):
    quote = await db.quotes.find_one({"_id": ObjectId(req.quote_id), "user_id": current_user["id"]})
    if not quote:
        raise HTTPException(status_code=404, detail="Preventivo non trovato")
    
    # Regenerate HTML
    biz = await db.business_settings.find_one({"user_id": current_user["id"]}) or {}
    
    logo_html = ""
    if biz.get("logo_base64"):
        logo_html = f'<img src="{biz["logo_base64"]}" style="max-height:60px;max-width:200px;" />'
    
    items_html = ""
    for item in quote.get("items", []):
        total = item["quantity"] * item["unit_price"]
        items_html += f'<tr><td style="padding:8px 12px;border-bottom:1px solid #eee;">{item["description"]}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;">{item["quantity"]}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;">&euro;{item["unit_price"]:.2f}</td><td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-weight:bold;">&euro;{total:.2f}</td></tr>'
    
    biz_name = biz.get("company_name", "Artes&Tramas")
    html = f"""<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;text-align:center;">
        <h2 style="color:white;margin:0;">Preventivo {quote.get('quote_number','')}</h2>
        <p style="color:rgba(255,255,255,0.8);margin:5px 0 0;font-size:14px;">{biz_name}</p>
    </div>
    <div style="padding:20px;">
        <p>Gentile {quote.get('client_name','Cliente')},</p>
        <p>In allegato il preventivo richiesto:</p>
        <table style="width:100%;border-collapse:collapse;margin:15px 0;">
            <tr style="background:#f97316;color:white;"><th style="padding:8px 12px;text-align:left;">Descrizione</th><th style="padding:8px;text-align:center;">Qta</th><th style="padding:8px;text-align:right;">Prezzo</th><th style="padding:8px 12px;text-align:right;">Totale</th></tr>
            {items_html}
        </table>
        <p style="text-align:right;font-size:20px;font-weight:bold;color:#f97316;">TOTALE: &euro;{quote.get('subtotal',0):.2f}</p>
        <p style="font-size:13px;color:#666;">Valido fino al: {quote.get('valid_until','')}</p>
        {f'<p style="font-size:13px;color:#666;background:#f8fafc;padding:10px;border-radius:4px;">{quote.get("notes","")}</p>' if quote.get("notes") else ''}
    </div>
    <div style="padding:15px;text-align:center;background:#f3f4f6;font-size:11px;color:#999;">{biz_name}</div>
    </div>"""
    
    send_html_email(to_email=req.to_email, subject=f"Preventivo {quote.get('quote_number','')} - {biz_name}", html_content=html)
    await db.quotes.update_one({"_id": ObjectId(req.quote_id)}, {"$set": {"sent_to": req.to_email, "sent_at": datetime.now(timezone.utc).isoformat()}})
    return {"message": f"Preventivo inviato a {req.to_email}"}



# ========== EXPORT CSV/EXCEL ==========
@api_router.get("/export/filaments")
async def export_filaments_csv(current_user: dict = Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Materiale", "Colore", "Brand", "Peso Bobina (g)", "Prezzo Bobina", "Costo/g", "Rimanenti (g)", "Note"])
    async for f in db.filaments.find({"user_id": current_user["id"]}):
        writer.writerow([f.get("material_type",""), f.get("color",""), f.get("brand",""), f.get("spool_weight_g",0), f.get("spool_price",0), round(f.get("cost_per_gram",0),4), f.get("remaining_grams",0), f.get("notes","")])
    output.seek(0)
    return StreamingResponse(io.BytesIO(output.getvalue().encode('utf-8-sig')), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=filamenti.csv"})

@api_router.get("/export/clients")
async def export_clients_csv(current_user: dict = Depends(get_current_user)):
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Nome", "Cognome", "Telefono", "Email", "Indirizzo", "Note"])
    async for c in db.clients.find({"user_id": current_user["id"]}):
        writer.writerow([c.get("name",""), c.get("surname",""), c.get("phone",""), c.get("email",""), c.get("address",""), c.get("notes","")])
    output.seek(0)
    return StreamingResponse(io.BytesIO(output.getvalue().encode('utf-8-sig')), media_type="text/csv", headers={"Content-Disposition": "attachment; filename=clienti.csv"})


# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://filament-profit.preview.emergentagent.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://calcolatore.artestramas3d.it",
        "https://calcolatore.artestramas3d.it",
        "http://listino.artestramas3d.it",
        "https://listino.artestramas3d.it",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

async def newsletter_scheduler():
    """Background task to send scheduled newsletters"""
    while True:
        try:
            now = datetime.now(timezone.utc).isoformat()
            scheduled = await db.newsletters.find({"status": "scheduled", "scheduled_at": {"$lte": now}}).to_list(100)
            for nl in scheduled:
                # Check if targeted or all users
                recipient_ids = nl.get("recipient_ids", [])
                if recipient_ids and len(recipient_ids) > 0:
                    emails = []
                    for uid in recipient_ids:
                        try:
                            u = await db.users.find_one({"_id": ObjectId(uid)})
                            if u:
                                emails.append(u["email"])
                        except Exception:
                            pass
                    recipients = emails
                else:
                    users = []
                    async for u in db.users.find({"email_verified": True}):
                        users.append(u)
                    async for u in db.users.find({"email_verified": {"$exists": False}}):
                        users.append(u)
                    recipients = [u["email"] for u in users]

                is_html = nl.get("is_html", False)
                for email in recipients:
                    if is_html:
                        send_html_email(to_email=email, subject=nl["subject"], html_content=nl["body"])
                    else:
                        send_email(to_email=email, subject=nl["subject"], body=nl["body"])
                await db.newsletters.update_one(
                    {"_id": nl["_id"]},
                    {"$set": {"status": "sent", "recipients_count": len(recipients), "recipients": recipients, "sent_at": now}}
                )
                logger.info(f"Newsletter programmata inviata: {nl['subject']} a {len(recipients)} destinatari")
        except Exception as e:
            logger.error(f"Errore scheduler newsletter: {e}")
        await asyncio.sleep(60)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    # Make testuser admin + verified
    await db.users.update_one({"email": "testuser@example.com"}, {"$set": {"is_admin": True, "email_verified": True}})
    # Start newsletter scheduler
    asyncio.create_task(newsletter_scheduler())
    logger.info("Database indexes created, newsletter scheduler started")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
