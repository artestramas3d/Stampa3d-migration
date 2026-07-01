"""Sprint 1 - New affiliate features: stats endpoint + new placements (filaments_low_stock, dashboard)."""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://filament-profit.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "testuser@example.com"
ADMIN_PASSWORD = "password123"


@pytest.fixture(scope="module")
def admin_session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    r = s.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, f"Admin login failed: {r.status_code} {r.text}"
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200
    assert me.json().get("is_admin") is True
    return s


@pytest.fixture(scope="module")
def anon_session():
    return requests.Session()


# ---------------- Stats endpoint auth gating ----------------

class TestStatsAuth:
    def test_stats_requires_auth(self, anon_session):
        r = anon_session.get(f"{API}/admin/affiliate-links/stats?days=7")
        assert r.status_code in (401, 403), f"expected 401/403, got {r.status_code} {r.text}"


# ---------------- Stats endpoint contract ----------------

class TestStatsContract:
    def test_stats_default_days_shape(self, admin_session):
        r = admin_session.get(f"{API}/admin/affiliate-links/stats?days=7")
        assert r.status_code == 200, r.text
        data = r.json()
        # required keys
        for k in ("days", "daily", "top", "total_clicks_period", "total_clicks_all_time"):
            assert k in data, f"missing key {k} in {data}"
        assert data["days"] == 7
        assert isinstance(data["daily"], list)
        assert isinstance(data["top"], list)
        assert isinstance(data["total_clicks_period"], int)
        assert isinstance(data["total_clicks_all_time"], int)
        # daily shape
        for d in data["daily"]:
            assert "date" in d and "clicks" in d
            assert isinstance(d["clicks"], int)
        # top shape
        for t in data["top"]:
            for f in ("id", "title", "url", "placements", "is_active", "clicks_total", "clicks_period"):
                assert f in t, f"missing '{f}' in top item: {t}"
            assert isinstance(t["placements"], list)
            assert isinstance(t["clicks_total"], int)
            assert isinstance(t["clicks_period"], int)

    def test_days_clamped_low(self, admin_session):
        # days=0 -> clamped to 1
        r = admin_session.get(f"{API}/admin/affiliate-links/stats?days=0")
        assert r.status_code == 200
        assert r.json()["days"] == 1

    def test_days_clamped_high(self, admin_session):
        # days=9999 -> clamped to 90
        r = admin_session.get(f"{API}/admin/affiliate-links/stats?days=9999")
        assert r.status_code == 200
        assert r.json()["days"] == 90

    def test_days_negative_clamped(self, admin_session):
        r = admin_session.get(f"{API}/admin/affiliate-links/stats?days=-5")
        assert r.status_code == 200
        assert r.json()["days"] == 1

    def test_days_14_and_30(self, admin_session):
        for d in (14, 30):
            r = admin_session.get(f"{API}/admin/affiliate-links/stats?days={d}")
            assert r.status_code == 200
            assert r.json()["days"] == d


# ---------------- New placements ----------------

class TestNewPlacements:
    def test_filaments_low_stock_returns_200(self, anon_session):
        r = anon_session.get(f"{API}/affiliate-links/filaments_low_stock")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_dashboard_returns_200(self, anon_session):
        r = anon_session.get(f"{API}/affiliate-links/dashboard")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_invalid_placement_still_400(self, anon_session):
        r = anon_session.get(f"{API}/affiliate-links/xxx")
        assert r.status_code == 400


# ---------------- End-to-end: create link with new placements + click tracking ----------------

class TestEndToEndNewPlacements:
    def test_create_link_low_stock_and_track_click(self, admin_session, anon_session):
        payload = {
            "title": "TEST_LowStockCard",
            "url": "https://example.com/low-stock-affiliate",
            "description": "Sponsor scorte basse",
            "placements": ["filaments_low_stock"],
            "is_active": True,
            "sort_order": 1,
        }
        r = admin_session.post(f"{API}/admin/affiliate-links", json=payload)
        assert r.status_code == 200, r.text
        link_id = r.json()["id"]
        try:
            # Verify appears in public filaments_low_stock listing
            lst = anon_session.get(f"{API}/affiliate-links/filaments_low_stock")
            assert lst.status_code == 200
            titles = [i["title"] for i in lst.json()]
            assert "TEST_LowStockCard" in titles

            # Must NOT appear in a different placement (dashboard)
            lst2 = anon_session.get(f"{API}/affiliate-links/dashboard")
            assert lst2.status_code == 200
            titles2 = [i["title"] for i in lst2.json()]
            assert "TEST_LowStockCard" not in titles2

            # Track click and verify stats endpoint reflects it
            before_stats = admin_session.get(f"{API}/admin/affiliate-links/stats?days=7").json()
            before_period = before_stats["total_clicks_period"]

            click = anon_session.post(f"{API}/affiliate-links/{link_id}/click")
            assert click.status_code == 200
            assert click.json().get("url") == payload["url"]

            # small wait for aggregation consistency (usually immediate)
            time.sleep(0.5)
            after_stats = admin_session.get(f"{API}/admin/affiliate-links/stats?days=7").json()
            assert after_stats["total_clicks_period"] >= before_period + 1

            # verify link visible in top list with clicks_period >= 1
            top_ids = {t["id"]: t for t in after_stats["top"]}
            assert link_id in top_ids, f"created link not in top: {list(top_ids.keys())}"
            assert top_ids[link_id]["clicks_period"] >= 1
            assert top_ids[link_id]["clicks_total"] >= 1
        finally:
            admin_session.delete(f"{API}/admin/affiliate-links/{link_id}")

    def test_create_link_dashboard_placement(self, admin_session, anon_session):
        payload = {
            "title": "TEST_DashboardCard",
            "url": "https://example.com/dashboard-affiliate",
            "placements": ["dashboard"],
            "is_active": True,
            "sort_order": 1,
        }
        r = admin_session.post(f"{API}/admin/affiliate-links", json=payload)
        assert r.status_code == 200, r.text
        lid = r.json()["id"]
        try:
            lst = anon_session.get(f"{API}/affiliate-links/dashboard")
            titles = [i["title"] for i in lst.json()]
            assert "TEST_DashboardCard" in titles
        finally:
            admin_session.delete(f"{API}/admin/affiliate-links/{lid}")
