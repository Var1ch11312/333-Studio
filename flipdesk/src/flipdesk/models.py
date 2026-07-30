from datetime import datetime
from decimal import Decimal
from enum import StrEnum
from typing import Literal

from pydantic import BaseModel, ConfigDict, field_validator


class Condition(StrEnum):
    NEW = "new"
    LIKE_NEW = "like_new"
    GOOD = "good"
    FAIR = "fair"
    BROKEN = "broken"


class ListingRawCreate(BaseModel):
    model_config = ConfigDict(frozen=True)

    source: str
    source_id: str
    url: str
    title: str
    body: str
    price: int
    currency: Literal["EUR", "BGN"]
    city: str | None = None
    posted_at: datetime | None = None
    seller_hash: str
    images_json: str = "[]"
    fetched_at: datetime


class ListingRaw(ListingRawCreate):
    id: int


class ProductCreate(BaseModel):
    model_config = ConfigDict(frozen=True)

    brand: str
    model: str
    variant: str | None = None
    storage_gb: int | None = None
    ram_gb: int | None = None
    year: int | None = None
    notes: str | None = None


class Product(ProductCreate):
    id: int


class ListingCreate(BaseModel):
    model_config = ConfigDict(frozen=True)

    raw_id: int
    product_id: int
    condition: Condition
    defects_json: str = "[]"
    completeness: float
    ask_eur: Decimal
    is_active: bool = True
    delisted_at: datetime | None = None

    @field_validator("completeness")
    @classmethod
    def _completeness_range(cls, v: float) -> float:
        if not 0.0 <= v <= 1.0:
            raise ValueError("completeness must be within [0, 1]")
        return v


class Listing(ListingCreate):
    id: int
