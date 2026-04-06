from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends
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
import base64
import asyncio
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
        logger.info(f"=== EMAIL SIMULATA (SMTP non configurato) ===")
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
        logger.info(f"=== EMAIL SIMULATA (SMTP non configurato) ===")
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
    """Send welcome email explaining all app features."""
    name = user_name or "Utente"
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
          <p style="color: #555; font-size: 14px; margin: 8px 0; line-height: 1.5;">
            <strong style="color: #333;">Segnala Problema</strong> — Hai trovato un bug? Segnalalo con screenshot e lo risolveremo!
          </p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="{FRONTEND_URL}" style="background-color: #f97316; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-size: 16px; font-weight: bold;">Inizia ad usare il Calcolatore</a>
        </div>

        <p style="color: #555; font-size: 14px; line-height: 1.6;">
          <strong>Consiglio per iniziare:</strong> Aggiungi prima le tue stampanti nelle Impostazioni, poi i filamenti che hai in magazzino. Dopo potrai usare il Calcolatore per avere il costo preciso di ogni stampa!
        </p>
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
    notes: str = ""
    remaining_grams: Optional[float] = None  # If not provided, defaults to spool_weight_g

class FilamentUpdate(BaseModel):
    material_type: Optional[str] = None
    color: Optional[str] = None
    brand: Optional[str] = None
    spool_weight_g: Optional[float] = None
    spool_price: Optional[float] = None
    color_hex: Optional[str] = None
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
        "total_grams": total_grams,
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
    result = []
    async for doc in db.sales.find({"user_id": current_user["id"]}).sort("date", -1):
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
            "paid": doc.get("paid", False)
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
            "design_hours": doc.get("design_hours", 0)
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
    net_profit = sale.sale_price - total_cost
    
    # Store filaments data for copy feature
    filaments_data = [{"filament_id": f.filament_id, "grams_used": f.grams_used} for f in filament_list]
    accessories_data = [{"accessory_id": a.accessory_id, "quantity": a.quantity} for a in sale.accessories]
    
    doc = {
        "user_id": current_user["id"],
        "date": sale.date,
        "product_name": sale.product_name,
        "material_type": " + ".join(material_types) if material_types else "",
        "grams_used": total_grams,
        "print_time_hours": sale.print_time_hours,
        "printer_id": sale.printer_id,
        "filaments": filaments_data,
        "accessories": accessories_data,
        "labor_hours": sale.labor_hours,
        "design_hours": sale.design_hours,
        "quantity": sale.quantity,
        "filament_cost": round(material_cost, 2),
        "electricity_cost": round(electricity_cost, 2),
        "depreciation_cost": round(depreciation_cost, 2),
        "accessories_cost": round(accessories_cost, 2),
        "total_cost": round(total_cost, 2),
        "sale_price": sale.sale_price,
        "net_profit": round(net_profit, 2),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    result = await db.sales.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc

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
        "low_stock_accessories": low_stock_accessories
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

class BannerUpdate(BaseModel):
    position: Optional[str] = None
    name: Optional[str] = None
    html_code: Optional[str] = None
    is_active: Optional[bool] = None

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

# Public endpoint - active banners (no auth needed for display)
@api_router.get("/banners/active")
async def get_active_banners(current_user: dict = Depends(get_current_user)):
    result = []
    async for doc in db.banners.find({"is_active": True}):
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
            "created_at": doc.get("created_at", "")
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
    
    if newsletter.scheduled_at:
        # Schedule for later
        doc = {
            "subject": newsletter.subject,
            "body": newsletter.body,
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
        # Send immediately
        users = []
        async for u in db.users.find({"email_verified": True}):
            users.append(u)
        async for u in db.users.find({"email_verified": {"$exists": False}}):
            users.append(u)
        
        recipients = [u["email"] for u in users]
        
        for email in recipients:
            send_email(to_email=email, subject=newsletter.subject, body=newsletter.body)
        
        doc = {
            "subject": newsletter.subject,
            "body": newsletter.body,
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

@api_router.get("/site-settings")
async def get_site_settings(current_user: dict = Depends(get_current_user)):
    doc = await db.site_settings.find_one({"_id": "global"})
    if not doc:
        return {"brand_name": "Artes&Tramas", "subtitle": "Calcolatore", "primary_color": "#f97316", "accent_color": "#2563eb"}
    return {
        "brand_name": doc.get("brand_name", "Artes&Tramas"),
        "subtitle": doc.get("subtitle", "Calcolatore"),
        "primary_color": doc.get("primary_color", "#f97316"),
        "accent_color": doc.get("accent_color", "#2563eb"),
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
                users = []
                async for u in db.users.find({"email_verified": True}):
                    users.append(u)
                async for u in db.users.find({"email_verified": {"$exists": False}}):
                    users.append(u)
                recipients = [u["email"] for u in users]
                for email in recipients:
                    send_email(to_email=email, subject=nl["subject"], body=nl["body"])
                await db.newsletters.update_one(
                    {"_id": nl["_id"]},
                    {"$set": {"status": "sent", "recipients_count": len(recipients), "recipients": recipients, "sent_at": now}}
                )
                logger.info(f"Newsletter programmata inviata: {nl['subject']} a {len(recipients)} destinatari")
        except Exception as e:
            logger.error(f"Errore scheduler newsletter: {e}")
        await asyncio.sleep(60)  # Check every 60 seconds

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
