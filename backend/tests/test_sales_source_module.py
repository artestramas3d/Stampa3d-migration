# POST /api/sales source_module (3d/cricut/manuale), cricut cost linking, analytics by_type/timeline, dashboard hours
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL").rstrip("/")
ADMIN = {"email": "testuser@example.com", "password": "password123"}
D = "2011-05"


@pytest.fixture(scope="module")
def s():
    ses = requests.Session()
    r = ses.post(f"{BASE_URL}/api/auth/login", json=ADMIN)
    if r.status_code != 200:
        pytest.skip("login failed")
    return ses


@pytest.fixture(scope="module")
def ctx(s):
    c = {"sales": [], "printers": [], "filaments": [], "mats": [], "projects": []}
    yield c
    for i in c["sales"]:
        s.delete(f"{BASE_URL}/api/sales/{i}")
    for i in c["projects"]:
        s.delete(f"{BASE_URL}/api/cricut/projects/{i}")
    for i in c["mats"]:
        s.delete(f"{BASE_URL}/api/cricut/materials/{i}")
    for i in c["filaments"]:
        s.delete(f"{BASE_URL}/api/filaments/{i}")
    for i in c["printers"]:
        s.delete(f"{BASE_URL}/api/printers/{i}")


@pytest.fixture(scope="module")
def setup(s, ctx):
    p = s.post(f"{BASE_URL}/api/printers", json={"printer_name": "TEST_P", "printer_cost": 1000, "estimated_life_hours": 1000,
                                                "electricity_cost_kwh": 0.2, "average_power_watts": 500}).json()
    ctx["printers"].append(p["id"])
    f = s.post(f"{BASE_URL}/api/filaments", json={"material_type": "PLA", "color": "TEST_R", "brand": "TEST_B",
                                                 "spool_weight_g": 1000, "spool_price": 20}).json()
    ctx["filaments"].append(f["id"])
    m = s.post(f"{BASE_URL}/api/cricut/materials", json={"name": "TEST_Vinile", "purchase_price": 10, "purchase_qty": 10,
                                                        "waste_percent": 0}).json()
    ctx["mats"].append(m["id"])
    pr = s.post(f"{BASE_URL}/api/cricut/projects", json={"name": "TEST_CricutProj", "date": f"{D}-01", "material_id": m["id"],
                                                        "material_qty": 3, "time_cut_min": 60, "labor_rate_hour": 10,
                                                        "margin_percent": 50}).json()
    ctx["projects"].append(pr["id"])
    return {"printer": p, "filament": f, "project": pr}


def post_sale(s, ctx, body):
    r = s.post(f"{BASE_URL}/api/sales", json=body)
    if r.status_code == 200:
        ctx["sales"] += [i["id"] for i in r.json()["items"]]
    return r


class TestCreateSale:
    def test_3d_without_printer_400(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-02", "product_name": "TEST_x", "sale_price": 10, "printer_id": "",
                               "filaments": [{"filament_id": setup["filament"]["id"], "grams_used": 10}]})
        assert r.status_code == 400 and r.json()["detail"] == "Seleziona una stampante"

    def test_invalid_printer_400(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-02", "product_name": "TEST_x", "sale_price": 10, "printer_id": "abc",
                               "filaments": [{"filament_id": setup["filament"]["id"], "grams_used": 10}]})
        assert r.status_code == 400

    def test_3d_no_filaments_400(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-02", "product_name": "TEST_x", "sale_price": 10,
                               "printer_id": setup["printer"]["id"]})
        assert r.status_code == 400

    def test_3d_sale_regression(self, s, ctx, setup):
        fid = setup["filament"]["id"]
        before = next(x for x in s.get(f"{BASE_URL}/api/filaments").json() if x["id"] == fid)["remaining_grams"]
        r = post_sale(s, ctx, {"date": f"{D}-03", "product_name": "TEST_3D", "sale_price": 40, "quantity": 2,
                               "print_time_hours": 4, "printer_id": setup["printer"]["id"],
                               "filaments": [{"filament_id": fid, "grams_used": 100}]})
        assert r.status_code == 200, r.text
        it = r.json()["items"]
        assert len(it) == 2 and it[0]["source_module"] == "3d"
        # material 100g*0.02=2, elec 4*0.1=0.4, depr 4*1=4 -> 6.4 total -> 3.2 per unit
        assert it[0]["total_cost"] == pytest.approx(3.2, abs=0.01)
        assert it[0]["net_profit"] == pytest.approx(16.8, abs=0.01)
        after = next(x for x in s.get(f"{BASE_URL}/api/filaments").json() if x["id"] == fid)["remaining_grams"]
        assert before - after == pytest.approx(100)

    def test_cricut_sale_with_project(self, s, ctx, setup):
        pt = setup["project"]["total_cost"]
        r = post_sale(s, ctx, {"date": f"{D}-04", "product_name": "TEST_Cricut", "sale_price": 50, "quantity": 2,
                               "printer_id": "", "source_module": "cricut", "cricut_project_id": setup["project"]["id"]})
        assert r.status_code == 200, r.text
        it = r.json()["items"]
        assert it[0]["source_module"] == "cricut" and it[0]["cricut_project_id"] == setup["project"]["id"]
        assert it[0]["printer_id"] == ""
        assert pt > 0
        assert it[0]["total_cost"] == pytest.approx(round(pt, 2), abs=0.01)
        assert it[0]["net_profit"] == pytest.approx(25 - pt, abs=0.02)

    def test_cricut_sale_ui_payload(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-04", "product_name": "TEST_CricutUI", "print_time_hours": 0, "printer_id": "",
                               "sale_price": setup["project"]["recommended_price"], "quantity": 1,
                               "source_module": "cricut", "cricut_project_id": setup["project"]["id"]})
        assert r.status_code == 200, r.text

    def test_cricut_invalid_project_id_ok(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-05", "product_name": "TEST_CricutBad", "sale_price": 5,
                               "source_module": "cricut", "cricut_project_id": "nope"})
        assert r.status_code == 200, r.text
        assert r.json()["items"][0]["total_cost"] == 0

    def test_manuale_sale(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-06T10:00", "product_name": "TEST_Man", "sale_price": 15,
                               "source_module": "manuale", "labor_hours": 1})
        assert r.status_code == 200, r.text
        it = r.json()["items"][0]
        assert it["source_module"] == "manuale" and it["total_cost"] == 15 and it["net_profit"] == 0

    def test_unknown_source_falls_back_3d(self, s, ctx, setup):
        r = post_sale(s, ctx, {"date": f"{D}-07", "product_name": "TEST_x", "sale_price": 10, "source_module": "zzz"})
        assert r.status_code == 400  # treated as 3d -> printer required


class TestAnalytics:
    def test_by_type_and_timeline(self, s, ctx, setup):
        # depends on TestCreateSale having run (module order)
        r = s.get(f"{BASE_URL}/api/stats/analytics", params={"start": f"{D}-01", "end": f"{D}-06"})
        assert r.status_code == 200
        d = r.json()
        names = {t["name"]: t for t in d["by_type"]}
        assert {"Stampa 3D", "Plotter / Cricut", "Manuale"} <= set(names), names
        assert names["Manuale"]["units"] == 1  # stored with time part on end date -> included
        assert names["Stampa 3D"]["units"] == 2
        assert names["Plotter / Cricut"]["units"] == 4
        assert d["granularity"] == "day"
        periods = [t["period"] for t in d["timeline"]]
        assert periods == [f"{D}-0{i}" for i in range(1, 7)], periods
        assert d["timeline"][0]["revenue"] == 0

    def test_monthly_timeline_filled(self, s, ctx, setup):
        d = s.get(f"{BASE_URL}/api/stats/analytics", params={"start": "2011-01-01", "end": "2011-12-31"}).json()
        assert d["granularity"] == "month"
        assert [t["period"] for t in d["timeline"]] == [f"2011-{m:02d}" for m in range(1, 13)]

    def test_dashboard_total_hours_divided(self, s, ctx, setup):
        d = s.get(f"{BASE_URL}/api/dashboard/stats").json()
        assert "total_hours" in d
        before = d["total_hours"]
        r = post_sale(s, ctx, {"date": f"{D}-08", "product_name": "TEST_H", "sale_price": 10, "quantity": 3,
                               "print_time_hours": 6, "printer_id": setup["printer"]["id"],
                               "filaments": [{"filament_id": setup["filament"]["id"], "grams_used": 1}]})
        assert r.status_code == 200
        after = s.get(f"{BASE_URL}/api/dashboard/stats").json()["total_hours"]
        assert after - before == pytest.approx(6, abs=0.1)
