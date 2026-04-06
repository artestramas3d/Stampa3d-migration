import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
import bcrypt

async def import_data():
    client = AsyncIOMotorClient("mongodb://mongo:27017")
    db = client["filament_profit"]
    
    # 1. Create admin user
    hashed = bcrypt.hashpw("Ollastra@92".encode(), bcrypt.gensalt()).decode()
    user_result = await db.users.update_one(
        {"email": "artestramas3d@gmail.com"},
        {"$set": {
            "email": "artestramas3d@gmail.com",
            "password_hash": hashed,
            "name": "Admin",
            "is_admin": True,
            "email_verified": True
        }},
        upsert=True
    )
    user = await db.users.find_one({"email": "artestramas3d@gmail.com"})
    user_id = str(user["_id"])
    print(f"Admin creato: {user_id}")

    # 2. Import filaments
    filament_result = await db.filaments.insert_one({
        "user_id": user_id,
        "material_type": "PLA",
        "color": "Nero",
        "brand": "Sunlu",
        "spool_weight_g": 1000.0,
        "spool_price": 20.0,
        "cost_per_gram": 0.02,
        "color_hex": "#FFFFFF",
        "notes": "",
        "remaining_grams": 1000.0
    })
    filament_id = str(filament_result.inserted_id)
    print(f"Filamento PLA Nero importato: {filament_id}")

    # 3. Import printer
    printer_result = await db.printers.insert_one({
        "user_id": user_id,
        "printer_name": "Bambu Lab X1C",
        "printer_cost": 1200.0,
        "estimated_life_hours": 5000.0,
        "electricity_cost_kwh": 0.25,
        "average_power_watts": 200.0,
        "depreciation_per_hour": 0.24,
        "electricity_cost_per_hour": 0.05
    })
    printer_id = str(printer_result.inserted_id)
    print(f"Stampante Bambu Lab X1C importata: {printer_id}")

    # 4. Import accessories
    accessory_result = await db.accessories.insert_one({
        "user_id": user_id,
        "name": "Gancetto cromato",
        "category": "gancetto",
        "unit_cost": 0.15,
        "stock_quantity": 100,
        "notes": ""
    })
    print(f"Accessorio Gancetto importato: {str(accessory_result.inserted_id)}")

    # 5. Import sales
    await db.sales.insert_one({
        "user_id": user_id,
        "date": "2026-04-01",
        "product_name": "Portachiavi Logo",
        "material_type": "PLA Nero",
        "grams_used": 50.0,
        "print_time_hours": 2.0,
        "filament_cost": 1.0,
        "electricity_cost": 0.1,
        "depreciation_cost": 0.48,
        "total_cost": 1.58,
        "sale_price": 2.05,
        "net_profit": 0.47,
        "quantity": 1,
        "printer_id": printer_id,
        "filaments": [{"filament_id": filament_id, "grams_used": 50.0}],
        "accessories": [],
        "labor_hours": 0.0,
        "design_hours": 0.0,
        "paid": True
    })
    print("Vendita 'Portachiavi Logo' importata")

    await db.sales.insert_one({
        "user_id": user_id,
        "date": "2026-01-15",
        "product_name": "Test HM Product",
        "material_type": "PLA Nero",
        "grams_used": 30.0,
        "print_time_hours": 2.5,
        "filament_cost": 0.6,
        "electricity_cost": 0.12,
        "depreciation_cost": 0.6,
        "total_cost": 22.57,
        "sale_price": 25.0,
        "net_profit": 2.43,
        "quantity": 1,
        "printer_id": printer_id,
        "filaments": [{"filament_id": filament_id, "grams_used": 30.0}],
        "accessories": [],
        "labor_hours": 0.75,
        "design_hours": 0.5,
        "paid": False
    })
    print("Vendita 'Test HM Product' importata")

    print("\n=== IMPORTAZIONE COMPLETATA ===")
    print(f"Email: artestramas3d@gmail.com")
    print(f"Password: Ollastra@92")
    print(f"Ruolo: Admin")
    
    client.close()

asyncio.run(import_data())
