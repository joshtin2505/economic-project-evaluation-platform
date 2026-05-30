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
