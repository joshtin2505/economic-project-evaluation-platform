import type { ProjectResultsRecord } from "@/lib/services/project-analytics";

/** Normalizes rates stored as decimal (0.12) or percent (12). */
export function asPercent(value: number | string | null | undefined): number {
  const numeric = Number(value ?? 0);
  if (numeric === 0) return 0;
  return Math.abs(numeric) <= 1 ? numeric * 100 : numeric;
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
  return `${asPercent(value).toFixed(digits)}%`;
}

export function isRateAbove(
  left: number | string | null | undefined,
  right: number | string | null | undefined,
): boolean {
  return asPercent(left) > asPercent(right);
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
    irr: Number(calculations.irr),
    tmar: Number(calculations.tmar),
    benefitCostRatio,
    bcRatio: benefitCostRatio,
    isViable: calculations.isViable,
    paybackPeriod: extras?.paybackPeriod ?? undefined,
  };
}
