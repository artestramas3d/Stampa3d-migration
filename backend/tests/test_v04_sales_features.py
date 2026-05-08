"""
Tests for V0.4 features (iteration 7):
- POST /api/sales with quantity > 1 creates N individual rows with batch_id, batch_index, batch_total
- POST /api/sales with quantity = 1 creates 1 row
- PATCH /api/sales/{id} updates sale_price + product_name and recalculates net_profit
- POST /api/import/3mf with unsliced file (only .model, no gcode/plate_json) returns clear error
"""
import os
import io
import zipfile
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def setup_resources(session):
    """Ensure at least one printer + filament exist; return their IDs."""
    # Printer
    pr = session.get(f"{API}/printers")
    pr.raise_for_status()
    printers = pr.json()
    if printers:
        printer_id = printers[0]["id"]
    else:
        cr = session.post(f"{API}/printers", json={
            "name": "TEST_Printer_v04",
            "electricity_cost_per_hour": 0.05,
            "depreciation_per_hour": 0.10,
        })
        cr.raise_for_status()
        printer_id = cr.json()["id"]

    # Filament
    fr = session.get(f"{API}/filaments")
    fr.raise_for_status()
    filaments = fr.json()
    suitable = [f for f in filaments if f.get("remaining_grams", 0) > 100]
    if suitable:
        filament_id = suitable[0]["id"]
    else:
        # Create a purchase to obtain filament
        cp = session.post(f"{API}/purchases", json={
            "date": "2026-01-01",
            "supplier": "TEST_Supplier",
            "material_type": "PLA",
            "color": "TEST_Black",
            "brand": "TEST_Brand",
            "quantity_spools": 1,
            "grams_total": 1000,
            "price_total": 20.0,
        })
        cp.raise_for_status()
        fr2 = session.get(f"{API}/filaments")
        fr2.raise_for_status()
        suit2 = [f for f in fr2.json() if "TEST_Black" in f.get("color", "")]
        filament_id = suit2[0]["id"] if suit2 else fr2.json()[0]["id"]

    return {"printer_id": printer_id, "filament_id": filament_id}


@pytest.fixture(scope="module")
def created_ids():
    return {"sale_ids": []}


# ---------- Sales batch creation ----------

class TestSalesBatchCreation:
    def test_create_sale_quantity_1_creates_single_row(self, session, setup_resources, created_ids):
        payload = {
            "date": "2026-01-15",
            "product_name": "TEST_v04_single",
            "filaments": [{"filament_id": setup_resources["filament_id"], "grams_used": 10.0}],
            "print_time_hours": 1.0,
            "printer_id": setup_resources["printer_id"],
            "sale_price": 25.0,
            "quantity": 1,
        }
        r = session.post(f"{API}/sales", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "items" in data
        assert data["count"] == 1
        assert "batch_id" in data
        assert len(data["items"]) == 1
        item = data["items"][0]
        assert item["product_name"] == "TEST_v04_single"
        assert item["sale_price"] == 25.0
        assert item["batch_total"] == 1
        assert item["batch_index"] == 1
        created_ids["sale_ids"].append(item["id"])

    def test_create_sale_quantity_4_creates_4_rows(self, session, setup_resources, created_ids):
        payload = {
            "date": "2026-01-15",
            "product_name": "TEST_v04_batch",
            "filaments": [{"filament_id": setup_resources["filament_id"], "grams_used": 40.0}],
            "print_time_hours": 2.0,
            "printer_id": setup_resources["printer_id"],
            "sale_price": 100.0,
            "quantity": 4,
        }
        r = session.post(f"{API}/sales", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["count"] == 4
        assert len(data["items"]) == 4
        # Validate per-unit splitting
        prices = [it["sale_price"] for it in data["items"]]
        assert all(p == 25.0 for p in prices), prices  # 100/4
        grams = [it["grams_used"] for it in data["items"]]
        assert all(g == 10.0 for g in grams), grams  # 40/4
        # Validate batch fields
        batch_ids = {it["batch_id"] for it in data["items"]}
        assert len(batch_ids) == 1, "All items must share the same batch_id"
        indices = sorted(it["batch_index"] for it in data["items"])
        assert indices == [1, 2, 3, 4]
        for it in data["items"]:
            assert it["batch_total"] == 4
            assert it["quantity"] == 1  # individual row
            assert it["paid"] is False
            created_ids["sale_ids"].append(it["id"])

    def test_batch_items_independently_payable(self, session, created_ids):
        """Mark only 1 row of the batch as paid; sibling rows must remain unpaid."""
        # Use the last 4 added (the batch)
        ids = created_ids["sale_ids"][-4:]
        first = ids[0]
        r = session.patch(f"{API}/sales/{first}/paid", json={"paid": True})
        assert r.status_code == 200
        # Verify via GET /sales
        r2 = session.get(f"{API}/sales")
        assert r2.status_code == 200
        sales = {s["id"]: s for s in r2.json()}
        assert sales[first]["paid"] is True
        for sid in ids[1:]:
            assert sales[sid]["paid"] is False, f"Sibling {sid} should remain unpaid"


# ---------- PATCH /sales/{id} ----------

class TestUpdateSale:
    def test_patch_sale_price_recalculates_profit(self, session, setup_resources, created_ids):
        # Create a fresh sale
        payload = {
            "date": "2026-01-15",
            "product_name": "TEST_v04_to_edit",
            "filaments": [{"filament_id": setup_resources["filament_id"], "grams_used": 10.0}],
            "print_time_hours": 1.0,
            "printer_id": setup_resources["printer_id"],
            "sale_price": 30.0,
            "quantity": 1,
        }
        r = session.post(f"{API}/sales", json=payload)
        assert r.status_code == 200, r.text
        item = r.json()["items"][0]
        sid = item["id"]
        original_cost = item["total_cost"]
        created_ids["sale_ids"].append(sid)

        # PATCH price + name
        r2 = session.patch(f"{API}/sales/{sid}", json={
            "sale_price": 50.0,
            "product_name": "TEST_v04_edited"
        })
        assert r2.status_code == 200, r2.text

        # GET to verify persistence + recalculation
        r3 = session.get(f"{API}/sales")
        assert r3.status_code == 200
        match = next((s for s in r3.json() if s["id"] == sid), None)
        assert match is not None, "Edited sale not found in /sales"
        assert match["sale_price"] == 50.0
        assert match["product_name"] == "TEST_v04_edited"
        expected_profit = round(50.0 - original_cost, 2)
        assert abs(match["net_profit"] - expected_profit) < 0.02, (
            f"net_profit={match['net_profit']} expected~{expected_profit} cost={original_cost}"
        )

    def test_patch_sale_only_name(self, session, setup_resources, created_ids):
        payload = {
            "date": "2026-01-15",
            "product_name": "TEST_v04_name_only",
            "filaments": [{"filament_id": setup_resources["filament_id"], "grams_used": 5.0}],
            "print_time_hours": 0.5,
            "printer_id": setup_resources["printer_id"],
            "sale_price": 20.0,
            "quantity": 1,
        }
        r = session.post(f"{API}/sales", json=payload)
        sid = r.json()["items"][0]["id"]
        created_ids["sale_ids"].append(sid)

        r2 = session.patch(f"{API}/sales/{sid}", json={"product_name": "TEST_v04_renamed"})
        assert r2.status_code == 200

        r3 = session.get(f"{API}/sales")
        match = next((s for s in r3.json() if s["id"] == sid), None)
        assert match["product_name"] == "TEST_v04_renamed"
        assert match["sale_price"] == 20.0  # unchanged

    def test_patch_nonexistent_sale_returns_404(self, session):
        # 24-char fake ObjectId
        r = session.patch(f"{API}/sales/507f1f77bcf86cd799439011", json={"sale_price": 99.0})
        assert r.status_code == 404


# ---------- 3MF unsliced detection ----------

class TestUnsliced3MF:
    def _make_unsliced_3mf(self) -> bytes:
        """Build a fake .3mf with a 3D model file but NO gcode and NO plate JSON."""
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("[Content_Types].xml", "<?xml version='1.0'?><Types/>")
            zf.writestr("3D/3dmodel.model", "<?xml version='1.0'?><model/>")
        return buf.getvalue()

    def _make_empty_3mf(self) -> bytes:
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
            zf.writestr("[Content_Types].xml", "<?xml version='1.0'?><Types/>")
        return buf.getvalue()

    def test_unsliced_3mf_returns_specific_slicing_error(self, session):
        content = self._make_unsliced_3mf()
        files = {"file": ("unsliced.3mf", content, "application/octet-stream")}
        # Use raw session w/o JSON content-type
        s = requests.Session()
        s.cookies.update(session.cookies)
        r = s.post(f"{API}/import/3mf", files=files)
        assert r.status_code == 400, r.text
        detail = r.json().get("detail", "")
        # Must mention slicing explicitly
        assert "slicing" in detail.lower() or "slicer" in detail.lower(), \
            f"Expected slicing-related message, got: {detail}"

    def test_empty_3mf_returns_generic_error(self, session):
        content = self._make_empty_3mf()
        files = {"file": ("empty.3mf", content, "application/octet-stream")}
        s = requests.Session()
        s.cookies.update(session.cookies)
        r = s.post(f"{API}/import/3mf", files=files)
        assert r.status_code == 400


# ---------- Cleanup ----------

@pytest.fixture(scope="module", autouse=True)
def cleanup(request, session, created_ids):
    yield
    for sid in created_ids.get("sale_ids", []):
        try:
            session.delete(f"{API}/sales/{sid}")
        except Exception:
            pass
