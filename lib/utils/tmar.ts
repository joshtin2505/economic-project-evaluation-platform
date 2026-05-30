/** Convierte un valor expresado en porcentaje (ej. 4) a decimal (0.04). */
export function percentToDecimal(percent: number): number {
  return percent / 100;
}

/** Convierte un decimal (ej. 0.1227) a porcentaje (12.27). */
export function decimalToPercent(decimal: number): number {
  return decimal * 100;
}

/**
 * Ganancia real (i): piso de tasa libre de riesgo + prima de riesgo.
 * i = r + β (en forma decimal).
 */
export function calculateRealGainDecimal(
  riskFreePercent: number,
  riskPremiumPercent: number,
): number {
  return (
    percentToDecimal(riskFreePercent) + percentToDecimal(riskPremiumPercent)
  );
}

export function calculateRealGainPercent(
  riskFreePercent: number,
  riskPremiumPercent: number,
): number {
  return decimalToPercent(
    calculateRealGainDecimal(riskFreePercent, riskPremiumPercent),
  );
}

/**
 * TMAR nominal vía relación de Fisher en forma multiplicativa:
 * TMAR = i + f + (i × f)
 */
export function calculateTmarDecimal(
  riskFreePercent: number,
  inflationPercent: number,
  riskPremiumPercent: number,
): number {
  const realGain = calculateRealGainDecimal(riskFreePercent, riskPremiumPercent);
  const inflation = percentToDecimal(inflationPercent);
  return realGain + inflation + realGain * inflation;
}

export function calculateTmarPercent(
  riskFreePercent: number,
  inflationPercent: number,
  riskPremiumPercent: number,
): number {
  return decimalToPercent(
    calculateTmarDecimal(riskFreePercent, inflationPercent, riskPremiumPercent),
  );
}

/** Término cruzado (i × f) expresado en puntos porcentuales. */
export function calculateFisherCrossTermPercent(
  riskFreePercent: number,
  inflationPercent: number,
  riskPremiumPercent: number,
): number {
  const realGain = calculateRealGainDecimal(riskFreePercent, riskPremiumPercent);
  const inflation = percentToDecimal(inflationPercent);
  return decimalToPercent(realGain * inflation);
}

export type TmarMethod = "simple" | "mixta";

export interface FundingSource {
  id: string;
  name: string;
  /** Participación dentro del negocio (%). */
  share: number;
  /** Costo asociado a la fuente (%). */
  cost: number;
}

export const DEFAULT_FUNDING_SOURCES: FundingSource[] = [
  { id: "equity", name: "Recursos propios", share: 40, cost: 15 },
  { id: "banks", name: "Bancos", share: 45, cost: 10 },
  { id: "coops", name: "Cooperativas", share: 15, cost: 12 },
];

/**
 * Procedimiento 1 — Inversionista único:
 * TMAR = Inflación + Riesgo + (Inflación × Riesgo)
 */
export function calculateInflationRiskTmarDecimal(
  inflationPercent: number,
  riskPremiumPercent: number,
): number {
  const inflation = percentToDecimal(inflationPercent);
  const risk = percentToDecimal(riskPremiumPercent);
  return inflation + risk + inflation * risk;
}

export function calculateInflationRiskTmarPercent(
  inflationPercent: number,
  riskPremiumPercent: number,
): number {
  return decimalToPercent(
    calculateInflationRiskTmarDecimal(inflationPercent, riskPremiumPercent),
  );
}

/**
 * Procedimiento 2 — Múltiples aportantes:
 * TMAR = Σ (Participación × Costo)
 */
export function calculateWeightedFundingTmarDecimal(
  sources: FundingSource[],
): number {
  return sources.reduce(
    (sum, source) =>
      sum + percentToDecimal(source.share) * percentToDecimal(source.cost),
    0,
  );
}

export function calculateWeightedFundingTmarPercent(
  sources: FundingSource[],
): number {
  return decimalToPercent(calculateWeightedFundingTmarDecimal(sources));
}

export function resolveProjectTmarPercent(
  method: TmarMethod,
  inflationPercent: number,
  riskPremiumPercent: number,
  fundingSources: FundingSource[],
): number {
  if (method === "mixta") {
    return calculateWeightedFundingTmarPercent(fundingSources);
  }
  return calculateInflationRiskTmarPercent(inflationPercent, riskPremiumPercent);
}

export function sumFundingShares(sources: FundingSource[]): number {
  return sources.reduce((sum, source) => sum + Number(source.share || 0), 0);
}
