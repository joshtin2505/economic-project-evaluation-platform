import { describe, it, expect } from "vitest";
import {
  generateScenarioFlows,
  calculateScenarioResults,
  buildExpectedValueNpv,
  calculateRiskMetrics,
} from "./scenario-engine";

describe("Scenario Engine", () => {
  const baseFlows = [
    { period: 1, inflow: 500, outflow: 100 },
    { period: 2, inflow: 600, outflow: 150 },
  ];

  it("aplica variaciones a ingresos y egresos correctamente", () => {
    // Inflow +10%, Outflow -10%
    const flows = generateScenarioFlows(baseFlows, 10, -10);
    expect(flows[0].inflow).toBeCloseTo(550, 2);
    expect(flows[0].outflow).toBeCloseTo(90, 2);
    expect(flows[1].inflow).toBeCloseTo(660, 2);
    expect(flows[1].outflow).toBeCloseTo(135, 2);
  });

  it("calcula métricas de escenario específico", () => {
    const res = calculateScenarioResults(500, baseFlows, 10);
    expect(res.npv).toBeGreaterThan(0);
    expect(res.isViable).toBe(true);
    expect(res.irr).not.toBeNull();
  });

  it("calcula el Valor Presente Neto Esperado normalizando probabilidades", () => {
    // Tres escenarios: Pesimista (-100, 20%), Base (200, 50%), Optimista (500, 30%)
    // E[VPN] = 0.20 * (-100) + 0.50 * 200 + 0.30 * 500 = -20 + 100 + 150 = 230
    const scenarios = [
      { probability: 20, npv: -100 },
      { probability: 50, npv: 200 },
      { probability: 30, npv: 500 },
    ];
    const expected = buildExpectedValueNpv(scenarios);
    expect(expected).toBeCloseTo(230, 2);
  });

  it("calcula varianza, desviación estándar y coeficiente de variación de riesgo", () => {
    // Escenario 1: VPN = 100, p = 50%
    // Escenario 2: VPN = 300, p = 50%
    // E[VPN] = 200
    // Var = 0.5 * (100 - 200)^2 + 0.5 * (300 - 200)^2 = 0.5 * 10000 + 0.5 * 10000 = 10000
    // DesvEst = sqrt(10000) = 100
    // CV = 100 / 200 = 0.5 (Moderado)
    const scenarios = [
      { probability: 50, npv: 100 },
      { probability: 50, npv: 300 },
    ];
    const risk = calculateRiskMetrics(scenarios);
    expect(risk.expectedNpv).toBe(200);
    expect(risk.variance).toBe(10000);
    expect(risk.standardDeviation).toBe(100);
    expect(risk.coefficientOfVariation).toBe(0.5);
    expect(risk.riskLevel).toBe("Moderado");
  });
});
