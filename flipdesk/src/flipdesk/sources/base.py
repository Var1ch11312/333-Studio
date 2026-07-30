from collections.abc import AsyncIterator
from typing import Protocol

from flipdesk.models import ListingRawCreate


class Source(Protocol):
    """One marketplace adapter. A new marketplace is a new file implementing this."""

    name: str

    def fetch(self, category: str) -> AsyncIterator[ListingRawCreate]:
        """Yield raw listings for `category`. No normalization here — that's a separate step."""
        ...
