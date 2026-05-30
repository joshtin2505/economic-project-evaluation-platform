export interface ProjectResultsRecord {
  npv?: number;
  irr?: number;
  tmar?: number;
  benefitCostRatio?: number;
  bcRatio?: number;
  paybackPeriod?: number;
  profitabilityIndex?: number;
  isViable?: boolean;
}

export interface ProjectRecord {
  id: string;
  name: string;
  description?: string | null;
  initial_investment: number | string;
  periods: number;
  discount_rate?: number | string;
  inflation?: number | string;
  risk_premium?: number | string;
  status: "draft" | "analyzing" | "completed";
  results: ProjectResultsRecord | null;
  updated_at?: string;
}

export interface CashFlowRecord {
  period: number;
  inflow: number | string;
  outflow: number | string;
}

export interface CashFlowTimelinePoint {
  period: string;
  inflow: number;
  outflow: number;
}

export interface CumulativeCashFlowPoint extends CashFlowTimelinePoint {
  netFlow: number;
  cumulative: number;
}

export interface RecentCalculationRow {
  id: number;
  project: string;
  indicator: string;
  value: string;
  date: string;
  status: "positive" | "negative";
}

export interface NotificationRow {
  id: number;
  type: "success" | "warning" | "info";
  message: string;
  time: string;
}

export interface BenefitCostEntry {
  category: string;
  amount: number;
  pvAmount: number;
}

export interface TIRIteration {
  iteration: number;
  rate: number;
  npv: number;
  derivative: number;
  adjustment: number;
  converged: boolean;
}

import { asDecimal, formatDecimalRate } from "@/lib/utils/project-results";

const toNumber = (value: number | string | null | undefined) =>
  Number(value ?? 0);

export function selectFeaturedProject(projects: ProjectRecord[]) {
  return (
    projects.find((project) => project.status === "completed") ??
    projects.find((project) => project.results) ??
    projects[0] ??
    null
  );
}

export function buildCashFlowTimeline(
  project: Pick<ProjectRecord, "initial_investment">,
  cashFlows: CashFlowRecord[],
): CashFlowTimelinePoint[] {
  return [
    {
      period: "Year 0",
      inflow: 0,
      outflow: toNumber(project.initial_investment),
    },
    ...cashFlows
      .slice()
      .sort((left, right) => left.period - right.period)
      .map((cashFlow) => ({
        period: `Year ${cashFlow.period}`,
        inflow: toNumber(cashFlow.inflow),
        outflow: toNumber(cashFlow.outflow),
      })),
  ];
}

export function buildCumulativeCashFlow(
  project: Pick<ProjectRecord, "initial_investment">,
  cashFlows: CashFlowRecord[],
): CumulativeCashFlowPoint[] {
  const timeline = buildCashFlowTimeline(project, cashFlows);

  let cumulative = 0;
  return timeline.map((point, index) => {
    const netFlow = index === 0 ? -point.outflow : point.inflow - point.outflow;
    cumulative += netFlow;

    return {
      ...point,
      netFlow,
      cumulative,
    };
  });
}

export function buildBenefitCostData(
  project: Pick<ProjectRecord, "initial_investment" | "discount_rate">,
  cashFlows: CashFlowRecord[],
) {
  const discountRate = toNumber(project.discount_rate) / 100;
  const benefits: BenefitCostEntry[] = cashFlows
    .filter((cashFlow) => toNumber(cashFlow.inflow) > 0)
    .map((cashFlow) => {
      const inflow = toNumber(cashFlow.inflow);
      const pvAmount = inflow / Math.pow(1 + discountRate, cashFlow.period);

      return {
        category: `Year ${cashFlow.period} inflow`,
        amount: inflow,
        pvAmount,
      };
    });

  const costs: BenefitCostEntry[] = [
    {
      category: "Initial Investment",
      amount: toNumber(project.initial_investment),
      pvAmount: toNumber(project.initial_investment),
    },
    ...cashFlows
      .filter((cashFlow) => toNumber(cashFlow.outflow) > 0)
      .map((cashFlow) => {
        const outflow = toNumber(cashFlow.outflow);
        const pvAmount = outflow / Math.pow(1 + discountRate, cashFlow.period);

        return {
          category: `Year ${cashFlow.period} outflow`,
          amount: outflow,
          pvAmount,
        };
      }),
  ];

  return { benefits, costs };
}

export function buildRecentCalculations(
  projects: ProjectRecord[],
  limit = 5,
): RecentCalculationRow[] {
  const rows = projects
    .filter((project) => project.results)
    .sort((left, right) => {
      const leftDate = new Date(left.updated_at ?? 0).getTime();
      const rightDate = new Date(right.updated_at ?? 0).getTime();
      return rightDate - leftDate;
    })
    .flatMap((project) => {
      const rowsForProject: RecentCalculationRow[] = [];

      if (typeof project.results?.npv === "number") {
        rowsForProject.push({
          id: rowsForProject.length + project.id.length,
          project: project.name,
          indicator: "NPV",
          value: `$${project.results.npv.toLocaleString()}`,
          date: project.updated_at
            ? new Date(project.updated_at).toLocaleDateString()
            : "-",
          status: project.results.npv >= 0 ? "positive" : "negative",
        });
      }

      if (typeof project.results?.irr === "number") {
        rowsForProject.push({
          id: rowsForProject.length + project.id.length + 1000,
          project: project.name,
          indicator: "IRR",
          value: formatDecimalRate(asDecimal(project.results.irr), 1),
          date: project.updated_at
            ? new Date(project.updated_at).toLocaleDateString()
            : "-",
          status:
            asDecimal(project.results.irr) >= asDecimal(project.results.tmar ?? 0)
              ? "positive"
              : "negative",
        });
      }

      return rowsForProject;
    });

  return rows.slice(0, limit);
}

export function buildNotifications(
  projects: ProjectRecord[],
): NotificationRow[] {
  const latestCompleted = projects
    .filter((project) => project.status === "completed")
    .sort(
      (left, right) =>
        new Date(right.updated_at ?? 0).getTime() -
        new Date(left.updated_at ?? 0).getTime(),
    )[0];

  const negativeProject = projects.find(
    (project) => (project.results?.npv ?? 0) < 0,
  );
  const draftProject = projects.find((project) => project.status === "draft");

  return [
    latestCompleted
      ? {
          id: 1,
          type: "success" as const,
          message: `${latestCompleted.name} analysis completed`,
          time: latestCompleted.updated_at
            ? new Date(latestCompleted.updated_at).toLocaleDateString()
            : "Recently",
        }
      : null,
    negativeProject
      ? {
          id: 2,
          type: "warning" as const,
          message: `${negativeProject.name} NPV below threshold`,
          time: negativeProject.updated_at
            ? new Date(negativeProject.updated_at).toLocaleDateString()
            : "Recently",
        }
      : null,
    draftProject
      ? {
          id: 3,
          type: "info" as const,
          message: `${draftProject.name} draft saved`,
          time: draftProject.updated_at
            ? new Date(draftProject.updated_at).toLocaleDateString()
            : "Recently",
        }
      : null,
  ].filter(Boolean) as NotificationRow[];
}

export function buildFinancialEvolutionData(projects: ProjectRecord[]) {
  const sortedProjects = projects
    .filter(
      (project) => project.results && typeof project.results.npv === "number",
    )
    .sort(
      (left, right) =>
        new Date(left.updated_at ?? 0).getTime() -
        new Date(right.updated_at ?? 0).getTime(),
    );

  let runningTotal = 0;

  return sortedProjects.slice(-6).map((project) => {
    runningTotal += project.results?.npv ?? 0;
    const label = project.updated_at
      ? new Date(project.updated_at).toLocaleDateString(undefined, {
          month: "short",
        })
      : project.name;

    return {
      month: label,
      npv: Math.round(runningTotal),
      projectedNpv: Math.round(runningTotal * 1.08),
    };
  });
}

export function buildNpvVsRateData(
  project: Pick<ProjectRecord, "initial_investment" | "results">,
  cashFlows: CashFlowRecord[],
) {
  const irrPercent =
    typeof project.results?.irr === "number"
      ? asDecimal(project.results.irr) * 100
      : null;
  const baseSamples = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24];
  const samples =
    irrPercent !== null && !baseSamples.includes(Math.round(irrPercent * 10) / 10)
      ? [...baseSamples, Math.round(irrPercent * 10) / 10].sort((a, b) => a - b)
      : baseSamples;

  return samples.map((ratePercent) => {
    const rate = ratePercent / 100;
    const npv = cashFlows.reduce(
      (sum, cashFlow) =>
        sum +
        (toNumber(cashFlow.inflow) - toNumber(cashFlow.outflow)) /
          Math.pow(1 + rate, cashFlow.period),
      -toNumber(project.initial_investment),
    );

    return {
      rate: ratePercent,
      npv: Math.round(npv),
    };
  });
}

export function buildTirIterations(
  project: Pick<ProjectRecord, "initial_investment" | "discount_rate">,
  cashFlows: CashFlowRecord[],
  maxIterations = 8,
) {
  let rate = Math.max(0.01, toNumber(project.discount_rate) / 100 || 0.1);
  const iterations: TIRIteration[] = [];

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const npv = cashFlows.reduce(
      (sum, cashFlow) =>
        sum +
        (toNumber(cashFlow.inflow) - toNumber(cashFlow.outflow)) /
          Math.pow(1 + rate, cashFlow.period),
      -toNumber(project.initial_investment),
    );

    const derivative = cashFlows.reduce((sum, cashFlow) => {
      const netFlow = toNumber(cashFlow.inflow) - toNumber(cashFlow.outflow);
      return (
        sum -
        (cashFlow.period * netFlow) / Math.pow(1 + rate, cashFlow.period + 1)
      );
    }, 0);

    const adjustment = derivative === 0 ? 0 : npv / derivative;
    const nextRate = rate - adjustment;
    const converged = Math.abs(npv) < 1;

    iterations.push({
      iteration,
      rate,
      npv: Math.round(npv),
      derivative: Math.round(derivative),
      adjustment,
      converged,
    });

    rate = nextRate;

    if (converged) {
      break;
    }
  }

  return iterations;
}

export function estimatePaybackPeriod(
  project: Pick<ProjectRecord, "initial_investment">,
  cashFlows: CashFlowRecord[],
) {
  let cumulative = -toNumber(project.initial_investment);

  for (const cashFlow of cashFlows.sort(
    (left, right) => left.period - right.period,
  )) {
    const netFlow = toNumber(cashFlow.inflow) - toNumber(cashFlow.outflow);
    const previous = cumulative;
    cumulative += netFlow;

    if (cumulative >= 0) {
      const fraction = netFlow === 0 ? 0 : Math.abs(previous) / netFlow;
      return cashFlow.period - 1 + fraction;
    }
  }

  return null;
}

export function buildVpnSteps(
  project: Pick<ProjectRecord, "initial_investment" | "discount_rate">,
  cashFlows: CashFlowRecord[],
) {
  const discountRate = toNumber(project.discount_rate) / 100;
  let accumulatedNPV = -toNumber(project.initial_investment);

  return [
    {
      period: 0,
      cashFlow: -toNumber(project.initial_investment),
      discountFactor: 1,
      discountedValue: -toNumber(project.initial_investment),
      accumulatedNPV,
    },
    ...cashFlows
      .slice()
      .sort((left, right) => left.period - right.period)
      .map((cashFlow) => {
        const netFlow = toNumber(cashFlow.inflow) - toNumber(cashFlow.outflow);
        const discountFactor = Math.pow(1 + discountRate, cashFlow.period);
        const discountedValue = netFlow / discountFactor;
        accumulatedNPV += discountedValue;

        return {
          period: cashFlow.period,
          cashFlow: netFlow,
          discountFactor,
          discountedValue,
          accumulatedNPV,
        };
      }),
  ];
}
