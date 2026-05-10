"""
Phase 1 features test: Clients CRUD, Business Settings, Quote PDF, CSV Exports.
Test credentials from /app/memory/test_credentials.md
"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
if not BASE_URL:
    # Fallback to frontend .env in case env var not propagated to pytest shell
    with open("/app/frontend/.env") as f:
        for line in f:
            if line.startswith("REACT_APP_BACKEND_URL="):
                BASE_URL = line.split("=", 1)[1].strip().rstrip("/")
                break

EMAIL = "testuser@example.com"
PASSWORD = "password123"


@pytest.fixture(scope="module")
def auth_client():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{BASE_URL}/api/auth/login", json={"email": EMAIL, "password": PASSWORD})
    assert r.status_code == 200, f"Login failed: {r.status_code} {r.text}"
    token = r.json().get("access_token") or r.json().get("token")
    if token:
        s.headers.update({"Authorization": f"Bearer {token}"})
    return s


# ---------------- CLIENTS CRUD ----------------
class TestClientsCRUD:
    created_id = None

    def test_create_client(self, auth_client):
        payload = {
            "name": "TEST_Mario",
            "surname": "TEST_Rossi",
            "phone": "+39 333 1234567",
            "email": "test_mario@example.com",
            "address": "Via Roma 1, Milano",
            "notes": "Test client",
        }
        r = auth_client.post(f"{BASE_URL}/api/clients", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["name"] == "TEST_Mario"
        assert data["surname"] == "TEST_Rossi"
        assert "id" in data and isinstance(data["id"], str)
        assert "_id" not in data
        TestClientsCRUD.created_id = data["id"]

    def test_list_clients_includes_created(self, auth_client):
        r = auth_client.get(f"{BASE_URL}/api/clients")
        assert r.status_code == 200
        clients = r.json()
        assert isinstance(clients, list)
        ids = [c["id"] for c in clients]
        assert TestClientsCRUD.created_id in ids
        # ensure no Mongo _id leaked
        for c in clients:
            assert "_id" not in c

    def test_update_client(self, auth_client):
        cid = TestClientsCRUD.created_id
        r = auth_client.put(
            f"{BASE_URL}/api/clients/{cid}",
            json={
                "name": "TEST_Mario",
                "surname": "TEST_Rossi_Updated",
                "phone": "+39 333 9999999",
                "email": "test_mario@example.com",
                "address": "Via Roma 1, Milano",
                "notes": "Updated",
            },
        )
        assert r.status_code == 200
        # Verify by GET list
        r2 = auth_client.get(f"{BASE_URL}/api/clients")
        target = next((c for c in r2.json() if c["id"] == cid), None)
        assert target is not None
        assert target["surname"] == "TEST_Rossi_Updated"
        assert target["phone"] == "+39 333 9999999"

    def test_get_client_sales(self, auth_client):
        cid = TestClientsCRUD.created_id
        r = auth_client.get(f"{BASE_URL}/api/clients/{cid}/sales")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_update_nonexistent_client_returns_404(self, auth_client):
        r = auth_client.put(
            f"{BASE_URL}/api/clients/507f1f77bcf86cd799439011",
            json={"name": "x", "surname": "", "phone": "", "email": "", "address": "", "notes": ""},
        )
        assert r.status_code == 404

    def test_delete_client(self, auth_client):
        cid = TestClientsCRUD.created_id
        r = auth_client.delete(f"{BASE_URL}/api/clients/{cid}")
        assert r.status_code == 200
        # Verify removed
        r2 = auth_client.get(f"{BASE_URL}/api/clients")
        ids = [c["id"] for c in r2.json()]
        assert cid not in ids

    def test_delete_nonexistent_client_returns_404(self, auth_client):
        r = auth_client.delete(f"{BASE_URL}/api/clients/507f1f77bcf86cd799439011")
        assert r.status_code == 404


# ---------------- BUSINESS SETTINGS ----------------
class TestBusinessSettings:
    def test_get_business_settings(self, auth_client):
        r = auth_client.get(f"{BASE_URL}/api/business-settings")
        assert r.status_code == 200
        data = r.json()
        # All keys present
        for k in ["company_name", "address", "city", "zip_code", "vat_number", "phone", "email", "logo_base64"]:
            assert k in data

    def test_update_business_settings_and_verify(self, auth_client):
        payload = {
            "company_name": "TEST_ArtESTRAMAS 3D",
            "address": "Via Test 42",
            "city": "Roma",
            "zip_code": "00100",
            "vat_number": "IT12345678901",
            "phone": "+39 06 1234567",
            "email": "info@test.com",
            "logo_base64": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgAAIAAAUAAeImBZsAAAAASUVORK5CYII=",
        }
        r = auth_client.put(f"{BASE_URL}/api/business-settings", json=payload)
        assert r.status_code == 200
        # Verify persisted
        r2 = auth_client.get(f"{BASE_URL}/api/business-settings")
        data = r2.json()
        assert data["company_name"] == "TEST_ArtESTRAMAS 3D"
        assert data["vat_number"] == "IT12345678901"
        assert data["logo_base64"].startswith("data:image/png;base64,")


# ---------------- QUOTE PDF ----------------
class TestQuotePDF:
    def test_generate_pdf_with_manual_client(self, auth_client):
        payload = {
            "client_id": None,
            "client_name": "TEST_Cliente Manuale",
            "items": [
                {"description": "Stampa 3D Vaso", "quantity": 2, "unit_price": 15.5},
                {"description": "Portachiavi personalizzato", "quantity": 5, "unit_price": 3.0},
            ],
            "notes": "Note di test",
            "valid_days": 30,
        }
        r = auth_client.post(f"{BASE_URL}/api/quotes/generate-pdf", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "html" in data and "<html" in data["html"].lower()
        assert "quote_number" in data and data["quote_number"].startswith("PRV-")
        # Total = 2*15.5 + 5*3.0 = 31 + 15 = 46.00
        assert data["total"] == 46.00
        # Verify content has product descriptions but NO cost mentions (only price shown)
        assert "Stampa 3D Vaso" in data["html"]
        assert "Portachiavi personalizzato" in data["html"]
        # Total amount must appear in html
        assert "46.00" in data["html"]
        # Internal costs/material/profit fields should NOT leak
        for forbidden in ["cost_per_gram", "filament_cost", "total_cost", "net_profit"]:
            assert forbidden not in data["html"]

    def test_generate_pdf_with_client_id(self, auth_client):
        # Create a temporary client
        c = auth_client.post(
            f"{BASE_URL}/api/clients",
            json={"name": "TEST_Q", "surname": "TEST_Buyer", "phone": "", "email": "q@e.it", "address": "Via Q 1", "notes": ""},
        ).json()
        cid = c["id"]
        try:
            r = auth_client.post(
                f"{BASE_URL}/api/quotes/generate-pdf",
                json={
                    "client_id": cid,
                    "client_name": "",
                    "items": [{"description": "Item A", "quantity": 1, "unit_price": 100.0}],
                    "notes": "",
                    "valid_days": 15,
                },
            )
            assert r.status_code == 200, r.text
            data = r.json()
            assert data["total"] == 100.0
            # Client name from clients collection should appear
            assert "TEST_Q" in data["html"]
        finally:
            auth_client.delete(f"{BASE_URL}/api/clients/{cid}")

    def test_get_quotes_history(self, auth_client):
        r = auth_client.get(f"{BASE_URL}/api/quotes")
        assert r.status_code == 200
        quotes = r.json()
        assert isinstance(quotes, list)
        assert len(quotes) >= 1
        # Ensure no _id leaked
        for q in quotes:
            assert "_id" not in q
            assert "quote_number" in q
            assert "subtotal" in q


# ---------------- CSV EXPORTS ----------------
class TestCSVExports:
    def test_export_filaments_csv(self, auth_client):
        r = auth_client.get(f"{BASE_URL}/api/export/filaments")
        assert r.status_code == 200
        assert "text/csv" in r.headers.get("content-type", "").lower()
        assert "attachment" in r.headers.get("content-disposition", "").lower()
        assert "filamenti.csv" in r.headers.get("content-disposition", "").lower()
        content = r.content.decode("utf-8-sig")
        first_line = content.split("\n")[0]
        # Headers in Italian
        for h in ["Materiale", "Colore", "Brand", "Peso Bobina", "Prezzo Bobina"]:
            assert h in first_line

    def test_export_clients_csv(self, auth_client):
        # Ensure at least 1 client exists
        c = auth_client.post(
            f"{BASE_URL}/api/clients",
            json={"name": "TEST_Export", "surname": "TEST_User", "phone": "111", "email": "e@e.it", "address": "addr", "notes": "n"},
        ).json()
        cid = c["id"]
        try:
            r = auth_client.get(f"{BASE_URL}/api/export/clients")
            assert r.status_code == 200
            assert "text/csv" in r.headers.get("content-type", "").lower()
            assert "clienti.csv" in r.headers.get("content-disposition", "").lower()
            content = r.content.decode("utf-8-sig")
            assert "Nome" in content and "Cognome" in content
            assert "TEST_Export" in content
        finally:
            auth_client.delete(f"{BASE_URL}/api/clients/{cid}")
