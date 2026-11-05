# Tests: Filament presets (per-user CRUD/upsert/isolation) + bulk filament purchase (create/merge/purchases/validation)
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN = {"email": "testuser@example.com", "password": "password123"}
OWNER = {"email": "artestramas3d@gmail.com", "password": "Federico.Sanna@1992"}
TAG = uuid.uuid4().hex[:6]
BRAND = f"TEST_Brand_{TAG}"


def _login(creds):
    s = requests.Session()
    r = s.post(f"{BASE_URL}/api/auth/login", json=creds)
    if r.status_code != 200:
        pytest.skip(f"login failed {creds['email']}: {r.status_code} {r.text[:200]}")
    return s


@pytest.fixture(scope="module")
def admin():
    return _login(ADMIN)


@pytest.fixture(scope="module")
def owner():
    return _login(OWNER)


@pytest.fixture(scope="module", autouse=True)
def cleanup(admin):
    yield
    # delete only things created by this run (brand contains unique TAG)
    for f in admin.get(f"{BASE_URL}/api/filaments").json():
        if TAG in (f.get("brand") or ""):
            admin.delete(f"{BASE_URL}/api/filaments/{f['id']}")
    for p in admin.get(f"{BASE_URL}/api/purchases").json():
        if TAG in (p.get("brand") or ""):
            admin.delete(f"{BASE_URL}/api/purchases/{p['id']}")
    for p in admin.get(f"{BASE_URL}/api/filament-presets").json():
        if TAG in p["name"]:
            admin.delete(f"{BASE_URL}/api/filament-presets/{p['id']}")


# --- Presets ---
class TestPresets:
    def test_unauth(self):
        r = requests.get(f"{BASE_URL}/api/filament-presets")
        assert r.status_code in (401, 403)

    def test_create_upsert_delete(self, admin):
        name = f"TEST_Preset_{TAG}"
        r = admin.post(f"{BASE_URL}/api/filament-presets", json={"name": name, "material_type": "PETG", "brand": BRAND, "spool_weight_g": 1000, "spool_price": 19.9, "finish": "silk"})
        assert r.status_code == 200, r.text
        p = r.json()
        assert p["name"] == name and p["material_type"] == "PETG" and p["spool_price"] == 19.9 and p["finish"] == "silk"
        pid = p["id"]
        # upsert same name
        r2 = admin.post(f"{BASE_URL}/api/filament-presets", json={"name": f"  {name} ", "material_type": "PLA", "brand": BRAND, "spool_weight_g": 750, "spool_price": 15})
        assert r2.status_code == 200
        assert r2.json()["id"] == pid
        lst = [x for x in admin.get(f"{BASE_URL}/api/filament-presets").json() if x["name"] == name]
        assert len(lst) == 1 and lst[0]["material_type"] == "PLA" and lst[0]["spool_weight_g"] == 750
        d = admin.delete(f"{BASE_URL}/api/filament-presets/{pid}")
        assert d.status_code == 200
        assert not [x for x in admin.get(f"{BASE_URL}/api/filament-presets").json() if x["id"] == pid]

    def test_empty_name_400(self, admin):
        r = admin.post(f"{BASE_URL}/api/filament-presets", json={"name": "   ", "material_type": "PLA"})
        assert r.status_code == 400

    def test_isolation(self, admin, owner):
        name = f"TEST_Iso_{TAG}"
        p = admin.post(f"{BASE_URL}/api/filament-presets", json={"name": name, "material_type": "PLA", "brand": BRAND}).json()
        owner_list = owner.get(f"{BASE_URL}/api/filament-presets").json()
        assert all(x["id"] != p["id"] and x["name"] != name for x in owner_list)
        # owner cannot delete admin's preset
        owner.delete(f"{BASE_URL}/api/filament-presets/{p['id']}")
        assert any(x["id"] == p["id"] for x in admin.get(f"{BASE_URL}/api/filament-presets").json())
        admin.delete(f"{BASE_URL}/api/filament-presets/{p['id']}")

    def test_delete_invalid_id(self, admin):
        r = admin.delete(f"{BASE_URL}/api/filament-presets/not-an-objectid")
        print("invalid id delete status:", r.status_code)
        assert r.status_code in (400, 404, 422), f"got {r.status_code}"


# --- Bulk purchase ---
class TestBulk:
    def test_no_valid_rows_400(self, admin):
        r = admin.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-10", "rows": [{"material_type": "PLA", "brand": BRAND, "color": "  "}]})
        assert r.status_code == 400

    def test_invalid_qty_400(self, admin):
        r = admin.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-10", "rows": [{"material_type": "PLA", "brand": BRAND, "color": "X", "quantity_spools": 0}]})
        assert r.status_code == 400
        r = admin.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-10", "rows": [{"material_type": "PLA", "brand": BRAND, "color": "X", "spool_weight_g": 0}]})
        assert r.status_code == 400
        assert not [f for f in admin.get(f"{BASE_URL}/api/filaments").json() if f.get("brand") == BRAND and f["color"] == "X"]

    def test_create_then_merge(self, admin):
        payload = {"date": "2026-01-10", "notes": f"TEST_{TAG}", "rows": [
            {"material_type": "PLA", "brand": BRAND, "color": "Rosso", "color_hex": "#FF0000", "finish": "normale", "quantity_spools": 2, "spool_weight_g": 1000, "spool_price": 20},
            {"material_type": "PETG", "brand": BRAND, "color": "Blu", "quantity_spools": 1, "spool_weight_g": 1000, "spool_price": 25},
            {"material_type": "PLA", "brand": BRAND, "color": "", "quantity_spools": 1},  # skipped
        ]}
        r = admin.post(f"{BASE_URL}/api/filaments/bulk", json=payload)
        assert r.status_code == 200, r.text
        d = r.json()
        assert d == {"created": 2, "updated": 0, "purchases": 2, "total_spent": 65.0}
        fil = [f for f in admin.get(f"{BASE_URL}/api/filaments").json() if f.get("brand") == BRAND]
        assert len(fil) == 2
        red = next(f for f in fil if f["color"] == "Rosso")
        assert red["remaining_grams"] == 2000 and abs(red["cost_per_gram"] - 0.02) < 1e-9

        # merge case-insensitive: 1 spool of 1000g @ 30
        r2 = admin.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-11", "rows": [
            {"material_type": "pla", "brand": BRAND.upper(), "color": " rosso ", "quantity_spools": 1, "spool_weight_g": 1000, "spool_price": 30}]})
        assert r2.status_code == 200, r2.text
        assert r2.json()["created"] == 0 and r2.json()["updated"] == 1
        fil = [f for f in admin.get(f"{BASE_URL}/api/filaments").json() if (f.get("brand") or "").lower() == BRAND.lower()]
        assert len(fil) == 2, "no duplicate"
        red = next(f for f in fil if f["color"] == "Rosso")
        assert red["remaining_grams"] == 3000
        expected = (2000 * 0.02 + 1000 * 0.03) / 3000
        assert abs(red["cost_per_gram"] - expected) < 1e-6
        assert abs(red["spool_price"] - round(expected * 1000, 2)) < 0.01

        purch = [p for p in admin.get(f"{BASE_URL}/api/purchases").json() if (p.get("brand") or "").lower() == BRAND.lower()]
        assert len(purch) == 3
        p_red = next(p for p in purch if p["date"] == "2026-01-10" and p["color"] == "Rosso")
        assert p_red["quantity_spools"] == 2 and p_red["price_total"] == 40 and p_red["grams_total"] == 2000
        assert p_red["notes"] == f"TEST_{TAG}"

    def test_same_batch_duplicates_merge(self, admin):
        row = {"material_type": "ASA", "brand": BRAND, "color": "Nero", "quantity_spools": 1, "spool_weight_g": 500, "spool_price": 10}
        r = admin.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-12", "rows": [row, dict(row)]})
        assert r.status_code == 200
        assert r.json()["created"] == 1 and r.json()["updated"] == 1
        fil = [f for f in admin.get(f"{BASE_URL}/api/filaments").json() if f.get("brand") == BRAND and f["material_type"] == "ASA"]
        assert len(fil) == 1 and fil[0]["remaining_grams"] == 1000

    def test_unauth_bulk(self):
        r = requests.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-10", "rows": []})
        assert r.status_code in (401, 403)
