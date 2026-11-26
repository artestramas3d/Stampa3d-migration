from datetime import date, timedelta
from typing import Optional
from bson import ObjectId

TYPE_LABELS = {"3d": "Stampa 3D", "cricut": "Plotter / Cricut", "manuale": "Manuale"}


def _sale_type(s):
    mod = s.get("source_module")
    if mod in TYPE_LABELS:
        return mod
    if s.get("cricut_project_id"):
        return "cricut"
    return "3d" if s.get("printer_id") else "manuale"


def _r(v, n=2):
    return round(v or 0, n)


def _shift_months(d: date, months: int) -> date:
    m = d.month - 1 + months
    y, m = d.year + m // 12, m % 12 + 1
    last = (date(y + (m == 12), m % 12 + 1, 1) - timedelta(days=1)).day
    is_month_end = (d + timedelta(days=1)).day == 1
    return date(y, m, last if is_month_end else min(d.day, last))


def _bucket(d: str, monthly: bool):
    return d[:7] if monthly else d[:10]


async def _load(db, uid, start, end):
    q = {"user_id": uid, "date": {"$gte": start, "$lte": end + "T23:59:59"}}
    sales = await db.sales.find(q).to_list(100000)
    purchases = await db.purchases.find(q).to_list(100000)
    return sales, purchases


def _summary(sales, purchases):
    revenue = sum(s.get("sale_price", 0) for s in sales)
    cost = sum(s.get("total_cost", 0) for s in sales)
    profit = sum(s.get("net_profit", 0) for s in sales)
    return {
        "revenue": _r(revenue), "cost": _r(cost), "profit": _r(profit),
        "margin": _r(profit / revenue * 100 if revenue else 0, 1),
        "units": len(sales),
        "grams_used": _r(sum(s.get("grams_used", 0) for s in sales), 0),
        "print_hours": _r(sum(s.get("print_time_hours", 0) / max(1, s.get("batch_total", 1)) for s in sales), 1),
        "shipping": _r(sum(s.get("shipping_cost", 0) or 0 for s in sales)),
        "purchases_spent": _r(sum(p.get("price_total", 0) for p in purchases)),
        "purchases_grams": _r(sum(p.get("grams_total", 0) for p in purchases), 0),
        "purchases_spools": sum(p.get("quantity_spools", 0) for p in purchases),
        "paid_revenue": _r(sum(s.get("sale_price", 0) for s in sales if s.get("paid"))),
        "unpaid_revenue": _r(sum(s.get("sale_price", 0) for s in sales if not s.get("paid"))),
        "paid_units": sum(1 for s in sales if s.get("paid")),
        "unpaid_units": sum(1 for s in sales if not s.get("paid")),
    }


def _group(items, key_fn, fields):
    out = {}
    for it in items:
        name = key_fn(it)
        row = out.setdefault(name.strip().lower(), {"name": name, **{f: 0 for f in fields}})
        for f, fn in fields.items():
            row[f] += fn(it)
    return list(out.values())


def _purchase_groups(purchases):
    fields = {"spent": lambda p: p.get("price_total", 0), "grams": lambda p: p.get("grams_total", 0),
              "spools": lambda p: p.get("quantity_spools", 0)}
    mk = lambda key_fn: sorted(({**g, "spent": _r(g["spent"]), "grams": _r(g["grams"], 0)} for g in _group(purchases, key_fn, fields)), key=lambda g: -g["spent"])
    return {
        "by_material": mk(lambda p: p.get("material_type") or "Altro"),
        "by_variant": mk(lambda p: f"{p.get('material_type', '')} {p.get('variant', '')}".strip() or "Altro"),
        "by_brand": mk(lambda p: p.get("brand") or "Senza marca"),
    }


async def _consumption(db, uid, sales):
    usages = []
    for s in sales:
        n = max(1, s.get("batch_total", 1) or 1)
        for f in s.get("filaments", []) or []:
            usages.append((f.get("filament_id"), (f.get("grams_used") or 0) / n))
    ids = list({fid for fid, _ in usages if fid and ObjectId.is_valid(fid)})
    fil = {str(d["_id"]): d async for d in db.filaments.find({"_id": {"$in": [ObjectId(i) for i in ids]}, "user_id": uid})}
    by_mat, by_color = {}, {}
    for fid, g in usages:
        f = fil.get(fid)
        mat = f"{f.get('material_type', '')} {f.get('variant', '')}".strip() if f else "Filamento eliminato"
        color = f"{f.get('color', '')} · {f.get('brand', '')}".strip(" ·") if f else "Filamento eliminato"
        cost = g * (f.get("cost_per_gram", 0) if f else 0)
        for bucket, k, hexv in ((by_mat, mat, None), (by_color, color, f.get("color_hex") if f else "#888888")):
            row = bucket.setdefault(k.lower(), {"name": k, "grams": 0, "cost": 0, "color_hex": hexv})
            row["grams"] += g
            row["cost"] += cost
    fmt = lambda b: sorted(({**v, "grams": _r(v["grams"], 0), "cost": _r(v["cost"])} for v in b.values()), key=lambda v: -v["grams"])
    return {"by_material": fmt(by_mat), "by_color": fmt(by_color)[:15]}


def _products(sales):
    fields = {"units": lambda s: 1, "revenue": lambda s: s.get("sale_price", 0),
              "cost": lambda s: s.get("total_cost", 0), "profit": lambda s: s.get("net_profit", 0)}
    rows = _group(sales, lambda s: s.get("product_name") or "Senza nome", fields)
    for r in rows:
        r["margin"] = _r(r["profit"] / r["revenue"] * 100 if r["revenue"] else 0, 1)
        r["revenue"], r["cost"], r["profit"] = _r(r["revenue"]), _r(r["cost"]), _r(r["profit"])
    return sorted(rows, key=lambda r: -r["revenue"])


def _payments(sales, client_names):
    fields = {"revenue": lambda s: s.get("sale_price", 0), "units": lambda s: 1}
    status = _group(sales, lambda s: "Pagate" if s.get("paid") else "Da incassare", fields)
    unpaid = [s for s in sales if not s.get("paid")]
    by_client = _group(unpaid, lambda s: client_names.get(s.get("client_id") or "", "Senza cliente"), fields)
    fmt = lambda rows: sorted(({**r, "revenue": _r(r["revenue"])} for r in rows), key=lambda r: -r["revenue"])
    return {"by_status": fmt(status), "unpaid_by_client": fmt(by_client)[:10]}


async def _client_names(db, uid, sales):
    ids = list({s.get("client_id") for s in sales if s.get("client_id") and ObjectId.is_valid(s.get("client_id"))})
    return {str(c["_id"]): f"{c.get('name', '')} {c.get('surname', '')}".strip() or "Cliente"
            async for c in db.clients.find({"_id": {"$in": [ObjectId(i) for i in ids]}, "user_id": uid})}


async def _clients(db, uid, sales):
    names = await _client_names(db, uid, sales)
    fields = {"revenue": lambda s: s.get("sale_price", 0), "profit": lambda s: s.get("net_profit", 0), "units": lambda s: 1}
    rows = _group(sales, lambda s: names.get(s.get("client_id") or "", "Senza cliente"), fields)
    return sorted(({**r, "revenue": _r(r["revenue"]), "profit": _r(r["profit"])} for r in rows), key=lambda r: -r["revenue"])[:10]


def _types(sales):
    fields = {"revenue": lambda s: s.get("sale_price", 0), "profit": lambda s: s.get("net_profit", 0), "units": lambda s: 1}
    rows = _group(sales, lambda s: TYPE_LABELS[_sale_type(s)], fields)
    return sorted(({**r, "revenue": _r(r["revenue"]), "profit": _r(r["profit"])} for r in rows), key=lambda r: -r["revenue"])


def _timeline(sales, purchases, monthly, start_d, end_d):
    out = {}
    d = start_d
    while d <= end_d:
        out.setdefault(_bucket(d.isoformat(), monthly), {"revenue": 0, "cost": 0, "profit": 0, "purchases": 0})
        d = _shift_months(d.replace(day=1), 1) if monthly else d + timedelta(days=1)
    for s in sales:
        row = out.setdefault(_bucket(s.get("date", ""), monthly), {"revenue": 0, "cost": 0, "profit": 0, "purchases": 0})
        row["revenue"] += s.get("sale_price", 0)
        row["cost"] += s.get("total_cost", 0)
        row["profit"] += s.get("net_profit", 0)
    for p in purchases:
        row = out.setdefault(_bucket(p.get("date", ""), monthly), {"revenue": 0, "cost": 0, "profit": 0, "purchases": 0})
        row["purchases"] += p.get("price_total", 0)
    return [{"period": k, **{f: _r(v) for f, v in row.items()}} for k, row in sorted(out.items()) if k]


async def build_analytics(db, uid: str, start: Optional[str], end: Optional[str]):
    end = end or date.today().isoformat()
    compare = bool(start)
    if not start:
        first = await db.sales.find({"user_id": uid}).sort("date", 1).limit(1).to_list(1)
        firstp = await db.purchases.find({"user_id": uid}).sort("date", 1).limit(1).to_list(1)
        dates = [d[0]["date"][:10] for d in (first, firstp) if d and d[0].get("date")]
        start = min(dates) if dates else end
    start_d, end_d = date.fromisoformat(start[:10]), date.fromisoformat(end[:10])
    if start_d > end_d:
        start_d, end_d = end_d, start_d
    start, end = start_d.isoformat(), end_d.isoformat()
    sales, purchases = await _load(db, uid, start, end)
    monthly = (end_d - start_d).days > 62

    previous = None
    if compare:
        months = (end_d.year - start_d.year) * 12 + end_d.month - start_d.month + 1
        if start_d.day == 1 and start_d.month == 1 and 1 < months <= 12:
            months = 12
        if start_d.day == 1:
            prev_start, prev_end = _shift_months(start_d, -months), _shift_months(end_d, -months)
        else:
            prev_end = start_d - timedelta(days=1)
            prev_start = prev_end - (end_d - start_d)
        ps, pp = await _load(db, uid, prev_start.isoformat(), prev_end.isoformat())
        previous = {"start": prev_start.isoformat(), "end": prev_end.isoformat(), **_summary(ps, pp)}

    return {
        "start": start, "end": end, "granularity": "month" if monthly else "day",
        "summary": _summary(sales, purchases),
        "previous": previous,
        "timeline": _timeline(sales, purchases, monthly, start_d, end_d),
        "products": _products(sales),
        "purchases": _purchase_groups(purchases),
        "consumption": await _consumption(db, uid, sales),
        "by_type": _types(sales),
        "by_client": await _clients(db, uid, sales),
        "payments": _payments(sales, await _client_names(db, uid, sales)),
    }
