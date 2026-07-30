from datetime import UTC, datetime
from decimal import Decimal

from flipdesk.models import Condition, ListingRaw
from flipdesk.normalize import normalize_iphone


def _raw(title: str, body: str = "") -> ListingRaw:
    return ListingRaw(
        id=1,
        source="olx.bg",
        source_id="x1",
        url="https://www.olx.bg/d/obiava/x1.html",
        title=title,
        body=body,
        price=75000,
        currency="BGN",
        city="Бургас",
        posted_at=None,
        seller_hash="deadbeef",
        images_json="[]",
        fetched_at=datetime.now(UTC),
    )


def test_normalize_extracts_model_storage_color_and_defect() -> None:
    raw = _raw(
        "iPhone 13 128GB Space Gray, батерия 91%, Бургас",
        "Спукан екран отзад, работи перфектно.",
    )
    result = normalize_iphone(raw, Decimal("383.45"))

    assert result is not None
    assert result.product.model == "iPhone 13"
    assert result.product.storage_gb == 128
    assert result.product.variant == "Space Gray"
    assert result.product.year == 2021
    assert "спукан екран" in result.defects_json.lower()
    assert result.ask_eur == Decimal("383.45")


def test_normalize_detects_like_new_condition() -> None:
    raw = _raw("iPhone 14 Pro 256GB Deep Purple, като нов, Бургас")
    result = normalize_iphone(raw, Decimal("741.02"))

    assert result is not None
    assert result.product.model == "iPhone 14 Pro"
    assert result.condition == Condition.LIKE_NEW


def test_normalize_distinguishes_pro_max_from_pro_and_base() -> None:
    base = normalize_iphone(_raw("iPhone 12 64GB"), Decimal("300"))
    pro = normalize_iphone(_raw("iPhone 12 Pro 128GB"), Decimal("400"))
    pro_max = normalize_iphone(_raw("iPhone 12 Pro Max 256GB"), Decimal("500"))

    assert base is not None and base.product.model == "iPhone 12"
    assert pro is not None and pro.product.model == "iPhone 12 Pro"
    assert pro_max is not None and pro_max.product.model == "iPhone 12 Pro Max"


def test_normalize_returns_none_when_model_cannot_be_determined() -> None:
    raw = _raw("iPhone за части, Бургас")
    result = normalize_iphone(raw, Decimal("50"))
    assert result is None


def test_normalize_low_completeness_when_only_model_is_known() -> None:
    raw = _raw("iPhone 11")
    result = normalize_iphone(raw, Decimal("250"))

    assert result is not None
    assert result.product.storage_gb is None
    assert result.completeness <= 0.4
