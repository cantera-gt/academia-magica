export type EnrollmentPricing = {
  subjectCount: number;
  unitPriceUsd: number;
  totalUsd: number;
  savingsUsd: number;
  nextTier: { minimum: number; unitPriceUsd: number; remaining: number } | null;
};

export const ENROLLMENT_ACCESS_MONTHS = 3;

export const ENROLLMENT_PRICE_TIERS = [
  { minimum: 1, maximum: 3, unitPriceUsd: 10, label: "1–3 materias" },
  { minimum: 4, maximum: 6, unitPriceUsd: 8, label: "4–6 materias" },
  { minimum: 7, maximum: 10, unitPriceUsd: 7, label: "7–10 materias" },
  { minimum: 11, maximum: Number.POSITIVE_INFINITY, unitPriceUsd: 6, label: "11 o más" },
] as const;

export function getEnrollmentPricing(subjectCount: number): EnrollmentPricing {
  const normalizedCount = Math.max(0, Math.floor(subjectCount));
  const currentTier = ENROLLMENT_PRICE_TIERS.find(
    (tier) => normalizedCount >= tier.minimum && normalizedCount <= tier.maximum,
  );
  const unitPriceUsd = currentTier?.unitPriceUsd ?? 0;
  const nextTier = ENROLLMENT_PRICE_TIERS.find((tier) => tier.minimum > normalizedCount);

  return {
    subjectCount: normalizedCount,
    unitPriceUsd,
    totalUsd: normalizedCount * unitPriceUsd,
    savingsUsd: normalizedCount * 10 - normalizedCount * unitPriceUsd,
    nextTier: nextTier
      ? {
          minimum: nextTier.minimum,
          unitPriceUsd: nextTier.unitPriceUsd,
          remaining: nextTier.minimum - normalizedCount,
        }
      : null,
  };
}
