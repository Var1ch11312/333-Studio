import asyncio
from pathlib import Path

import click

from flipdesk import db
from flipdesk.models import ListingCreate, ListingRaw
from flipdesk.money import bgn_to_eur, cents_to_eur
from flipdesk.normalize import normalize_iphone
from flipdesk.sources.olx import OlxSource

DB_PATH_OPTION = click.option(
    "--db-path",
    "db_path",
    type=click.Path(path_type=Path),
    default=db.DEFAULT_DB_PATH,
    show_default=True,
    help="Path to the SQLite database file.",
)


@click.group()
def main() -> None:
    pass


@main.command("init-db")
@DB_PATH_OPTION
def init_db_command(db_path: Path) -> None:
    db.init_db(db_path)
    click.echo(f"initialized {db_path}")


@main.command("scan")
@click.option("--category", default="iphone", show_default=True)
@DB_PATH_OPTION
def scan_command(category: str, db_path: Path) -> None:
    if not db_path.exists():
        db.init_db(db_path)
    inserted, skipped = asyncio.run(_scan(category, db_path))
    click.echo(f"ingested {inserted + skipped} listings, normalized {inserted}, skipped {skipped}")


async def _scan(category: str, db_path: Path) -> tuple[int, int]:
    conn = db.connect(db_path)
    source = OlxSource()
    inserted = 0
    skipped = 0
    try:
        async for raw_create in source.fetch(category):
            raw_id = db.insert_listing_raw(conn, raw_create)
            raw = ListingRaw(**raw_create.model_dump(), id=raw_id)

            ask_eur = (
                cents_to_eur(raw.price)
                if raw.currency == "EUR"
                else bgn_to_eur(cents_to_eur(raw.price))
            )
            normalized = normalize_iphone(raw, ask_eur)
            if normalized is None:
                skipped += 1
                continue

            product_id = db.get_or_create_product(conn, normalized.product)
            listing = ListingCreate(
                raw_id=raw.id,
                product_id=product_id,
                condition=normalized.condition,
                defects_json=normalized.defects_json,
                completeness=normalized.completeness,
                ask_eur=normalized.ask_eur,
            )
            db.insert_listing(conn, listing)
            inserted += 1
    finally:
        await source.aclose()
        conn.close()
    return inserted, skipped
