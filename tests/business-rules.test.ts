import { describe, it, expect } from "vitest";
import {
  EUR_BGN_RATE,
  DUAL_PRICE_DEADLINE,
  DELIVERY_ZONES,
  DEFAULT_DELIVERY_FEE_EUR,
  isOddFlowerCount,
  formatDualPrice,
  resolveDeliveryZone,
  deliveryFeeForZone,
} from "@/lib/constants";
import { haversineKm } from "@/lib/geo";

describe("isOddFlowerCount — Bulgarian odd-stem rule", () => {
  it("accepts odd counts", () => {
    expect(isOddFlowerCount(1)).toBe(true);
    expect(isOddFlowerCount(11)).toBe(true);
    expect(isOddFlowerCount(25)).toBe(true);
    expect(isOddFlowerCount(101)).toBe(true);
  });

  it("rejects even counts (funeral connotation)", () => {
    expect(isOddFlowerCount(2)).toBe(false);
    expect(isOddFlowerCount(12)).toBe(false);
    expect(isOddFlowerCount(50)).toBe(false);
  });

  it("rejects zero", () => {
    expect(isOddFlowerCount(0)).toBe(false);
  });
});

describe("EUR/BGN dual pricing", () => {
  it("uses the legally fixed BNB rate", () => {
    expect(EUR_BGN_RATE).toBe(1.95583);
  });

  it("dual-price deadline is 8 Aug 2026", () => {
    expect(DUAL_PRICE_DEADLINE.toISOString().slice(0, 10)).toBe("2026-08-08");
  });

  it("converts EUR to BGN at the fixed rate", () => {
    const { bgn } = formatDualPrice(100);
    // 100 * 1.95583 = 195.58 — bg-BG locale uses comma as decimal separator
    expect(bgn).toContain("195,58");
  });

  it("formats both currencies", () => {
    const result = formatDualPrice(45);
    expect(result.eur).toBeTruthy();
    expect(result.bgn).toBeTruthy();
    expect(result.eur).not.toBe(result.bgn);
  });
});

describe("haversineKm", () => {
  it("returns 0 for identical points", () => {
    expect(haversineKm(42.4943, 27.4726, 42.4943, 27.4726)).toBe(0);
  });

  it("Burgas centre → Meden Rudnik is roughly 5.5 km", () => {
    const d = haversineKm(42.4943, 27.4726, 42.457, 27.428);
    expect(d).toBeGreaterThan(4);
    expect(d).toBeLessThan(7);
  });

  it("Burgas → Sofia is roughly 330 km (sanity check)", () => {
    const d = haversineKm(42.4943, 27.4726, 42.6977, 23.3219);
    expect(d).toBeGreaterThan(300);
    expect(d).toBeLessThan(360);
  });

  it("is symmetric", () => {
    const ab = haversineKm(42.49, 27.47, 42.52, 27.46);
    const ba = haversineKm(42.52, 27.46, 42.49, 27.47);
    expect(ab).toBeCloseTo(ba, 10);
  });
});

describe("resolveDeliveryZone", () => {
  it("address at centre resolves to center zone, 5 EUR", () => {
    const z = resolveDeliveryZone(42.4943, 27.4726, haversineKm);
    expect(z.key).toBe("center");
    expect(z.feeEur).toBe(5);
  });

  it("address in Meden Rudnik resolves to medenRudnik zone, 8 EUR", () => {
    const z = resolveDeliveryZone(42.457, 27.428, haversineKm);
    expect(z.key).toBe("medenRudnik");
    expect(z.feeEur).toBe(8);
  });

  it("address in the north resolves to north zone, 5 EUR", () => {
    const z = resolveDeliveryZone(42.5215, 27.469, haversineKm);
    expect(z.key).toBe("north");
    expect(z.feeEur).toBe(5);
  });

  it("deliveryFeeForZone returns the zone fee", () => {
    expect(deliveryFeeForZone(42.457, 27.428, haversineKm)).toBe(8);
    expect(deliveryFeeForZone(42.4943, 27.4726, haversineKm)).toBe(5);
  });

  it("all zones declare a positive fee and radius", () => {
    for (const z of Object.values(DELIVERY_ZONES)) {
      expect(z.feeEur).toBeGreaterThan(0);
      expect(z.radiusKm).toBeGreaterThan(0);
    }
    expect(DEFAULT_DELIVERY_FEE_EUR).toBeGreaterThan(0);
  });
});
