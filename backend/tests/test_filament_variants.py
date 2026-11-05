# Tests: Filament 'variant' feature - CRUD, bulk merge by variant, purchases variant, presets variant, calculate details
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
ADMIN = {"email": "testuser@example.com", "password": "password123"}
TAG = uuid.uuid4().hex[:6]
BRAND = f"TEST_Var_{TAG}"
CREATED_PRINTERS = []


@pytest.fixture(scope="module")
def s():
    sess = requests.Session()
    r = sess.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.skip(f"login failed: {r.status_code}")
    yield sess
    for f in sess.get(f"{BASE_URL}/api/filaments").json():
        if TAG in (f.get("brand") or ""):
            sess.delete(f"{BASE_URL}/api/filaments/{f['id']}")
    for p in sess.get(f"{BASE_URL}/api/purchases").json():
        if TAG in (p.get("brand") or ""):
            sess.delete(f"{BASE_URL}/api/purchases/{p['id']}")
    for p in sess.get(f"{BASE_URL}/api/filament-presets").json():
        if TAG in p["name"]:
            sess.delete(f"{BASE_URL}/api/filament-presets/{p['id']}")
    for pid in CREATED_PRINTERS:
        sess.delete(f"{BASE_URL}/api/printers/{pid}")


def _mine(s, color=None):
    return [f for f in s.get(f"{BASE_URL}/api/filaments").json() if f.get("brand") == BRAND and (color is None or f["color"] == color)]


# --- Filament CRUD with variant ---
class TestFilamentVariantCRUD:
    def test_create_get_update(self, s):
        r = s.post(f"{BASE_URL}/api/filaments", json={"material_type": "PLA", "variant": "  Silk ", "color": "Oro", "brand": BRAND,
                                                       "spool_weight_g": 1000, "spool_price": 25, "finish": "silk"})
        assert r.status_code == 200, r.text
        d = r.json()
        assert d["variant"] == "Silk" and "_id" not in d
        fid = d["id"]
        got = [f for f in _mine(s) if f["id"] == fid][0]
        assert got["variant"] == "Silk" and got["finish"] == "silk"
        r = s.put(f"{BASE_URL}/api/filaments/{fid}", json={"variant": "Matte"})
        assert r.status_code == 200
        got = [f for f in _mine(s) if f["id"] == fid][0]
        assert got["variant"] == "Matte" and got["color"] == "Oro"
        # clearing variant with empty string
        s.put(f"{BASE_URL}/api/filaments/{fid}", json={"variant": ""})
        got = [f for f in _mine(s) if f["id"] == fid][0]
        assert got["variant"] == ""
        s.delete(f"{BASE_URL}/api/filaments/{fid}")

    def test_legacy_filaments_have_variant_key(self, s):
        fs = s.get(f"{BASE_URL}/api/filaments").json()
        assert all("variant" in f and isinstance(f["variant"], str) for f in fs)


# --- Bulk purchase merge by variant ---
class TestBulkVariant:
    def test_distinct_and_merge(self, s):
        color = f"Oro{TAG}"
        rows = [
            {"material_type": "PLA", "variant": "Silk", "brand": BRAND, "color": color, "quantity_spools": 1, "spool_weight_g": 1000, "spool_price": 20},
            {"material_type": "PLA", "variant": "Matte", "brand": BRAND, "color": color, "quantity_spools": 1, "spool_weight_g": 1000, "spool_price": 18},
            {"material_type": "PLA", "variant": "", "brand": BRAND, "color": color, "quantity_spools": 1, "spool_weight_g": 1000, "spool_price": 15},
        ]
        r = s.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-10", "notes": "TEST", "rows": rows})
        assert r.status_code == 200, r.text
        assert r.json()["created"] == 3 and r.json()["updated"] == 0
        assert len(_mine(s, color)) == 3
        # 'silk' lowercase merges into 'Silk'; no-variant merges into no-variant
        r = s.post(f"{BASE_URL}/api/filaments/bulk", json={"date": "2026-01-11", "rows": [
            {"material_type": "pla", "variant": "silk", "brand": BRAND.lower(), "color": color.upper(), "quantity_spools": 2, "spool_weight_g": 1000, "spool_price": 30},
            {"material_type": "PLA", "variant": "", "brand": BRAND, "color": color, "quantity_spools": 1, "spool_weight_g": 1000, "spool_price": 15},
        ]})
        assert r.status_code == 200, r.text
        assert r.json()["created"] == 0 and r.json()["updated"] == 2
        mine = _mine(s, color)
        assert len(mine) == 3
        silk = [f for f in mine if f["variant"] == "Silk"][0]
        assert silk["remaining_grams"] == 3000
        assert abs(silk["cost_per_gram"] - (20 + 60) / 3000) < 1e-6
        plain = [f for f in mine if f["variant"] == ""][0]
        assert plain["remaining_grams"] == 2000
        matte = [f for f in mine if f["variant"] == "Matte"][0]
        assert matte["remaining_grams"] == 1000

    def test_purchases_store_variant(self, s):
        ps = [p for p in s.get(f"{BASE_URL}/api/purchases").json() if TAG in (p.get("brand") or "")]
        variants = sorted(p["variant"] for p in ps)
        assert len(ps) == 5
        assert variants == ["", "", "Matte", "Silk", "silk"]

    def test_legacy_purchases_have_variant_key(self, s):
        ps = s.get(f"{BASE_URL}/api/purchases").json()
        assert all("variant" in p for p in ps)


# --- Presets with variant ---
class TestPresetVariant:
    def test_preset_variant_roundtrip(self, s):
        name = f"TEST_PresetVar_{TAG}"
        r = s.post(f"{BASE_URL}/api/filament-presets", json={"name": name, "material_type": "PLA", "variant": "Metal", "brand": BRAND, "spool_price": 22, "finish": "metallic"})
        assert r.status_code == 200, r.text
        assert r.json()["variant"] == "Metal"
        got = [p for p in s.get(f"{BASE_URL}/api/filament-presets").json() if p["name"] == name][0]
        assert got["variant"] == "Metal" and got["finish"] == "metallic"
        r = s.post(f"{BASE_URL}/api/filament-presets", json={"name": name.lower(), "material_type": "PLA", "variant": "Galaxy", "brand": BRAND})
        assert r.status_code == 200 and r.json()["id"] == got["id"] and r.json()["variant"] == "Galaxy"


# --- Calculator details include variant ---
class TestCalculateVariant:
    def test_calc_details_variant(self, s):
        f = s.post(f"{BASE_URL}/api/filaments", json={"material_type": "PETG", "variant": "HF", "color": "Nero", "brand": BRAND,
                                                       "spool_weight_g": 1000, "spool_price": 20}).json()
        pr = s.post(f"{BASE_URL}/api/printers", json={"printer_name": f"TEST_Printer_{TAG}", "printer_cost": 500, "estimated_life_hours": 5000,
                                                      "electricity_cost_kwh": 0.3, "average_power_watts": 150})
        assert pr.status_code == 200, pr.text
        CREATED_PRINTERS.append(pr.json()["id"])
        r = s.post(f"{BASE_URL}/api/calculate", json={"filaments": [{"filament_id": f["id"], "grams_used": 100}], "print_time_hours": 2, "printer_id": pr.json()["id"]})
        assert r.status_code == 200, r.text
        det = r.json()["filaments_details"][0]
        assert det["variant"] == "HF" and det["material_type"] == "PETG" and det["total"] == 2.0
