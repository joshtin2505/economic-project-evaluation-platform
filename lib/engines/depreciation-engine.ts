/**
 * Motor de Depreciación de Activos (Pure Depreciation Engine)
 * Modela métodos contables y financieros de depreciación:
 * Línea Recta, Saldos Decrecientes (Doble Cuota) y Suma de Dígitos de los Años (SDA).
 */

export type DepreciationMethod =
  | "straight_line"
  | "declining_balance"
  | "sum_of_years"
  | "units_of_production";

export interface AssetInputParams {
  acquisitionCost: number;
  salvageValue?: number;
  usefulLifePeriods: number; // vida útil en años o períodos
  depreciationMethod: DepreciationMethod;
  acquisitionPeriod?: number; // período en el que se adquiere el activo (default 0)
}

export interface DepreciationRow {
  period: number;
  depreciationExpense: number;
  accumulatedDepreciation: number;
  bookValue: number;
}

export interface AssetDepreciationSummary {
  cost: number;
  salvageValue: number;
  depreciableBase: number;
  usefulLife: number;
  schedule: DepreciationRow[];
}

/**
 * Método de Línea Recta: Depreciación constante uniforme
 * Gasto = (Costo - ValorSalvamento) / VidaUtil
 */
export function calculateStraightLine(
  cost: number,
  salvage = 0,
  usefulLife: number,
  acquisitionPeriod = 0,
): DepreciationRow[] {
  if (usefulLife <= 0) return [];

  const depreciableBase = Math.max(0, cost - salvage);
  const annualExpense = depreciableBase / usefulLife;
  const schedule: DepreciationRow[] = [];

  let accumulated = 0;

  for (let t = 1; t <= usefulLife; t++) {
    const period = acquisitionPeriod + t;
    accumulated += annualExpense;

    // En el último año aseguramos que el valor en libros sea exactamente el valor de salvamento
    if (t === usefulLife) {
      accumulated = depreciableBase;
    }

    const bookValue = Math.max(salvage, cost - accumulated);

    schedule.push({
      period,
      depreciationExpense: Math.round(annualExpense * 100) / 100,
      accumulatedDepreciation: Math.round(accumulated * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Método de Saldos Decrecientes (Doble Cuota Decreciente / Declining Balance)
 * Tasa = (1 / VidaUtil) * factor (usualmente factor = 2 para doble cuota decreciente)
 */
export function calculateDecliningBalance(
  cost: number,
  salvage = 0,
  usefulLife: number,
  accelerationFactor = 2,
  acquisitionPeriod = 0,
): DepreciationRow[] {
  if (usefulLife <= 0) return [];

  const rate = (1 / usefulLife) * accelerationFactor;
  const schedule: DepreciationRow[] = [];

  let bookValue = cost;
  let accumulated = 0;

  for (let t = 1; t <= usefulLife; t++) {
    const period = acquisitionPeriod + t;
    let expense = bookValue * rate;

    // No se puede depreciar por debajo del valor de salvamento
    if (bookValue - expense < salvage) {
      expense = Math.max(0, bookValue - salvage);
    }

    // En el último año se ajusta el remanente si es mayor al valor de salvamento
    if (t === usefulLife && bookValue - expense > salvage) {
      expense = Math.max(0, bookValue - salvage);
    }

    accumulated += expense;
    bookValue = Math.max(salvage, bookValue - expense);

    schedule.push({
      period,
      depreciationExpense: Math.round(expense * 100) / 100,
      accumulatedDepreciation: Math.round(accumulated * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Método de Suma de Dígitos de los Años (SDA)
 * Denominador = n * (n + 1) / 2
 * Fracción año t = (n - t + 1) / Denominador
 */
export function calculateSumOfYears(
  cost: number,
  salvage = 0,
  usefulLife: number,
  acquisitionPeriod = 0,
): DepreciationRow[] {
  if (usefulLife <= 0) return [];

  const depreciableBase = Math.max(0, cost - salvage);
  const sumOfDigits = (usefulLife * (usefulLife + 1)) / 2;
  const schedule: DepreciationRow[] = [];

  let accumulated = 0;

  for (let t = 1; t <= usefulLife; t++) {
    const period = acquisitionPeriod + t;
    const fraction = (usefulLife - t + 1) / sumOfDigits;
    const expense = depreciableBase * fraction;

    accumulated += expense;
    if (t === usefulLife) {
      accumulated = depreciableBase;
    }

    const bookValue = Math.max(salvage, cost - accumulated);

    schedule.push({
      period,
      depreciationExpense: Math.round(expense * 100) / 100,
      accumulatedDepreciation: Math.round(accumulated * 100) / 100,
      bookValue: Math.round(bookValue * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Genera el cronograma de depreciación completo para un activo
 */
export function generateDepreciationSchedule(input: AssetInputParams): AssetDepreciationSummary {
  const salvage = Math.max(0, input.salvageValue || 0);
  const acquisitionPeriod = input.acquisitionPeriod || 0;

  let schedule: DepreciationRow[] = [];

  switch (input.depreciationMethod) {
    case "declining_balance":
      schedule = calculateDecliningBalance(input.acquisitionCost, salvage, input.usefulLifePeriods, 2, acquisitionPeriod);
      break;
    case "sum_of_years":
      schedule = calculateSumOfYears(input.acquisitionCost, salvage, input.usefulLifePeriods, acquisitionPeriod);
      break;
    case "straight_line":
    default:
      schedule = calculateStraightLine(input.acquisitionCost, salvage, input.usefulLifePeriods, acquisitionPeriod);
      break;
  }

  return {
    cost: input.acquisitionCost,
    salvageValue: salvage,
    depreciableBase: Math.max(0, input.acquisitionCost - salvage),
    usefulLife: input.usefulLifePeriods,
    schedule,
  };
}

export const generateAssetDepreciationSummary = generateDepreciationSchedule;
