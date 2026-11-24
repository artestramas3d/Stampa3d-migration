# Statistiche page backend: GET /api/stats/analytics (aggregations, previous-period rules, scoping, validation)
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN = {"email": "testuser@example.com", "password": "password123"}
OWNER = {"email": "artestramas3d@gmail.com", "password": "Federico.Sanna@1992"}
W_START, W_END = "2011-03-01", "2011-03-31"


def login(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds)
    if r.status_code != 200:
        pytest.skip(f"login failed {creds['email']}: {r.status_code}")
    return s


def analytics(s, start=None, end=None):
    params = {}
    if start:
        params["start"] = start
    if end:
        params["end"] = end
    return s.get(f"{BASE_URL}/api/stats/analytics", params=params)


@pytest.fixture(scope="module")
def admin():
    return login(ADMIN)


@pytest.fixture(scope="module")
def seeded(admin):
    """Create isolated TEST_ data in March 2011 (+ one Feb 2011 sale for previous period)."""
    base = analytics(admin, W_START, W_END).json()
    assert base["summary"]["units"] == 0, "test window 2011-03 not empty"
    created = {"sales": [], "purchases": [], "filaments": [], "printers": [], "clients": []}

    def post(path, body):
        r = admin.post(f"{BASE_URL}/api{path}", json=body)
        assert r.status_code == 200, f"{path}: {r.status_code} {r.text}"
        return r.json()

    try:
        p = post("/printers", {"printer_name": "TEST_Printer", "printer_cost": 0, "estimated_life_hours": 1000,
                                "electricity_cost_kwh": 0, "average_power_watts": 0})
        created["printers"].append(p["id"])
        fa = post("/filaments", {"material_type": "PLA", "color": "TEST_Rosso", "brand": "TEST_BrandX",
                                 "spool_weight_g": 1000, "spool_price": 20, "color_hex": "#ff0000"})
        fb = post("/filaments", {"material_type": "PETG", "color": "TEST_Blu", "brand": "TEST_BrandY",
                                 "spool_weight_g": 1000, "spool_price": 30, "color_hex": "#0000ff"})
        created["filaments"] += [fa["id"], fb["id"]]
        c = post("/clients", {"name": "TEST_Mario", "surname": "TEST_Rossi"})
        created["clients"].append(c["id"])

        def sale(date, name, fils, qty, price, **kw):
            body = {"date": date, "product_name": name, "printer_id": p["id"], "sale_price": price,
                    "quantity": qty, "print_time_hours": 0, "filaments": fils, **kw}
            res = post("/sales", body)
            assert res["count"] == qty
            created["sales"] += [i["id"] for i in res["items"]]

        sale("2011-03-05", "TEST_Vaso", [{"filament_id": fa["id"], "grams_used": 100}], 2, 30, client_id=c["id"])
        sale("2011-03-10", "TEST_Vaso", [{"filament_id": fb["id"], "grams_used": 50}], 1, 10)
        sale("2011-03-12", "TEST_Lampada", [{"filament_id": fa["id"], "grams_used": 20},
                                            {"filament_id": fb["id"], "grams_used": 20}], 1, 20, source_module="cricut")
        sale("2011-02-10", "TEST_Prev", [{"filament_id": fa["id"], "grams_used": 10}], 1, 12)

        def purchase(date, mat, brand, price, grams, spools, variant=""):
            res = post("/purchases", {"date": date, "material_type": mat, "brand": brand, "color": "TEST_C",
                                      "quantity_spools": spools, "price_total": price, "grams_total": grams,
                                      "variant": variant, "create_filament": False})
            created["purchases"].append(res["id"])

        purchase("2011-03-06", "pla", "TEST_BrandX", 20, 1000, 1)
        purchase("2011-03-07", "PLA", "test_brandx", 25, 1000, 1)
        purchase("2011-03-08", "PETG", "TEST_BrandX", 30, 1000, 2, variant="Silk")
        yield created
    finally:
        for sid in created["sales"]:
            admin.delete(f"{BASE_URL}/api/sales/{sid}")
        for pid in created["purchases"]:
            admin.delete(f"{BASE_URL}/api/purchases/{pid}")
        for fid in created["filaments"]:
            admin.delete(f"{BASE_URL}/api/filaments/{fid}")
        for pid in created["printers"]:
            admin.delete(f"{BASE_URL}/api/printers/{pid}")
        for cid in created["clients"]:
            admin.delete(f"{BASE_URL}/api/clients/{cid}")


@pytest.fixture(scope="module")
def data(admin, seeded):
    r = analytics(admin, W_START, W_END)
    assert r.status_code == 200
    return r.json()


class TestShapeAndValidation:
    def test_unauthenticated(self):
        assert analytics(requests.Session(), W_START, W_END).status_code == 401

    def test_invalid_date_400(self, admin):
        r = analytics(admin, "2024-13-01", "2024-13-05")
        assert r.status_code == 400
        assert analytics(admin, "abc", "2024-01-01").status_code == 400

    def test_all_time_no_previous(self, admin):
        r = analytics(admin)
        assert r.status_code == 200
        d = r.json()
        assert d["previous"] is None
        for k in ("start", "end", "granularity", "summary", "timeline", "products", "purchases",
                  "consumption", "by_type", "by_client"):
            assert k in d
        assert set(d["purchases"]) == {"by_material", "by_variant", "by_brand"}
        assert set(d["consumption"]) == {"by_material", "by_color"}

    def test_granularity(self, admin):
        assert analytics(admin, "2011-01-01", "2011-03-03").json()["granularity"] == "day"  # 61 days
        assert analytics(admin, "2011-01-01", "2011-03-05").json()["granularity"] == "month"


class TestPreviousPeriod:
    @pytest.mark.parametrize("start,end,ps,pe", [
        ("2025-11-01", "2025-11-24", "2025-10-01", "2025-10-24"),
        ("2025-09-01", "2025-11-24", "2025-06-01", "2025-08-24"),
        ("2025-10-01", "2025-10-31", "2025-09-01", "2025-09-30"),
        ("2025-01-01", "2025-03-31", "2024-01-01", "2024-03-31"),
        ("2025-01-01", "2025-11-24", "2024-01-01", "2024-11-24"),
        ("2025-01-01", "2025-12-31", "2024-01-01", "2024-12-31"),
        ("2025-01-01", "2025-01-31", "2024-12-01", "2024-12-31"),
        ("2025-03-05", "2025-03-14", "2025-02-23", "2025-03-04"),
        ("2024-03-01", "2024-03-31", "2024-02-01", "2024-02-29"),
    ])
    def test_rules(self, admin, start, end, ps, pe):
        prev = analytics(admin, start, end).json()["previous"]
        assert (prev["start"], prev["end"]) == (ps, pe)


class TestAggregations:
    def test_summary(self, data):
        s = data["summary"]
        assert s["revenue"] == 60.0
        assert s["cost"] == 4.5
        assert s["profit"] == 55.5
        assert s["units"] == 4
        assert s["grams_used"] == 190
        assert s["margin"] == 92.5
        assert s["purchases_spent"] == 75.0
        assert s["purchases_grams"] == 3000
        assert s["purchases_spools"] == 4

    def test_previous_summary(self, data):
        p = data["previous"]
        assert (p["start"], p["end"]) == ("2011-02-01", "2011-02-28")
        assert p["revenue"] == 12.0 and p["units"] == 1

    def test_products(self, data):
        prods = {p["name"]: p for p in data["products"]}
        v = prods["TEST_Vaso"]
        assert v["units"] == 3 and v["revenue"] == 40.0 and v["cost"] == 3.5 and v["profit"] == 36.5
        assert abs(v["margin"] - 91.25) <= 0.06
        assert prods["TEST_Lampada"]["units"] == 1
        assert data["products"][0]["name"] == "TEST_Vaso"  # sorted by revenue desc

    def test_consumption(self, data):
        mat = {m["name"]: m["grams"] for m in data["consumption"]["by_material"]}
        assert mat == {"PLA": 120, "PETG": 70}
        col = {c["name"]: c for c in data["consumption"]["by_color"]}
        assert col["TEST_Rosso · TEST_BrandX"]["grams"] == 120
        assert col["TEST_Rosso · TEST_BrandX"]["color_hex"] == "#ff0000"
        assert col["TEST_Blu · TEST_BrandY"]["grams"] == 70

    def test_purchase_groups_case_insensitive(self, data):
        pm = {m["name"].lower(): m for m in data["purchases"]["by_material"]}
        assert len(pm) == 2 and pm["pla"]["spent"] == 45.0 and pm["pla"]["spools"] == 2
        pv = {m["name"].lower(): m["spent"] for m in data["purchases"]["by_variant"]}
        assert pv == {"pla": 45.0, "petg silk": 30.0}
        pb = data["purchases"]["by_brand"]
        assert len(pb) == 1 and pb[0]["spent"] == 75.0 and pb[0]["grams"] == 3000

    def test_by_type(self, data):
        t = {x["name"]: x for x in data["by_type"]}
        assert t["Stampa 3D"]["revenue"] == 40.0 and t["Stampa 3D"]["units"] == 3
        assert t["Plotter / Cricut"]["revenue"] == 20.0

    def test_by_client(self, data):
        c = {x["name"]: x for x in data["by_client"]}
        assert c["TEST_Mario TEST_Rossi"]["revenue"] == 30.0 and c["TEST_Mario TEST_Rossi"]["units"] == 2
        assert c["Senza cliente"]["revenue"] == 30.0

    def test_timeline(self, data):
        assert data["granularity"] == "day"
        tl = {t["period"]: t for t in data["timeline"]}
        assert tl["2011-03-05"]["revenue"] == 30.0
        assert tl["2011-03-06"]["purchases"] == 20.0
        assert sum(t["revenue"] for t in data["timeline"]) == 60.0

    def test_user_scoping(self, seeded):
        owner = login(OWNER)
        d = analytics(owner, W_START, W_END).json()
        assert all(not p["name"].startswith("TEST_") for p in d["products"])
        assert d["summary"]["units"] == 0
