import { describe, it, expect } from "vitest";
import {
  runOneDimensionalSensitivity,
  runTwoDimensionalSensitivity,
  findBreakevenPoint,
} from "./sensitivity-engine";

describe("Sensitivity Engine", () => {
  const initialInvestment = 1000;
  const cashFlows = [
    { period: 1, inflow: 500, outflow: 0 },
    { period: 2, inflow: 500, outflow: 0 },
    { period: 3, inflow: 500, outflow: 0 },
  ];
  const discountRate = 0.10; // 10%

  it("calcula análisis unidimensional Tornado ordenado por swing", () => {
    const tornado = runOneDimensionalSensitivity(initialInvestment, cashFlows, discountRate, 20);
    expect(tornado.length).toBe(4);
    // Debe estar ordenado de mayor swing a menor swing
    for (let i = 0; i < tornado.length - 1; i++) {
      expect(tornado[i].swing).toBeGreaterThanOrEqual(tornado[i + 1].swing);
    }
    const invVar = tornado.find((v) => v.variableName === "initial_investment");
    expect(invVar).toBeDefined();
    // Inversión +-20% sobre 1000 da 800 y 1200; delta de VPN debe ser exactamente 400
    expect(invVar?.swing).toBeCloseTo(400, 0);
  });

  it("calcula matriz bidimensional (Heatmap)", () => {
    const matrixResult = runTwoDimensionalSensitivity(
      initialInvestment,
      cashFlows,
      10,
      [-2, 0, 2],
      [-10, 0, 10],
    );
    expect(matrixResult.matrix.length).toBe(3); // 3 filas en Y
    expect(matrixResult.matrix[0].length).toBe(3); // 3 columnas en X
    // Con tasa 10% y variación 0% debe aproximar el VPN base (243.43)
    const baseCell = matrixResult.matrix[1][1];
    expect(baseCell.npv).toBeCloseTo(243, 0);
    expect(baseCell.isViable).toBe(true);
  });

  it("calcula punto de equilibrio (breakeven) para la tasa de descuento (TIR)", () => {
    const be = findBreakevenPoint(initialInvestment, cashFlows, discountRate, "discount_rate");
    // TIR esperada = 23.38%
    expect(be.breakevenValue).toBeCloseTo(23.4, 1);
    expect(be.percentageChangeToBreakeven).toBeGreaterThan(0);
  });

  it("calcula punto de equilibrio para la inversión inicial", () => {
    const be = findBreakevenPoint(initialInvestment, cashFlows, discountRate, "initial_investment");
    // PV de flujos = 500 * (1 - 1.1^-3)/0.1 = 500 * 2.48685 = 1243.43
    expect(be.breakevenValue).toBeCloseTo(1243, 0);
  });
});
