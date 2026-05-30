import type { ProjectResultsRecord } from "@/lib/services/project-analytics";

/**
 * Normaliza una tasa a decimal (0.1227).
 * Acepta legado en puntos porcentuales (12.27) o decimal (0.1227).
 */
export function asDecimal(value: number | string | null | undefined): number {
  const numeric = Number(value ?? 0);
  if (numeric === 0) return 0;
  return Math.abs(numeric) > 1 ? numeric / 100 : numeric;
}

/** @deprecated Preferir asDecimal + formatDecimalRate en agregaciones. */
export function asPercent(value: number | string | null | undefined): number {
  return asDecimal(value) * 100;
}

/** Muestra una tasa decimal en UI (0.1227 → "12.27%"). */
export function formatDecimalRate(
  decimal: number,
  digits = 2,
  locale = "en-US",
): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(decimal);
}

export function getBenefitCostRatio(
  results: ProjectResultsRecord | null | undefined,
): number | undefined {
  if (!results) return undefined;
  const record = results as ProjectResultsRecord & { bcRatio?: number };
  if (typeof record.benefitCostRatio === "number") return record.benefitCostRatio;
  if (typeof record.bcRatio === "number") return record.bcRatio;
  return undefined;
}

export function formatRatePercent(
  value: number | string | null | undefined,
  digits = 1,
): string {
  return formatDecimalRate(asDecimal(value), digits);
}

export function isRateAbove(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
): boolean {
  return asDecimal(left) > asDecimal(right);
}

export function buildResultsPayload(
  calculations: {
    npv: number;
    irr: string;
    tmar: string;
    bcRatio: string;
    isViable: boolean;
  },
  extras?: { paybackPeriod?: number | null },
): ProjectResultsRecord & { bcRatio: number } {
  const benefitCostRatio = Number(calculations.bcRatio);
  return {
    npv: calculations.npv,
    irr: asDecimal(Number(calculations.irr)),
    tmar: asDecimal(Number(calculations.tmar)),
    benefitCostRatio,
    bcRatio: benefitCostRatio,
    isViable: calculations.isViable,
    paybackPeriod: extras?.paybackPeriod ?? undefined,
  };
}
