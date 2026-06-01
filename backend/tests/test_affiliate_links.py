"""Test suite for Affiliate Links feature (admin CRUD + public endpoints)."""
import os
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
    # confirm admin flag
    me = s.get(f"{API}/auth/me")
    assert me.status_code == 200, me.text
    assert me.json().get("is_admin") is True, f"User is not admin: {me.json()}"
    return s


@pytest.fixture(scope="module")
def anon_session():
    return requests.Session()


@pytest.fixture(scope="module")
def created_links(admin_session):
    """Create a set of test links covering placements and is_active variations."""
    created = []
    payloads = [
        {
            "title": "TEST_Amazon Filaments",
            "url": "https://amazon.it/test1",
            "description": "Sponsored Amazon",
            "image_url": "",
            "placements": ["guida", "calculator"],
            "is_active": True,
            "sort_order": 2,
        },
        {
            "title": "TEST_Bambu Lab",
            "url": "https://bambulab.com/test",
            "description": "Bambu",
            "placements": ["shop_footer"],
            "is_active": True,
            "sort_order": 1,
        },
        {
            "title": "TEST_Inactive 3DJake",
            "url": "https://3djake.com/test",
            "description": "Inactive",
            "placements": ["guida"],
            "is_active": False,
            "sort_order": 5,
        },
        {
            "title": "TEST_Demo Link",
            "url": "https://example.com/demo",
            "placements": ["demo"],
            "is_active": True,
            "sort_order": 0,
        },
    ]
    for p in payloads:
        r = admin_session.post(f"{API}/admin/affiliate-links", json=p)
        assert r.status_code == 200, f"Create failed: {r.status_code} {r.text}"
        data = r.json()
        assert "id" in data
        assert data["title"] == p["title"]
        assert data["clicks"] == 0
        created.append(data)
    yield created
    # cleanup
    for c in created:
        try:
            admin_session.delete(f"{API}/admin/affiliate-links/{c['id']}")
        except Exception:
            pass


# ---------------- Auth gating ----------------

class TestAuthGating:
    def test_admin_list_requires_auth(self, anon_session):
        r = anon_session.get(f"{API}/admin/affiliate-links")
        assert r.status_code in (401, 403)

    def test_admin_create_requires_auth(self, anon_session):
        r = anon_session.post(f"{API}/admin/affiliate-links", json={"title": "X", "url": "https://x"})
        assert r.status_code in (401, 403)

    def test_admin_update_requires_auth(self, anon_session):
        r = anon_session.put(f"{API}/admin/affiliate-links/000000000000000000000000", json={"title": "X"})
        assert r.status_code in (401, 403)

    def test_admin_delete_requires_auth(self, anon_session):
        r = anon_session.delete(f"{API}/admin/affiliate-links/000000000000000000000000")
        assert r.status_code in (401, 403)


# ---------------- Admin CRUD ----------------

class TestAdminCRUD:
    def test_admin_list_returns_created(self, admin_session, created_links):
        r = admin_session.get(f"{API}/admin/affiliate-links")
        assert r.status_code == 200
        items = r.json()
        ids = {i["id"] for i in items}
        for c in created_links:
            assert c["id"] in ids
        # admin endpoint MUST include clicks
        for it in items:
            assert "clicks" in it

    def test_admin_update_persists(self, admin_session, created_links):
        link = created_links[0]
        new_title = "TEST_Amazon Filaments UPDATED"
        r = admin_session.put(
            f"{API}/admin/affiliate-links/{link['id']}",
            json={"title": new_title, "sort_order": 99},
        )
        assert r.status_code == 200
        # verify
        r2 = admin_session.get(f"{API}/admin/affiliate-links")
        updated = next((i for i in r2.json() if i["id"] == link["id"]), None)
        assert updated is not None
        assert updated["title"] == new_title
        assert updated["sort_order"] == 99
        # restore for downstream tests
        admin_session.put(
            f"{API}/admin/affiliate-links/{link['id']}",
            json={"title": link["title"], "sort_order": link["sort_order"]},
        )

    def test_admin_delete_persists(self, admin_session):
        # create a throwaway link, delete it, verify gone
        r = admin_session.post(
            f"{API}/admin/affiliate-links",
            json={
                "title": "TEST_to_delete",
                "url": "https://del.test",
                "placements": ["guida"],
                "is_active": True,
            },
        )
        assert r.status_code == 200
        lid = r.json()["id"]
        d = admin_session.delete(f"{API}/admin/affiliate-links/{lid}")
        assert d.status_code == 200
        # verify
        listing = admin_session.get(f"{API}/admin/affiliate-links").json()
        assert lid not in {i["id"] for i in listing}


# ---------------- Public endpoint ----------------

class TestPublicEndpoint:
    def test_invalid_placement_returns_400(self, anon_session):
        r = anon_session.get(f"{API}/affiliate-links/invalid_xyz")
        assert r.status_code == 400

    @pytest.mark.parametrize("placement", ["guida", "shop_footer", "calculator", "demo"])
    def test_valid_placements_return_200(self, anon_session, placement, created_links):
        r = anon_session.get(f"{API}/affiliate-links/{placement}")
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_guida_returns_active_only(self, anon_session, created_links):
        r = anon_session.get(f"{API}/affiliate-links/guida")
        assert r.status_code == 200
        titles = [i["title"] for i in r.json()]
        assert "TEST_Amazon Filaments" in titles
        # inactive must NOT appear
        assert "TEST_Inactive 3DJake" not in titles

    def test_shop_footer_filters_by_placement(self, anon_session, created_links):
        r = anon_session.get(f"{API}/affiliate-links/shop_footer")
        titles = [i["title"] for i in r.json()]
        assert "TEST_Bambu Lab" in titles
        # Amazon (guida+calculator) must NOT appear in shop_footer
        assert "TEST_Amazon Filaments" not in titles

    def test_calculator_includes_multi_placement(self, anon_session, created_links):
        r = anon_session.get(f"{API}/affiliate-links/calculator")
        titles = [i["title"] for i in r.json()]
        assert "TEST_Amazon Filaments" in titles

    def test_public_does_not_expose_clicks(self, anon_session, created_links):
        r = anon_session.get(f"{API}/affiliate-links/guida")
        for item in r.json():
            assert "clicks" not in item, f"Privacy leak: 'clicks' present in public response: {item}"

    def test_public_sort_order(self, anon_session, admin_session):
        # create 3 in guida with distinct sort_order
        ids = []
        for s in [10, 3, 7]:
            r = admin_session.post(
                f"{API}/admin/affiliate-links",
                json={
                    "title": f"TEST_sort_{s}",
                    "url": f"https://x.test/{s}",
                    "placements": ["guida"],
                    "is_active": True,
                    "sort_order": s,
                },
            )
            ids.append(r.json()["id"])
        try:
            r = anon_session.get(f"{API}/affiliate-links/guida")
            ours = [i for i in r.json() if i["title"].startswith("TEST_sort_")]
            sort_orders = [i["sort_order"] for i in ours]
            assert sort_orders == sorted(sort_orders), f"Not sorted: {sort_orders}"
        finally:
            for lid in ids:
                admin_session.delete(f"{API}/admin/affiliate-links/{lid}")


# ---------------- Click tracking ----------------

class TestClickTracking:
    def test_click_increments_and_returns_url(self, anon_session, admin_session, created_links):
        link = created_links[1]  # Bambu
        before = next(
            i for i in admin_session.get(f"{API}/admin/affiliate-links").json() if i["id"] == link["id"]
        )["clicks"]
        r = anon_session.post(f"{API}/affiliate-links/{link['id']}/click")
        assert r.status_code == 200
        data = r.json()
        assert "url" in data
        assert data["url"] == link["url"]
        # verify increment
        after = next(
            i for i in admin_session.get(f"{API}/admin/affiliate-links").json() if i["id"] == link["id"]
        )["clicks"]
        assert after == before + 1

    def test_click_unknown_id_returns_404(self, anon_session):
        # valid ObjectId format but non-existent
        r = anon_session.post(f"{API}/affiliate-links/507f1f77bcf86cd799439011/click")
        assert r.status_code == 404
