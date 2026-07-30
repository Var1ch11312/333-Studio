import sqlite3
from datetime import datetime
from pathlib import Path

from flipdesk.models import ListingCreate, ListingRawCreate, ProductCreate

DEFAULT_DB_PATH = Path("flipdesk.db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS listings_raw (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    source       TEXT NOT NULL,
    source_id    TEXT NOT NULL,
    url          TEXT NOT NULL,
    title        TEXT NOT NULL,
    body         TEXT NOT NULL DEFAULT '',
    price        INTEGER NOT NULL,
    currency     TEXT NOT NULL,
    city         TEXT,
    posted_at    TEXT,
    seller_hash  TEXT NOT NULL,
    images_json  TEXT NOT NULL DEFAULT '[]',
    fetched_at   TEXT NOT NULL,
    UNIQUE (source, source_id)
);

CREATE TABLE IF NOT EXISTS products (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    brand       TEXT NOT NULL,
    model       TEXT NOT NULL,
    variant     TEXT,
    storage_gb  INTEGER,
    ram_gb      INTEGER,
    year        INTEGER,
    notes       TEXT,
    UNIQUE (brand, model, variant, storage_gb, ram_gb)
);

CREATE TABLE IF NOT EXISTS listings (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    raw_id        INTEGER NOT NULL REFERENCES listings_raw (id),
    product_id    INTEGER NOT NULL REFERENCES products (id),
    condition     TEXT NOT NULL,
    defects_json  TEXT NOT NULL DEFAULT '[]',
    completeness  REAL NOT NULL,
    ask_eur       TEXT NOT NULL,
    is_active     INTEGER NOT NULL DEFAULT 1,
    delisted_at   TEXT
);

CREATE TABLE IF NOT EXISTS comparables (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id      INTEGER NOT NULL REFERENCES products (id),
    condition       TEXT NOT NULL,
    sold_price_eur  TEXT NOT NULL,
    days_live       INTEGER NOT NULL,
    observed_at     TEXT NOT NULL,
    source          TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS valuations (
    id                 INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id         INTEGER NOT NULL REFERENCES listings (id),
    p25                TEXT NOT NULL,
    p50                TEXT NOT NULL,
    p75                TEXT NOT NULL,
    days_to_sell_p50   INTEGER NOT NULL,
    confidence         REAL NOT NULL,
    comps_n            INTEGER NOT NULL,
    computed_at        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS repair_estimates (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id   INTEGER NOT NULL REFERENCES listings (id),
    parts_eur    TEXT NOT NULL,
    hours        REAL NOT NULL,
    feasibility  TEXT NOT NULL,
    notes        TEXT
);

CREATE TABLE IF NOT EXISTS demand_signals (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id    INTEGER NOT NULL REFERENCES products (id),
    kind          TEXT NOT NULL,
    strength      REAL NOT NULL,
    window_start  TEXT NOT NULL,
    window_end    TEXT NOT NULL,
    source_url    TEXT,
    summary       TEXT
);

CREATE TABLE IF NOT EXISTS risk_flags (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id  INTEGER NOT NULL REFERENCES listings (id),
    kind        TEXT NOT NULL,
    severity    TEXT NOT NULL,
    detail      TEXT
);

CREATE TABLE IF NOT EXISTS decisions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id  INTEGER NOT NULL REFERENCES listings (id),
    book        TEXT NOT NULL,
    score       REAL NOT NULL,
    verdict     TEXT NOT NULL,
    rationale   TEXT NOT NULL,
    decided_at  TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS positions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    listing_id  INTEGER NOT NULL REFERENCES listings (id),
    book        TEXT NOT NULL,
    bought_eur  TEXT NOT NULL,
    repair_eur  TEXT NOT NULL DEFAULT '0',
    listed_at   TEXT,
    ask_eur     TEXT NOT NULL,
    sold_eur    TEXT,
    sold_at     TEXT,
    days_held   INTEGER,
    status      TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS model_params (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);
"""


def connect(db_path: Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA foreign_keys = ON")
    conn.row_factory = sqlite3.Row
    return conn


def init_db(db_path: Path = DEFAULT_DB_PATH) -> None:
    conn = connect(db_path)
    try:
        conn.executescript(SCHEMA)
        conn.commit()
    finally:
        conn.close()


def insert_listing_raw(conn: sqlite3.Connection, raw: ListingRawCreate) -> int:
    cur = conn.execute(
        """
        INSERT INTO listings_raw
            (source, source_id, url, title, body, price, currency,
             city, posted_at, seller_hash, images_json, fetched_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT (source, source_id) DO UPDATE SET
            price = excluded.price,
            title = excluded.title,
            body = excluded.body,
            fetched_at = excluded.fetched_at
        """,
        (
            raw.source,
            raw.source_id,
            raw.url,
            raw.title,
            raw.body,
            raw.price,
            raw.currency,
            raw.city,
            _iso(raw.posted_at),
            raw.seller_hash,
            raw.images_json,
            _iso(raw.fetched_at),
        ),
    )
    conn.commit()
    if cur.lastrowid:
        return cur.lastrowid
    row = conn.execute(
        "SELECT id FROM listings_raw WHERE source = ? AND source_id = ?",
        (raw.source, raw.source_id),
    ).fetchone()
    return int(row["id"])


def get_or_create_product(conn: sqlite3.Connection, product: ProductCreate) -> int:
    row = conn.execute(
        """
        SELECT id FROM products
        WHERE brand = ? AND model = ? AND variant IS ? AND storage_gb IS ? AND ram_gb IS ?
        """,
        (product.brand, product.model, product.variant, product.storage_gb, product.ram_gb),
    ).fetchone()
    if row is not None:
        return int(row["id"])
    cur = conn.execute(
        """
        INSERT INTO products (brand, model, variant, storage_gb, ram_gb, year, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            product.brand,
            product.model,
            product.variant,
            product.storage_gb,
            product.ram_gb,
            product.year,
            product.notes,
        ),
    )
    conn.commit()
    assert cur.lastrowid is not None
    return cur.lastrowid


def insert_listing(conn: sqlite3.Connection, listing: ListingCreate) -> int:
    cur = conn.execute(
        """
        INSERT INTO listings
            (raw_id, product_id, condition, defects_json, completeness,
             ask_eur, is_active, delisted_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            listing.raw_id,
            listing.product_id,
            listing.condition,
            listing.defects_json,
            listing.completeness,
            str(listing.ask_eur),
            int(listing.is_active),
            _iso(listing.delisted_at),
        ),
    )
    conn.commit()
    assert cur.lastrowid is not None
    return cur.lastrowid


def _iso(value: datetime | None) -> str | None:
    return value.isoformat() if value is not None else None
