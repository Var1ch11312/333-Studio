"""OLX.bg adapter.

Request policy: sequential requests only, `REQUEST_DELAY_SECONDS` between every
HTTP call (search pages and ad detail pages alike), single `USER_AGENT` that
identifies the bot honestly. No JS execution, no Playwright — OLX.bg serves
server-rendered HTML for both search results and ad detail pages, so httpx is
enough and stays inside the project's "prefer the lightest fetch that works"
rule (see CLAUDE.md section 9).

The selectors below (`data-cy="l-card"` for search cards, `data-cy="ad_description"`
for the detail body, `data-testid="location-date"` for the city/posted-at line)
follow OLX Group's markup conventions shared across their national sites. This
environment cannot reach olx.bg directly to capture a live snapshot, so treat
these selectors as provisional until validated against a real captured page and
replace `tests/fixtures/olx_search.html` / `olx_ad_detail.html` with the real
snapshot at that point.
"""

import asyncio
import hashlib
import re
from collections.abc import AsyncIterator
from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Literal

import httpx
from bs4 import BeautifulSoup, Tag

from flipdesk.models import ListingRawCreate

Currency = Literal["EUR", "BGN"]

SOURCE_NAME = "olx.bg"
BASE_URL = "https://www.olx.bg"
USER_AGENT = "FlipDeskBot/0.1 (+https://github.com/var1ch11312/333-studio; contact: admin)"
REQUEST_DELAY_SECONDS = 2.5

CATEGORY_SEARCH_URLS = {
    "iphone": f"{BASE_URL}/elektronika-i-kompyutri/telefoni/mobilni-telefoni/q-iphone/",
}

_SALT = "flipdesk-seller-hash-v1"


@dataclass(frozen=True)
class SearchResultStub:
    source_id: str
    url: str
    title: str
    price: int
    currency: Currency


def search_url_for_category(category: str) -> str:
    try:
        return CATEGORY_SEARCH_URLS[category]
    except KeyError:
        raise ValueError(f"no OLX search URL configured for category {category!r}") from None


def _source_id_from_url(url: str) -> str:
    match = re.search(r"-ID([A-Za-z0-9]+)\.html", url) or re.search(r"/d/[^/]+/([A-Za-z0-9]+)", url)
    if match:
        return match.group(1)
    return hashlib.sha256(url.encode()).hexdigest()[:16]


def _parse_price(text: str) -> tuple[int, Currency] | None:
    cleaned = text.replace("\xa0", " ").strip()
    match = re.search(r"([\d\s.,]+)\s*(EUR|BGN|лв\.?|€)", cleaned, re.IGNORECASE)
    if not match:
        return None
    amount_str = match.group(1).replace(" ", "").replace(",", "")
    currency_raw = match.group(2).lower()
    currency: Currency = "EUR" if currency_raw in ("eur", "€") else "BGN"
    try:
        amount = float(amount_str)
    except ValueError:
        return None
    return round(amount * 100), currency


def parse_search_results(html: str) -> list[SearchResultStub]:
    soup = BeautifulSoup(html, "html.parser")
    stubs: list[SearchResultStub] = []
    for card in soup.select('[data-cy="l-card"]'):
        link = card.find("a", href=True)
        if not isinstance(link, Tag):
            continue
        href = str(link["href"])
        url = href if href.startswith("http") else f"{BASE_URL}{href}"

        title_el = card.select_one("h4, h6") or link
        title = title_el.get_text(strip=True)
        if not title:
            continue

        price_el = card.select_one('[data-testid="ad-price"]')
        if price_el is None:
            continue
        parsed_price = _parse_price(price_el.get_text())
        if parsed_price is None:
            continue
        price, currency = parsed_price

        stubs.append(
            SearchResultStub(
                source_id=_source_id_from_url(url),
                url=url,
                title=title,
                price=price,
                currency=currency,
            )
        )
    return stubs


def parse_ad_detail(html: str, stub: SearchResultStub, fetched_at: datetime) -> ListingRawCreate:
    soup = BeautifulSoup(html, "html.parser")

    body_el = soup.select_one('[data-cy="ad_description"]')
    body = body_el.get_text("\n", strip=True) if body_el else ""

    location_el = soup.select_one('[data-testid="location-date"]')
    city = None
    posted_at = None
    if location_el is not None:
        location_text = location_el.get_text(strip=True)
        parts = [p.strip() for p in location_text.split("-")]
        if parts:
            city = parts[0] or None

    seller_el = soup.select_one('[data-testid="seller_name"], [data-cy="seller_name"]')
    seller_identifier = seller_el.get_text(strip=True) if seller_el is not None else stub.url
    seller_hash = hashlib.sha256(f"{_SALT}:{seller_identifier}".encode()).hexdigest()

    return ListingRawCreate(
        source=SOURCE_NAME,
        source_id=stub.source_id,
        url=stub.url,
        title=stub.title,
        body=body,
        price=stub.price,
        currency=stub.currency,
        city=city,
        posted_at=posted_at,
        seller_hash=seller_hash,
        images_json="[]",
        fetched_at=fetched_at,
    )


class OlxSource:
    name = SOURCE_NAME

    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client or httpx.AsyncClient(
            headers={"User-Agent": USER_AGENT}, timeout=20.0, follow_redirects=True
        )
        self._owns_client = client is None

    async def fetch(self, category: str) -> AsyncIterator[ListingRawCreate]:
        search_url = search_url_for_category(category)
        search_html = await self._get(search_url)
        stubs = parse_search_results(search_html)

        for stub in stubs:
            await asyncio.sleep(REQUEST_DELAY_SECONDS)
            detail_html = await self._get(stub.url)
            yield parse_ad_detail(detail_html, stub, datetime.now(UTC))

    async def _get(self, url: str) -> str:
        response = await self._client.get(url)
        response.raise_for_status()
        return response.text

    async def aclose(self) -> None:
        if self._owns_client:
            await self._client.aclose()
