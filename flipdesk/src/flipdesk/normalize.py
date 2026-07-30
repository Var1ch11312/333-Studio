"""Raw listing -> canonical (Product, Listing) for the iPhone category.

Only iPhone is handled here (see CLAUDE.md section 13, step 1). A listing that
doesn't parse as a recognizable iPhone model returns None rather than a guess —
low confidence from bad normalization is worse than no normalization, since it
would silently poison `appraiser` comparables later.
"""

import json
import re
from dataclasses import dataclass
from decimal import Decimal

from flipdesk.models import Condition, ListingRaw, ProductCreate

BRAND = "Apple"

_BASE_MODELS: list[tuple[int, int, list[str]]] = [
    (16, 2024, ["Pro Max", "Pro", "Plus", ""]),
    (15, 2023, ["Pro Max", "Pro", "Plus", ""]),
    (14, 2022, ["Pro Max", "Pro", "Plus", ""]),
    (13, 2021, ["Pro Max", "Pro", "mini", ""]),
    (12, 2020, ["Pro Max", "Pro", "mini", ""]),
    (11, 2019, ["Pro Max", "Pro", ""]),
]

_OTHER_MODELS: list[tuple[str, str, int]] = [
    (r"iphone\s*se\s*\(?\s*2022\s*\)?", "iPhone SE (2022)", 2022),
    (r"iphone\s*se\s*\(?\s*2020\s*\)?", "iPhone SE (2020)", 2020),
    (r"iphone\s*xs\s*max", "iPhone XS Max", 2018),
    (r"iphone\s*xs\b", "iPhone XS", 2018),
    (r"iphone\s*xr\b", "iPhone XR", 2018),
    (r"iphone\s*x\b", "iPhone X", 2017),
    (r"iphone\s*8\s*plus", "iPhone 8 Plus", 2017),
    (r"iphone\s*8\b", "iPhone 8", 2017),
    (r"iphone\s*7\s*plus", "iPhone 7 Plus", 2016),
    (r"iphone\s*7\b", "iPhone 7", 2016),
    (r"iphone\s*6s\s*plus", "iPhone 6s Plus", 2015),
    (r"iphone\s*6s\b", "iPhone 6s", 2015),
    (r"iphone\s*se\b", "iPhone SE (2016)", 2016),
]


def _build_model_table() -> list[tuple[re.Pattern[str], str, int]]:
    table: list[tuple[re.Pattern[str], str, int]] = []
    for number, year, suffixes in _BASE_MODELS:
        for suffix in suffixes:
            if suffix:
                name = f"iPhone {number} {suffix}"
                pattern = rf"iphone\s*{number}\s*{re.escape(suffix).replace(r'\ ', r'\s*')}"
            else:
                name = f"iPhone {number}"
                pattern = rf"iphone\s*{number}\b(?!\s*(pro|plus|mini))"
            table.append((re.compile(pattern, re.IGNORECASE), name, year))
    for pattern, name, year in _OTHER_MODELS:
        table.append((re.compile(pattern, re.IGNORECASE), name, year))
    return table


_MODEL_TABLE = _build_model_table()

_STORAGE_RE = re.compile(r"(\d+)\s*(gb|гб|tb|тб)", re.IGNORECASE)

_COLORS = [
    "space gray",
    "space grey",
    "rose gold",
    "product red",
    "sierra blue",
    "alpine green",
    "deep purple",
    "natural titanium",
    "blue titanium",
    "white titanium",
    "black titanium",
    "desert titanium",
    "midnight",
    "starlight",
    "graphite",
    "silver",
    "gold",
    "black",
    "white",
    "blue",
    "purple",
    "pink",
    "green",
    "yellow",
    "red",
]

_CONDITION_KEYWORDS: list[tuple[str, Condition]] = [
    ("чисто нов", Condition.NEW),
    ("запечатан", Condition.NEW),
    ("като нов", Condition.LIKE_NEW),
    ("отлично състояние", Condition.LIKE_NEW),
    ("много добро", Condition.GOOD),
    ("добро състояние", Condition.GOOD),
    ("следи от употреба", Condition.FAIR),
    ("задоволително", Condition.FAIR),
    ("не работи", Condition.BROKEN),
    ("за части", Condition.BROKEN),
    ("счупен телефон", Condition.BROKEN),
]

_DEFECT_KEYWORDS = [
    "спукан екран",
    "счупен екран",
    "спукано стъкло",
    "без face id",
    "не работи face id",
    "батерия под",
    "липсва зарядно",
    "iCloud",
]

_BATTERY_RE = re.compile(r"батери\w*\D{0,10}(\d{1,3})\s*%")


def _match_model(text: str) -> tuple[str, int] | None:
    for pattern, name, year in _MODEL_TABLE:
        if pattern.search(text):
            return name, year
    return None


def _match_storage_gb(text: str) -> int | None:
    match = _STORAGE_RE.search(text)
    if not match:
        return None
    value = int(match.group(1))
    unit = match.group(2).lower()
    if unit in ("tb", "тб"):
        value *= 1024
    return value


def _match_color(text: str) -> str | None:
    lowered = text.lower()
    for color in _COLORS:
        if color in lowered:
            return color.title()
    return None


def _match_condition(text: str) -> Condition | None:
    lowered = text.lower()
    for keyword, condition in _CONDITION_KEYWORDS:
        if keyword in lowered:
            return condition
    return None


def _match_defects(text: str) -> list[str]:
    lowered = text.lower()
    found = [kw for kw in _DEFECT_KEYWORDS if kw.lower() in lowered]
    battery_match = _BATTERY_RE.search(lowered)
    if battery_match and int(battery_match.group(1)) < 85:
        found.append(f"battery health {battery_match.group(1)}%")
    return found


@dataclass(frozen=True)
class NormalizedListing:
    product: ProductCreate
    condition: Condition
    defects_json: str
    completeness: float
    ask_eur: Decimal


def normalize_iphone(raw: ListingRaw, ask_eur: Decimal) -> NormalizedListing | None:
    """Normalize a raw OLX listing into a canonical iPhone product + listing facts.

    `ask_eur` is already converted from `raw.price`/`raw.currency` by the caller —
    money conversion is not this module's job. The caller is responsible for
    turning the returned `NormalizedListing` into DB rows (`get_or_create_product`
    then `ListingCreate` with the resulting `raw_id`/`product_id`).
    """
    text = f"{raw.title}\n{raw.body}"
    model_match = _match_model(text)
    if model_match is None:
        return None
    model_name, year = model_match

    storage_gb = _match_storage_gb(text)
    color = _match_color(text)
    condition = _match_condition(text)
    defects = _match_defects(text)

    found_fields = sum(1 for value in (storage_gb, color, condition, defects) if value)
    completeness = round(min(1.0, (1 + found_fields) / 5), 2)

    product = ProductCreate(
        brand=BRAND,
        model=model_name,
        variant=color,
        storage_gb=storage_gb,
        ram_gb=None,
        year=year,
        notes=None,
    )

    return NormalizedListing(
        product=product,
        condition=condition or Condition.GOOD,
        defects_json=json.dumps(defects, ensure_ascii=False),
        completeness=completeness,
        ask_eur=ask_eur,
    )
