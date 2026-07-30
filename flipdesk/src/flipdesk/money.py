from decimal import ROUND_HALF_UP, Decimal

BGN_EUR_RATE = Decimal("1.95583")

_CENTS = Decimal("100")


def cents_to_eur(cents: int) -> Decimal:
    return (Decimal(cents) / _CENTS).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def eur_to_cents(eur: Decimal) -> int:
    return int((eur * _CENTS).quantize(Decimal("1"), rounding=ROUND_HALF_UP))


def bgn_to_eur(bgn: Decimal) -> Decimal:
    return (bgn / BGN_EUR_RATE).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
