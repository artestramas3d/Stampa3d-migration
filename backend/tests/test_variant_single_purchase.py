# Tests: single purchase (POST /api/purchases, Acquisti form) vs filament variants - should not merge plain PLA into PLA Silk
import os
import uuid
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL').rstrip('/')
TAG = uuid.uuid4().hex[:6]
BRAND = f"TEST_SP_{TAG}"


def test_single_purchase_does_not_merge_into_variant():
    s = requests.Session()
    assert s.post(f"{BASE_URL}/api/auth/login", json={"email": "testuser@example.com", "password": "password123"}).status_code == 200
    f = s.post(f"{BASE_URL}/api/filaments", json={"material_type": "PLA", "variant": "Silk", "color": "Oro", "brand": BRAND, "spool_weight_g": 1000, "spool_price": 25}).json()
    p = s.post(f"{BASE_URL}/api/purchases", json={"date": "2026-01-10", "material_type": "PLA", "brand": BRAND, "color": "Oro",
                                                   "quantity_spools": 1, "price_total": 15, "grams_total": 1000, "create_filament": True}).json()
    try:
        silk = [x for x in s.get(f"{BASE_URL}/api/filaments").json() if x["id"] == f["id"]][0]
        assert silk["remaining_grams"] == 1000, f"plain PLA purchase merged into PLA Silk (remaining={silk['remaining_grams']}, linked={p.get('filament_id') == f['id']})"
    finally:
        s.delete(f"{BASE_URL}/api/purchases/{p['id']}")
        for x in s.get(f"{BASE_URL}/api/filaments").json():
            if x.get("brand") == BRAND:
                s.delete(f"{BASE_URL}/api/filaments/{x['id']}")
