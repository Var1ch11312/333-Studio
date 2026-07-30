from datetime import UTC, datetime
from decimal import Decimal
from pathlib import Path

from flipdesk import db
from flipdesk.models import Condition, ListingCreate, ListingRawCreate, ProductCreate


def _raw(source_id: str = "abc123") -> ListingRawCreate:
    return ListingRawCreate(
        source="olx.bg",
        source_id=source_id,
        url=f"https://www.olx.bg/d/obiava/{source_id}.html",
        title="iPhone 13 128GB Space Gray, Бургас",
        body="Продавам iPhone 13.",
        price=75000,
        currency="BGN",
        city="Бургас",
        posted_at=None,
        seller_hash="deadbeef",
        images_json="[]",
        fetched_at=datetime.now(UTC),
    )


def test_init_db_creates_all_tables(tmp_path: Path) -> None:
    db_path = tmp_path / "flipdesk.db"
    db.init_db(db_path)

    conn = db.connect(db_path)
    try:
        rows = conn.execute("SELECT name FROM sqlite_master WHERE type = 'table'").fetchall()
        table_names = {row["name"] for row in rows}
    finally:
        conn.close()

    expected = {
        "listings_raw",
        "products",
        "listings",
        "comparables",
        "valuations",
        "repair_estimates",
        "demand_signals",
        "risk_flags",
        "decisions",
        "positions",
        "model_params",
    }
    assert expected <= table_names


def test_insert_listing_raw_is_idempotent_on_source_and_source_id(tmp_path: Path) -> None:
    db_path = tmp_path / "flipdesk.db"
    db.init_db(db_path)
    conn = db.connect(db_path)
    try:
        raw = _raw()
        first_id = db.insert_listing_raw(conn, raw)
        second_id = db.insert_listing_raw(conn, raw)
        assert first_id == second_id

        count = conn.execute("SELECT COUNT(*) AS n FROM listings_raw").fetchone()["n"]
        assert count == 1
    finally:
        conn.close()


def test_get_or_create_product_reuses_existing_row(tmp_path: Path) -> None:
    db_path = tmp_path / "flipdesk.db"
    db.init_db(db_path)
    conn = db.connect(db_path)
    try:
        product = ProductCreate(
            brand="Apple",
            model="iPhone 13",
            variant="Space Gray",
            storage_gb=128,
            ram_gb=None,
            year=2021,
            notes=None,
        )
        first_id = db.get_or_create_product(conn, product)
        second_id = db.get_or_create_product(conn, product)
        assert first_id == second_id

        count = conn.execute("SELECT COUNT(*) AS n FROM products").fetchone()["n"]
        assert count == 1
    finally:
        conn.close()


def test_insert_listing_round_trips_ask_eur(tmp_path: Path) -> None:
    db_path = tmp_path / "flipdesk.db"
    db.init_db(db_path)
    conn = db.connect(db_path)
    try:
        raw_id = db.insert_listing_raw(conn, _raw())
        product_id = db.get_or_create_product(
            conn,
            ProductCreate(
                brand="Apple",
                model="iPhone 13",
                variant=None,
                storage_gb=128,
                ram_gb=None,
                year=2021,
                notes=None,
            ),
        )
        listing_id = db.insert_listing(
            conn,
            ListingCreate(
                raw_id=raw_id,
                product_id=product_id,
                condition=Condition.GOOD,
                completeness=0.6,
                ask_eur=Decimal("383.45"),
            ),
        )

        row = conn.execute("SELECT ask_eur FROM listings WHERE id = ?", (listing_id,)).fetchone()
        assert Decimal(row["ask_eur"]) == Decimal("383.45")
    finally:
        conn.close()
