from datetime import UTC, datetime
from pathlib import Path

from flipdesk.sources.olx import parse_ad_detail, parse_search_results

FIXTURES = Path(__file__).parent / "fixtures"


def test_parse_search_results_skips_cards_without_price() -> None:
    html = (FIXTURES / "olx_search.html").read_text()
    stubs = parse_search_results(html)

    # three cards in the fixture, one has no visible price and must be skipped
    assert len(stubs) == 2
    assert stubs[0].source_id == "1a2b3c"
    assert stubs[0].price == 75000
    assert stubs[0].currency == "BGN"
    assert "iPhone 13" in stubs[0].title


def test_parse_search_results_on_empty_page_returns_empty_list() -> None:
    stubs = parse_search_results("<html><body>no results</body></html>")
    assert stubs == []


def test_parse_ad_detail_extracts_body_city_and_seller_hash() -> None:
    html = (FIXTURES / "olx_ad_detail.html").read_text()
    stubs = parse_search_results((FIXTURES / "olx_search.html").read_text())
    stub = stubs[0]

    raw = parse_ad_detail(html, stub, datetime.now(UTC))

    assert raw.source == "olx.bg"
    assert raw.source_id == stub.source_id
    assert "Спукан екран" in raw.body
    assert raw.city == "Бургас"
    assert len(raw.seller_hash) == 64  # sha256 hex digest


def test_parse_ad_detail_on_minimal_page_falls_back_gracefully() -> None:
    html = (FIXTURES / "olx_ad_detail_minimal.html").read_text()
    stubs = parse_search_results((FIXTURES / "olx_search.html").read_text())
    stub = stubs[1]  # iPhone 14 Pro stub reused; content of the page is what matters here

    raw = parse_ad_detail(html, stub, datetime.now(UTC))

    assert raw.body == ""
    assert raw.city is None
    assert raw.seller_hash  # falls back to hashing the URL, never empty
