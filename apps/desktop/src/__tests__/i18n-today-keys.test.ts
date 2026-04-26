import { describe, it, expect } from "vitest";
import en from "@/locales/en.json";
import zh from "@/locales/zh.json";

function getKeys(
  obj: Record<string, unknown>,
  prefix = "",
): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return getKeys(value as Record<string, unknown>, fullKey);
    }
    return [fullKey];
  });
}

describe("C8: i18n today.empty key completeness", () => {
  const enTodayKeys = getKeys(
    (en as Record<string, unknown>).today as Record<string, unknown>,
    "today",
  )
    .filter((k) => k.startsWith("today.empty."))
    .map((k) => k.replace("today.empty.", ""))
    .sort();
  const zhTodayKeys = getKeys(
    (zh as Record<string, unknown>).today as Record<string, unknown>,
    "today",
  )
    .filter((k) => k.startsWith("today.empty."))
    .map((k) => k.replace("today.empty.", ""))
    .sort();

  it("should have identical key structure in en and zh for today.empty", () => {
    expect(enTodayKeys).toEqual(zhTodayKeys);
  });

  it("should have all required today.empty keys", () => {
    const requiredKeys = [
      "no_feeds_title",
      "no_feeds_subtitle",
      "add_feeds",
      "no_articles_title",
      "no_articles_subtitle",
      "explore_all",
      "error_title",
      "error_subtitle",
      "retry",
    ];
    requiredKeys.forEach((key) => {
      expect(enTodayKeys).toContain(key);
    });
  });

  it("should have non-empty string values for all today.empty keys in en", () => {
    const todayEmpty = (
      (en as Record<string, unknown>).today as Record<string, unknown>
    ).empty as Record<string, unknown>;
    Object.values(todayEmpty).forEach((value) => {
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    });
  });

  it("should have non-empty string values for all today.empty keys in zh", () => {
    const todayEmpty = (
      (zh as Record<string, unknown>).today as Record<string, unknown>
    ).empty as Record<string, unknown>;
    Object.values(todayEmpty).forEach((value) => {
      expect(typeof value).toBe("string");
      expect((value as string).length).toBeGreaterThan(0);
    });
  });
});
