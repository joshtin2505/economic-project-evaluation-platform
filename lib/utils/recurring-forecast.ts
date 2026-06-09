import type { IncomeSource, RecurringExpense } from "@/lib/services/recurring";

export interface RecurringForecastSummary {
  monthlyIncome: number;
  monthlyExpenses: number;
  monthlyNet: number;
  annualIncome: number;
  annualExpenses: number;
  annualNet: number;
}

function frequencyToMonthlyFactor(
  frequency: IncomeSource["frequency"] | RecurringExpense["frequency"],
) {
  switch (frequency) {
    case "daily":
      return 30;
    case "weekly":
      return 52 / 12;
    case "quarterly":
      return 1 / 3;
    case "annual":
      return 1 / 12;
    case "monthly":
    default:
      return 1;
  }
}

function toMonthlyAmount(
  amount: number | string | null | undefined,
  frequency: IncomeSource["frequency"] | RecurringExpense["frequency"],
) {
  return Number(amount ?? 0) * frequencyToMonthlyFactor(frequency);
}

export function buildRecurringForecastSummary(
  incomes: IncomeSource[],
  expenses: RecurringExpense[],
): RecurringForecastSummary {
  const monthlyIncome = incomes.reduce(
    (sum, item) => sum + toMonthlyAmount(item.amount, item.frequency),
    0,
  );
  const monthlyExpenses = expenses.reduce(
    (sum, item) => sum + toMonthlyAmount(item.amount, item.frequency),
    0,
  );
  const monthlyNet = monthlyIncome - monthlyExpenses;

  return {
    monthlyIncome,
    monthlyExpenses,
    monthlyNet,
    annualIncome: monthlyIncome * 12,
    annualExpenses: monthlyExpenses * 12,
    annualNet: monthlyNet * 12,
  };
}
