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
        return {"id": str(user["_id"]), "email": user["email"], "name": user.get("name", "")}
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
    quantity_spools: int
    price_total: float
    grams_total: float
    notes: str = ""

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

class PrintCalculationCreate(BaseModel):
    filament_id: str
    grams_used: float
    print_time_hours: float
    printer_id: str
    labor_hours: float = 0
    design_hours: float = 0
    margin_percent: float = 30
    product_name: str = ""
    accessories: List[AccessoryUsage] = []

class SaleCreate(BaseModel):
    date: str
    product_name: str
    filament_id: str
    grams_used: float
    print_time_hours: float
    printer_id: str
    sale_price: float
    labor_hours: float = 0
    design_hours: float = 0
    accessories: List[AccessoryUsage] = []

# Auth Endpoints
@api_router.post("/auth/register")
async def register(user: UserRegister, response: Response):
    email = user.email.lower().strip()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email già registrata")
    hashed = hash_password(user.password)
    result = await db.users.insert_one({
        "email": email,
        "password_hash": hashed,
        "name": user.name,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, email)
    refresh_token = create_refresh_token(user_id)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=False, samesite="lax", max_age=3600, path="/")
    response.set_cookie(key="refresh_token", value=refresh_token, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": user.name}

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
    return {"id": user_id, "email": email, "name": db_user.get("name", "")}

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
    filament = await db.filaments.find_one({"_id": ObjectId(calc.filament_id), "user_id": current_user["id"]})
    printer = await db.printers.find_one({"_id": ObjectId(calc.printer_id), "user_id": current_user["id"]})
    if not filament or not printer:
        raise HTTPException(status_code=404, detail="Filamento o stampante non trovati")
    
    material_cost = calc.grams_used * filament.get("cost_per_gram", 0)
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
    sale_price = total_cost * (1 + calc.margin_percent / 100)
    net_profit = sale_price - total_cost
    
    return {
        "material_cost": round(material_cost, 2),
        "electricity_cost": round(electricity_cost, 2),
        "depreciation_cost": round(depreciation_cost, 2),
        "accessories_cost": round(accessories_cost, 2),
        "accessories_details": accessories_details,
        "production_cost": round(production_cost, 2),
        "labor_cost": round(labor_cost, 2),
        "design_cost": round(design_cost, 2),
        "total_cost": round(total_cost, 2),
        "sale_price": round(sale_price, 2),
        "net_profit": round(net_profit, 2),
        "margin_percent": calc.margin_percent
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
            "net_profit": doc.get("net_profit", 0)
        })
    return result

@api_router.post("/sales")
async def create_sale(sale: SaleCreate, current_user: dict = Depends(get_current_user)):
    filament = await db.filaments.find_one({"_id": ObjectId(sale.filament_id), "user_id": current_user["id"]})
    printer = await db.printers.find_one({"_id": ObjectId(sale.printer_id), "user_id": current_user["id"]})
    if not filament or not printer:
        raise HTTPException(status_code=404, detail="Filamento o stampante non trovati")
    
    material_cost = sale.grams_used * filament.get("cost_per_gram", 0)
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
    
    # Decrement filament remaining grams
    await db.filaments.update_one(
        {"_id": ObjectId(sale.filament_id)},
        {"$inc": {"remaining_grams": -sale.grams_used}}
    )
    
    total_cost = material_cost + electricity_cost + depreciation_cost + labor_cost + design_cost + accessories_cost
    net_profit = sale.sale_price - total_cost
    
    doc = {
        "user_id": current_user["id"],
        "date": sale.date,
        "product_name": sale.product_name,
        "material_type": filament.get("material_type", ""),
        "grams_used": sale.grams_used,
        "print_time_hours": sale.print_time_hours,
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

# Include router
app.include_router(api_router)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[
        "https://filament-profit.preview.emergentagent.com",
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    logger.info("Database indexes created")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
