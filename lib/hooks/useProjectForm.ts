import { useEffect, useMemo, useState } from "react";

interface CashFlowRow {
  period: number;
  inflow: number;
  outflow: number;
}

export function useProjectForm(initial?: {
  name?: string;
  description?: string;
  initial_investment?: number;
  discount_rate?: number;
  inflation?: number;
  risk_premium?: number;
  periods?: number;
  cashFlows?: CashFlowRow[];
}) {
  const [projectName, setProjectName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [initialInvestment, setInitialInvestment] = useState<number>(
    initial?.initial_investment ?? 500000,
  );
  const [periods, setPeriods] = useState<number>(
    initial?.periods ?? initial?.cashFlows?.length ?? 5,
  );
  const [discountRate, setDiscountRate] = useState<number>(
    initial?.discount_rate ?? 12,
  );
  const [inflation, setInflation] = useState<number>(initial?.inflation ?? 3);
  const [riskPremium, setRiskPremium] = useState<number>(
    initial?.risk_premium ?? 2,
  );

  const [cashFlows, setCashFlows] = useState<CashFlowRow[]>(
    initial?.cashFlows ??
      Array.from({ length: periods }, (_, i) => ({
        period: i + 1,
        inflow: 0,
        outflow: 0,
      })),
  );

  useEffect(() => {
    setCashFlows((current) => {
      if (periods === current.length) {
        return current;
      }

      if (periods > current.length) {
        const nextFlows = [...current];
        for (let index = current.length; index < periods; index += 1) {
          nextFlows.push({ period: index + 1, inflow: 0, outflow: 0 });
        }
        return nextFlows;
      }

      return current.slice(0, periods).map((flow, index) => ({
        ...flow,
        period: index + 1,
      }));
    });
  }, [periods]);

  const addPeriod = () => {
    const newPeriod = cashFlows.length + 1;
    setCashFlows([...cashFlows, { period: newPeriod, inflow: 0, outflow: 0 }]);
    setPeriods(newPeriod);
  };

  const removePeriod = (index: number) => {
    if (cashFlows.length > 1) {
      const newFlows = cashFlows
        .filter((_, i) => i !== index)
        .map((cf, i) => ({
          ...cf,
          period: i + 1,
        }));
      setCashFlows(newFlows);
      setPeriods(newFlows.length);
    }
  };

  const updateCashFlow = (
    index: number,
    field: "inflow" | "outflow",
    value: number,
  ) => {
    const newFlows = [...cashFlows];
    newFlows[index][field] = value;
    setCashFlows(newFlows);
  };

  const calculations = useMemo(() => {
    const rate = discountRate / 100;
    let npv = -initialInvestment;
    let totalInflows = 0;
    let totalOutflows = initialInvestment;

    cashFlows.forEach((cf, index) => {
      const netFlow = cf.inflow - cf.outflow;
      const discountFactor = Math.pow(1 + rate, index + 1);
      npv += netFlow / discountFactor;
      totalInflows += cf.inflow;
      totalOutflows += cf.outflow;
    });

    // Simple IRR approximation using bisection
    let irr = 0;
    let low = -0.5;
    let high = 1.0;
    for (let i = 0; i < 50; i++) {
      const mid = (low + high) / 2;
      let testNpv = -initialInvestment;
      cashFlows.forEach((cf, index) => {
        testNpv += (cf.inflow - cf.outflow) / Math.pow(1 + mid, index + 1);
      });
      if (testNpv > 0) {
        low = mid;
      } else {
        high = mid;
      }
      irr = mid;
    }

    const tmar = (discountRate + inflation + riskPremium) / 100;
    const pvBenefits = cashFlows.reduce((sum, cf, index) => {
      return sum + cf.inflow / Math.pow(1 + rate, index + 1);
    }, 0);
    const pvCosts =
      initialInvestment +
      cashFlows.reduce((sum, cf, index) => {
        return sum + cf.outflow / Math.pow(1 + rate, index + 1);
      }, 0);
    const bcRatio = pvBenefits / pvCosts;

    return {
      npv: Math.round(npv),
      irr: (irr * 100).toFixed(2),
      tmar: (tmar * 100).toFixed(1),
      bcRatio: bcRatio.toFixed(2),
      totalInflows,
      totalOutflows,
      isViable: npv > 0 && irr * 100 > tmar * 100 && bcRatio > 1,
    };
  }, [cashFlows, initialInvestment, discountRate, inflation, riskPremium]);

  const setInitialValues = (data: any, flows: CashFlowRow[] | null) => {
    setProjectName(data?.name ?? "");
    setDescription(data?.description ?? "");
    setInitialInvestment(Number(data?.initial_investment) || 0);
    setDiscountRate(Number(data?.discount_rate) || 0);
    setInflation(Number(data?.inflation) || 0);
    setRiskPremium(Number(data?.risk_premium) || 0);
    setPeriods(Number(data?.periods) || flows?.length || 1);
    if (flows && flows.length > 0) {
      setCashFlows(
        flows.map((f) => ({
          period: f.period,
          inflow: Number(f.inflow),
          outflow: Number(f.outflow),
        })),
      );
    }
  };

  return {
    projectName,
    setProjectName,
    description,
    setDescription,
    initialInvestment,
    setInitialInvestment,
    periods,
    setPeriods,
    discountRate,
    setDiscountRate,
    inflation,
    setInflation,
    riskPremium,
    setRiskPremium,
    cashFlows,
    addPeriod,
    removePeriod,
    updateCashFlow,
    calculations,
    setInitialValues,
  };
}
