import { useEffect, useMemo, useState } from "react";
import {
  DEFAULT_USER_PROFILE,
  fetchUserProfile,
} from "@/lib/services/user-profiles";
import {
  DEFAULT_FUNDING_SOURCES,
  type FundingSource,
  resolveProjectTmarPercent,
  sumFundingShares,
  type TmarMethod,
} from "@/lib/utils/tmar";

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
  tmar_method?: TmarMethod;
  funding_sources?: FundingSource[];
  cashFlows?: CashFlowRow[];
  use_tmar_as_discount_rate: boolean;
  salvage_value?: number;
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
  const [tmarMethod, setTmarMethod] = useState<TmarMethod>(
    initial?.tmar_method ?? "simple",
  );
  const [useTmarAsDiscountRate, setUseTmarAsDiscountRate] = useState<boolean>(
    initial?.use_tmar_as_discount_rate ?? false,
  );
  const [salvageValue, setSalvageValue] = useState<number>(
    initial?.salvage_value ?? 0,
  );
  const [fundingSources, setFundingSources] = useState<FundingSource[]>(
    initial?.funding_sources?.length
      ? initial.funding_sources
      : DEFAULT_FUNDING_SOURCES.map((source) => ({ ...source })),
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
    if (initial) return;

    const loadDefaults = async () => {
      try {
        const profile = await fetchUserProfile();
        const defaults = profile ?? DEFAULT_USER_PROFILE;
        setDiscountRate(Number(defaults.default_discount_rate));
        setInflation(Number(defaults.default_inflation));
        setRiskPremium(Number(defaults.default_risk_premium));
        const defaultPeriods = Number(defaults.default_periods);
        setPeriods(defaultPeriods);
        setCashFlows(
          Array.from({ length: defaultPeriods }, (_, index) => ({
            period: index + 1,
            inflow: 0,
            outflow: 0,
          })),
        );
      } catch {
        // Keep built-in defaults
      }
    };

    void loadDefaults();
  }, [initial]);

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

  const updateFundingSource = (
    id: string,
    field: keyof Pick<FundingSource, "name" | "share" | "cost">,
    value: string | number,
  ) => {
    setFundingSources((current) =>
      current.map((source) =>
        source.id === id
          ? {
              ...source,
              [field]:
                field === "name" ? String(value) : Number(value) || 0,
            }
          : source,
      ),
    );
  };

  const addFundingSource = () => {
    setFundingSources((current) => [
      ...current,
      {
        id: `source-${Date.now()}`,
        name: "",
        share: 0,
        cost: 0,
      },
    ]);
  };

  const removeFundingSource = (id: string) => {
    setFundingSources((current) =>
      current.length > 1 ? current.filter((source) => source.id !== id) : current,
    );
  };

  const calculations = useMemo(() => {
    const tmarPercent = resolveProjectTmarPercent(
      tmarMethod,
      inflation,
      riskPremium,
      fundingSources,
    );
    
    // Use TMAR as discount rate if checkbox is checked, otherwise use manual discount rate
    const effectiveDiscountRate = useTmarAsDiscountRate ? tmarPercent : discountRate;
    const rate = effectiveDiscountRate / 100;
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

    const fundingShareTotal = sumFundingShares(fundingSources);

    const pvBenefits = cashFlows.reduce((sum, cf, index) => {
      return sum + cf.inflow / Math.pow(1 + rate, index + 1);
    }, 0);
    const pvCosts =
      initialInvestment +
      cashFlows.reduce((sum, cf, index) => {
        return sum + cf.outflow / Math.pow(1 + rate, index + 1);
      }, 0);
    const bcRatio = pvCosts > 0 ? pvBenefits / pvCosts : 0;
    const irrPercent = irr * 100;

    // Calculate profitability index: PV of benefits / Initial investment
    const profitabilityIndex = initialInvestment > 0 ? pvBenefits / initialInvestment : 0;

    // Calculate payback period
    let cumulativeCashFlow = -initialInvestment;
    let paybackPeriod: number | undefined;
    for (let i = 0; i < cashFlows.length; i++) {
      cumulativeCashFlow += cashFlows[i].inflow - cashFlows[i].outflow;
      if (cumulativeCashFlow >= 0) {
        const previousCumulative = cumulativeCashFlow - (cashFlows[i].inflow - cashFlows[i].outflow);
        const fraction = Math.abs(previousCumulative) / (cashFlows[i].inflow - cashFlows[i].outflow);
        paybackPeriod = i + fraction;
        break;
      }
    }

    return {
      npv: Math.round(npv),
      irr: irrPercent.toFixed(2),
      tmar: tmarPercent.toFixed(2),
      tmarMethod,
      fundingShareTotal,
      bcRatio: bcRatio.toFixed(2),
      totalInflows,
      totalOutflows,
      effectiveDiscountRate,
      useTmarAsDiscountRate,
      profitabilityIndex,
      paybackPeriod,
      isViable: npv > 0 && irrPercent > tmarPercent && bcRatio > 1,
    };
  }, [
    cashFlows,
    discountRate,
    fundingSources,
    inflation,
    initialInvestment,
    riskPremium,
    tmarMethod,
    useTmarAsDiscountRate,
  ]);

  const setInitialValues = (data: any, flows: CashFlowRow[] | null) => {
    setProjectName(data?.name ?? "");
    setDescription(data?.description ?? "");
    setInitialInvestment(Number(data?.initial_investment) || 0);
    setDiscountRate(Number(data?.discount_rate) || 0);
    setInflation(Number(data?.inflation) || 0);
    setRiskPremium(Number(data?.risk_premium) || 0);
    setTmarMethod(data?.tmar_method === "mixta" ? "mixta" : "simple");
    setUseTmarAsDiscountRate(Boolean(data?.use_tmar_as_discount_rate) || false);
    setSalvageValue(Number(data?.salvage_value) || 0);
    if (Array.isArray(data?.funding_sources) && data.funding_sources.length > 0) {
      setFundingSources(
        data.funding_sources.map((source: FundingSource, index: number) => ({
          id: source.id ?? `source-${index}`,
          name: source.name ?? "",
          share: Number(source.share) || 0,
          cost: Number(source.cost) || 0,
        })),
      );
    }
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

  // Function to collect project data for database storage
  const obtenerDatosProyecto = () => {
    return {
      nombre: projectName,
      descripcion: description,
      inversion_inicial: initialInvestment,
      tasa_descuento: discountRate,
      periodos: periods,
      metodo_tmar: tmarMethod,
      usar_tmar_como_tasa_descuento: useTmarAsDiscountRate,
      // Only include origin data for the selected method
      datos_tmar: {
        metodo: tmarMethod,
        ...(tmarMethod === "simple" ? {
          inflacion: inflation,
          prima_riesgo: riskPremium,
        } : {
          fuentes_financiamiento: fundingSources.map(source => ({
            id: source.id,
            nombre: source.name,
            participacion: source.share,
            costo: source.cost,
          })),
        }),
      },
      flujos_efectivo: cashFlows.map(cf => ({
        periodo: cf.period,
        entrada: cf.inflow,
        salida: cf.outflow,
        flujo_neto: cf.inflow - cf.outflow,
      })),
      resultados: {
        vpn: calculations.npv,
        tir: calculations.irr,
        tmar: calculations.tmar,
        tasa_descuento_efectiva: calculations.effectiveDiscountRate,
        relacion_beneficio_costo: calculations.bcRatio,
        total_entradas: calculations.totalInflows,
      },
    };
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
    tmarMethod,
    setTmarMethod,
    useTmarAsDiscountRate,
    setUseTmarAsDiscountRate,
    fundingSources,
    updateFundingSource,
    addFundingSource,
    removeFundingSource,
    cashFlows,
    addPeriod,
    removePeriod,
    updateCashFlow,
    calculations,
    setInitialValues,
    obtenerDatosProyecto,
    salvageValue,
    setSalvageValue,
  };
}
