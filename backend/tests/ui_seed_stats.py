# Seed/cleanup TEST_ data for Statistiche UI testing (testuser). Usage: python ui_seed_stats.py seed|clean
import os, sys, json, datetime, requests

B = os.environ["REACT_APP_BACKEND_URL"].rstrip("/")
IDS = "/tmp/ui_seed_ids.json"
s = requests.Session()
assert s.post(f"{B}/api/auth/login", json={"email": "testuser@example.com", "password": "password123"}).status_code == 200


def post(p, b):
    r = s.post(f"{B}/api{p}", json=b)
    assert r.status_code == 200, r.text
    return r.json()


if sys.argv[1] == "seed":
    t = datetime.date.today()
    cur = t.replace(day=1).isoformat()
    prev = (t.replace(day=1) - datetime.timedelta(days=5)).replace(day=3).isoformat()
    ids = {"sales": [], "purchases": [], "filaments": [], "printers": [], "clients": []}
    pr = post("/printers", {"printer_name": "TEST_UIPrinter", "printer_cost": 0, "estimated_life_hours": 1000,
                            "electricity_cost_kwh": 0, "average_power_watts": 0})
    ids["printers"].append(pr["id"])
    fa = post("/filaments", {"material_type": "PLA", "color": "TEST_Rosso", "brand": "TEST_UI", "spool_weight_g": 1000, "spool_price": 20, "color_hex": "#ff0000"})
    fb = post("/filaments", {"material_type": "PETG", "color": "TEST_Blu", "brand": "TEST_UI", "spool_weight_g": 1000, "spool_price": 30, "color_hex": "#0000ff"})
    ids["filaments"] += [fa["id"], fb["id"]]
    c = post("/clients", {"name": "TEST_Mario", "surname": "TEST_Rossi"})
    ids["clients"].append(c["id"])
    for i in range(12):
        r = post("/sales", {"date": cur, "product_name": f"TEST_Prodotto_{i:02d}", "printer_id": pr["id"], "sale_price": 10 + i,
                            "quantity": 1 + (i % 2), "filaments": [{"filament_id": (fa if i % 2 else fb)["id"], "grams_used": 30}],
                            "client_id": c["id"] if i < 4 else None})
        ids["sales"] += [x["id"] for x in r["items"]]
    r = post("/sales", {"date": prev, "product_name": "TEST_Prev", "printer_id": pr["id"], "sale_price": 50, "filaments": [{"filament_id": fa["id"], "grams_used": 50}]})
    ids["sales"] += [x["id"] for x in r["items"]]
    for mat, var, price in (("PLA", "", 20), ("pla", "", 15), ("PETG", "Silk", 30)):
        ids["purchases"].append(post("/purchases", {"date": cur, "material_type": mat, "brand": "TEST_UI", "color": "TEST_C", "quantity_spools": 1,
                                                     "price_total": price, "grams_total": 1000, "variant": var, "create_filament": False})["id"])
    json.dump(ids, open(IDS, "w"))
    print("seeded", {k: len(v) for k, v in ids.items()}, cur, prev)
else:
    ids = json.load(open(IDS))
    for k, path in (("sales", "sales"), ("purchases", "purchases"), ("filaments", "filaments"), ("printers", "printers"), ("clients", "clients")):
        for i in ids[k]:
            s.delete(f"{B}/api/{path}/{i}")
    print("cleaned")
