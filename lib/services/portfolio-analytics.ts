import type {
  CashFlowRecord,
  ProjectRecord,
} from "@/lib/services/project-analytics";
import { asDecimal } from "@/lib/utils/project-results";

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

export interface ProjectWithCashFlows {
  project: ProjectRecord;
  cashFlows: CashFlowRecord[];
}

export interface PortfolioMetrics {
  portfolioNpv: number;
  /** TIR consolidada del portafolio (decimal, ej. 0.152). */
  consolidatedIrrDecimal: number | null;
  /** TMAR promedio ponderada por inversión inicial (decimal). */
  weightedTmarDecimal: number | null;
  avgBcRatio: number;
  activeProjectCount: number;
}

/** Proyectos con análisis utilizable (no borrador). */
export function getActiveProjects(projects: ProjectRecord[]): ProjectRecord[] {
  return projects.filter((project) => project.status !== "draft");
}

export function getProjectsWithResults(
  projects: ProjectRecord[],
): ProjectRecord[] {
  return projects.filter(
    (project) =>
      project.results &&
      (typeof project.results.npv === "number" ||
        typeof project.results.irr === "number"),
  );
}

/**
 * Flujo consolidado: periodo 0 = -Σ inversión inicial;
 * periodo t = Σ (entrada - salida) de cada proyecto activo.
 */
export function buildConsolidatedCashFlowSeries(
  entries: ProjectWithCashFlows[],
): number[] {
  if (entries.length === 0) return [];

  const maxPeriod = entries.reduce((max, entry) => {
    const projectMax = entry.cashFlows.reduce(
      (periodMax, flow) => Math.max(periodMax, flow.period),
      0,
    );
    return Math.max(max, projectMax);
  }, 0);

  const series: number[] = [
    -entries.reduce(
      (sum, entry) => sum + toNumber(entry.project.initial_investment),
      0,
    ),
  ];

  for (let period = 1; period <= maxPeriod; period += 1) {
    const net = entries.reduce((sum, entry) => {
      const flow = entry.cashFlows.find((row) => row.period === period);
      if (!flow) return sum;
      return sum + (toNumber(flow.inflow) - toNumber(flow.outflow));
    }, 0);
    series.push(net);
  }

  return series;
}

/** TIR global sobre flujo consolidado (retorno decimal). */
export function calculateIrrFromConsolidatedSeries(
  consolidatedSeries: number[],
): number | null {
  if (consolidatedSeries.length < 2) return null;

  const hasPositive = consolidatedSeries.some((value, index) =>
    index === 0 ? false : value > 0,
  );
  if (!hasPositive) return null;

  let low = -0.99;
  let high = 5;

  const npvAt = (rate: number) =>
    consolidatedSeries.reduce(
      (sum, cashFlow, period) => sum + cashFlow / Math.pow(1 + rate, period),
      0,
    );

  if (npvAt(low) * npvAt(high) > 0) {
    return null;
  }

  for (let iteration = 0; iteration < 80; iteration += 1) {
    const mid = (low + high) / 2;
    const npv = npvAt(mid);
    if (Math.abs(npv) < 1e-4) return mid;
    if (npv > 0) low = mid;
    else high = mid;
  }

  return (low + high) / 2;
}

export function calculateWeightedTmarDecimal(
  projects: ProjectRecord[],
): number | null {
  const weighted = projects.reduce(
    (acc, project) => {
      const weight = toNumber(project.initial_investment);
      const tmar = project.results?.tmar;
      if (weight <= 0 || typeof tmar !== "number") return acc;

      return {
        totalWeight: acc.totalWeight + weight,
        weightedSum: acc.weightedSum + asDecimal(tmar) * weight,
      };
    },
    { totalWeight: 0, weightedSum: 0 },
  );

  if (weighted.totalWeight === 0) return null;
  return weighted.weightedSum / weighted.totalWeight;
}

export function calculatePortfolioMetrics(
  projects: ProjectRecord[],
  entries: ProjectWithCashFlows[],
): PortfolioMetrics {
  const withResults = getProjectsWithResults(projects);
  const active = getActiveProjects(projects);

  const portfolioNpv = withResults.reduce(
    (sum, project) => sum + toNumber(project.results?.npv),
    0,
  );

  const consolidatedSeries = buildConsolidatedCashFlowSeries(
    entries.filter(
      (entry) =>
        entry.cashFlows.length > 0 &&
        toNumber(entry.project.initial_investment) > 0,
    ),
  );

  const consolidatedIrrDecimal =
    calculateIrrFromConsolidatedSeries(consolidatedSeries);

  const weightedTmarDecimal = calculateWeightedTmarDecimal(withResults);
  const bcRows = withResults.filter(
    (project) =>
      typeof project.results?.benefitCostRatio === "number" ||
      typeof project.results?.bcRatio === "number",
  );

  const avgBcRatio =
    bcRows.length === 0
      ? 0
      : bcRows.reduce((sum, project) => {
          const ratio =
            project.results?.benefitCostRatio ?? project.results?.bcRatio;
          return sum + toNumber(ratio);
        }, 0) / bcRows.length;

  return {
    portfolioNpv,
    consolidatedIrrDecimal,
    weightedTmarDecimal,
    avgBcRatio,
    activeProjectCount: active.length,
  };
}

/** Requiere ≥2 proyectos con resultados en meses distintos (updated_at). */
export function canShowNpvEvolutionChart(projects: ProjectRecord[]): boolean {
  const withResults = getProjectsWithResults(projects);
  if (withResults.length < 2) return false;

  const months = new Set(
    withResults.map((project) => {
      const date = new Date(project.updated_at ?? 0);
      return `${date.getFullYear()}-${date.getMonth()}`;
    }),
  );

  return months.size >= 2;
}
