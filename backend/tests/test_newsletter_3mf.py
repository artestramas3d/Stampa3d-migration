"""
Tests for new features (iteration 6):
- Newsletter improvements: is_html, recipient_ids, scheduled_at
- 3MF import endpoint
"""
import os
import io
import zipfile
import json
import pytest
import requests
from datetime import datetime, timezone, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://filament-profit.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


# ---------- Fixtures ----------

@pytest.fixture(scope="module")
def admin_session():
    """Login admin via cookie-based session (httpOnly cookies)."""
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    if r.status_code != 200:
        pytest.skip(f"Admin login failed: {r.status_code} {r.text}")
    return s


@pytest.fixture(scope="module")
def admin_token(admin_session):
    """Pass-through alias - returns cookie session for upload tests."""
    return admin_session


# ---------- Newsletter Tests ----------

class TestNewsletter:
    """Newsletter API tests with HTML, recipient_ids, and scheduling"""

    def test_admin_users_endpoint(self, admin_session):
        """Pre-req: admin can fetch users list (used for recipient picker)."""
        r = admin_session.get(f"{API}/admin/users")
        assert r.status_code == 200
        users = r.json()
        assert isinstance(users, list)
        assert len(users) >= 1
        # Validate shape needed by frontend
        first = users[0]
        assert "id" in first
        assert "email" in first

    def test_get_newsletters_empty_or_list(self, admin_session):
        r = admin_session.get(f"{API}/admin/newsletters")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_create_newsletter_html_all_recipients(self, admin_session):
        """Send HTML newsletter to all verified users."""
        payload = {
            "subject": "TEST_HTML Newsletter",
            "body": "<h2>Hello</h2><p>This is <b>bold</b> and <i>italic</i>.</p>",
            "is_html": True,
            "recipient_ids": [],
            "scheduled_at": None,
        }
        r = admin_session.post(f"{API}/admin/newsletters", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["subject"] == payload["subject"]
        assert data["status"] == "sent"
        assert "recipients_count" in data
        assert data["recipients_count"] >= 1
        assert "id" in data
        # Verify persistence
        list_r = admin_session.get(f"{API}/admin/newsletters")
        ids = [n["id"] for n in list_r.json()]
        assert data["id"] in ids

    def test_create_newsletter_text_targeted(self, admin_session):
        """Send plain-text newsletter to specific user(s) via recipient_ids."""
        users = admin_session.get(f"{API}/admin/users").json()
        target_id = users[0]["id"]

        payload = {
            "subject": "TEST_TARGETED Plain",
            "body": "Plain text body for targeted user.",
            "is_html": False,
            "recipient_ids": [target_id],
            "scheduled_at": None,
        }
        r = admin_session.post(f"{API}/admin/newsletters", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["recipients_count"] == 1
        assert data["status"] == "sent"

    def test_create_newsletter_scheduled(self, admin_session):
        """Schedule newsletter for future delivery."""
        future = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
        payload = {
            "subject": "TEST_SCHEDULED",
            "body": "<p>Scheduled HTML</p>",
            "is_html": True,
            "recipient_ids": [],
            "scheduled_at": future,
        }
        r = admin_session.post(f"{API}/admin/newsletters", json=payload)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["status"] == "scheduled"
        assert data["scheduled_at"] == future
        nl_id = data["id"]

        # Cleanup
        d = admin_session.delete(f"{API}/admin/newsletters/{nl_id}")
        assert d.status_code == 200

    def test_newsletter_history_strips_html(self, admin_session):
        """Verify storico returns body so frontend can strip HTML for preview."""
        r = admin_session.get(f"{API}/admin/newsletters")
        assert r.status_code == 200
        for nl in r.json():
            assert "body" in nl
            assert "subject" in nl
            assert "status" in nl

    def test_newsletter_requires_admin(self):
        """Without auth, must not return 200."""
        r = requests.post(
            f"{API}/admin/newsletters",
            json={"subject": "x", "body": "y", "is_html": False, "recipient_ids": [], "scheduled_at": None},
        )
        assert r.status_code in (401, 403)


# ---------- 3MF Import Tests ----------

def _make_bambu_3mf_bytes():
    """Create a minimal Bambu Studio-style .3mf with plate JSON."""
    buf = io.BytesIO()
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        plate = {
            "prediction": 9300,  # seconds = 2.58h
            "filament": [
                {"type": "PLA", "color": "#FF0000", "used_g": 25.5},
                {"type": "PETG", "color": "#00FF00", "used_g": 10.2},
            ],
        }
        zf.writestr("Metadata/plate_1.json", json.dumps(plate))
    return buf.getvalue()


def _make_creality_printticket_3mf():
    """Creality Print PrintTicket.xml style."""
    buf = io.BytesIO()
    xml = """<?xml version="1.0" encoding="UTF-8"?>
<PrintTicket>
  <EstimatedPrintTime>7200</EstimatedPrintTime>
  <Weight>30.5</Weight>
</PrintTicket>"""
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("3D/PrintTicket.xml", xml)
    return buf.getvalue()


def _make_gcode_3mf():
    """Slicer with embedded gcode comments (Creality format)."""
    buf = io.BytesIO()
    gcode = """;Generated by Creality Print
;TIME:9185
;Filament Weight:25.58
G1 X0 Y0
"""
    with zipfile.ZipFile(buf, "w", zipfile.ZIP_DEFLATED) as zf:
        zf.writestr("Metadata/plate_1.gcode", gcode)
    return buf.getvalue()


class TestImport3MF:
    """3MF multi-slicer parser tests"""

    def test_import_3mf_requires_auth(self):
        r = requests.post(f"{API}/import/3mf", files={"file": ("a.3mf", b"x", "application/octet-stream")})
        assert r.status_code in (401, 403)

    def test_import_3mf_rejects_non_3mf(self, admin_token):
        files = {"file": ("test.txt", b"hello", "text/plain")}
        r = admin_token.post(f"{API}/import/3mf", files=files, headers={"Content-Type": None})
        assert r.status_code == 400

    def test_import_3mf_bambu_plate_json(self, admin_token):
        content = _make_bambu_3mf_bytes()
        files = {"file": ("test.3mf", content, "application/octet-stream")}
        # Override Content-Type for multipart upload
        s = admin_token
        r = s.post(f"{API}/import/3mf", files=files, headers={"Content-Type": None})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total_time_seconds"] == 9300
        assert round(data["total_time_hours"], 2) == 2.58
        assert data["total_filament_grams"] == 35.7
        assert len(data["plates"]) == 1

    def test_import_3mf_creality_printticket(self, admin_token):
        """Creality Print .3mf used to return 0 - bug fix for this."""
        content = _make_creality_printticket_3mf()
        files = {"file": ("creality.3mf", content, "application/octet-stream")}
        r = admin_token.post(f"{API}/import/3mf", files=files, headers={"Content-Type": None})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total_time_seconds"] == 7200, f"expected 7200, got {data}"
        assert data["total_filament_grams"] == 30.5, f"expected 30.5, got {data}"
        assert len(data["plates"]) == 1

    def test_import_3mf_gcode_fallback(self, admin_token):
        """Fallback strategy 5: gcode comments."""
        content = _make_gcode_3mf()
        files = {"file": ("gcode.3mf", content, "application/octet-stream")}
        r = admin_token.post(f"{API}/import/3mf", files=files, headers={"Content-Type": None})
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["total_time_seconds"] == 9185
        assert data["total_filament_grams"] == 25.58 or data["total_filament_grams"] == 25.6
        assert len(data["plates"]) >= 1

    def test_import_3mf_empty_zip_returns_400(self, admin_token):
        buf = io.BytesIO()
        with zipfile.ZipFile(buf, "w") as zf:
            zf.writestr("readme.txt", "no slicer data")
        files = {"file": ("empty.3mf", buf.getvalue(), "application/octet-stream")}
        r = admin_token.post(f"{API}/import/3mf", files=files, headers={"Content-Type": None})
        assert r.status_code == 400
