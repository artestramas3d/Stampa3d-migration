"""
Tests for Products CRUD, Public Listino, and Product Inquiry endpoints.
Covers multi-photo support (max 5) and legacy single photo compatibility.
"""
import os
import pytest
import requests
import base64

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://filament-profit.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

TEST_EMAIL = "testuser@example.com"
TEST_PASSWORD = "password123"

# tiny valid 1x1 PNG base64
TINY_PNG_B64 = "data:image/png;base64," + base64.b64encode(
    bytes.fromhex("89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000D49444154789C6300010000000500010D0A2DB40000000049454E44AE426082")
).decode()


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    r = s.post(f"{API}/auth/login", json={"email": TEST_EMAIL, "password": TEST_PASSWORD}, timeout=20)
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    return s


@pytest.fixture(scope="module")
def created_ids():
    return []


# ---------- Public listino ----------
class TestPublicListino:
    def test_get_public_listino_shape(self):
        r = requests.get(f"{API}/public/listino", timeout=20)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "brand_name" in data and isinstance(data["brand_name"], str)
        assert "primary_color" in data
        assert "products" in data and isinstance(data["products"], list)
        for p in data["products"]:
            assert "id" in p
            assert "photos" in p and isinstance(p["photos"], list)
            # legacy photo field should be set to first photo (or empty)
            assert "photo" in p


# ---------- Products CRUD ----------
class TestProductsCRUD:
    def test_create_product_with_multiple_photos(self, session, created_ids):
        payload = {
            "name": "TEST_Cubo Multi",
            "description": "Cubo decorativo con piu foto",
            "price": 19.9,
            "category": "Decorazioni",
            "materials": "PLA",
            "photos": [TINY_PNG_B64, TINY_PNG_B64, TINY_PNG_B64],
            "is_public": True
        }
        r = session.post(f"{API}/products", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["name"] == payload["name"]
        assert isinstance(body.get("photos"), list)
        assert len(body["photos"]) == 3
        assert body.get("photo") == payload["photos"][0]
        assert "id" in body
        created_ids.append(body["id"])

    def test_get_products_returns_photos_array(self, session, created_ids):
        r = session.get(f"{API}/products", timeout=20)
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        # find ours
        ours = [p for p in items if p["id"] in created_ids]
        assert len(ours) >= 1
        for p in ours:
            assert isinstance(p.get("photos"), list)
            assert len(p["photos"]) >= 1
            assert p.get("photo") == p["photos"][0]

    def test_create_product_legacy_photo_only(self, session, created_ids):
        # send only legacy `photo` field; server should populate photos array
        payload = {
            "name": "TEST_Legacy Photo Product",
            "description": "Legacy",
            "price": 5.0,
            "category": "Misc",
            "materials": "PETG",
            "photo": TINY_PNG_B64,
            "is_public": True
        }
        r = session.post(f"{API}/products", json=payload, timeout=20)
        assert r.status_code == 200, r.text
        body = r.json()
        assert isinstance(body.get("photos"), list) and len(body["photos"]) == 1
        assert body["photos"][0] == TINY_PNG_B64
        created_ids.append(body["id"])

    def test_update_product_photos(self, session, created_ids):
        assert created_ids, "no created product"
        pid = created_ids[0]
        r = session.put(f"{API}/products/{pid}", json={
            "name": "TEST_Cubo Multi Updated",
            "photos": [TINY_PNG_B64, TINY_PNG_B64]
        }, timeout=20)
        assert r.status_code == 200, r.text
        # verify via GET list
        r2 = session.get(f"{API}/products", timeout=20)
        assert r2.status_code == 200
        match = [p for p in r2.json() if p["id"] == pid]
        assert match, "updated product not found"
        assert match[0]["name"] == "TEST_Cubo Multi Updated"
        assert len(match[0]["photos"]) == 2

    def test_public_listino_includes_created_public_product(self, created_ids):
        r = requests.get(f"{API}/public/listino", timeout=20)
        assert r.status_code == 200
        ids_in_listino = [p["id"] for p in r.json()["products"]]
        # at least one of ours should appear
        assert any(cid in ids_in_listino for cid in created_ids)

    def test_products_requires_auth(self):
        r = requests.get(f"{API}/products", timeout=20)
        # Should reject (401/403)
        assert r.status_code in (401, 403), r.status_code


# ---------- Product Inquiry ----------
class TestProductInquiry:
    def test_inquiry_for_product(self, session, created_ids):
        assert created_ids
        pid = created_ids[0]
        payload = {
            "product_id": pid,
            "product_name": "TEST_Cubo Multi Updated",
            "customer_name": "TEST Mario Rossi",
            "customer_email": "mario.test@example.com",
            "customer_phone": "+39 333 1234567",
            "message": "Vorrei acquistare questo prodotto",
            "is_custom": False
        }
        r = requests.post(f"{API}/public/product-inquiry", json=payload, timeout=30)
        assert r.status_code == 200, r.text
        body = r.json()
        assert "message" in body
        assert "successo" in body["message"].lower() or "inviata" in body["message"].lower()

    def test_custom_inquiry_no_product_id(self):
        payload = {
            "customer_name": "TEST Luigi Bianchi",
            "customer_email": "luigi.test@example.com",
            "customer_phone": "",
            "message": "Vorrei un prodotto personalizzato a forma di drago",
            "is_custom": True
        }
        r = requests.post(f"{API}/public/product-inquiry", json=payload, timeout=30)
        assert r.status_code == 200, r.text

    def test_inquiry_missing_required_fields(self):
        # missing customer_email and message
        r = requests.post(f"{API}/public/product-inquiry", json={"customer_name": "X"}, timeout=20)
        assert r.status_code in (400, 422), r.status_code


# ---------- Cleanup ----------
class TestZCleanup:
    def test_delete_created_products(self, session, created_ids):
        for pid in created_ids:
            r = session.delete(f"{API}/products/{pid}", timeout=20)
            assert r.status_code == 200, f"delete failed {pid} -> {r.status_code} {r.text}"
        # verify deletion
        r2 = session.get(f"{API}/products", timeout=20)
        assert r2.status_code == 200
        remaining = [p for p in r2.json() if p["id"] in created_ids]
        assert not remaining
