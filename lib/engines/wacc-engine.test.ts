import { describe, it, expect } from "vitest";
import { calculateWacc, buildCapitalStructure } from "./wacc-engine";

describe("WACC Engine", () => {
  it("calcula WACC clásico: We=60%, Ke=15%, Wd=40%, Kd=10%, Tax=35%", () => {
    // Ke = 15%, Kd = 10%, We = 0.60, Wd = 0.40, Tax = 35%
    // WACC = 0.60 * 15% + 0.40 * 10% * (1 - 0.35)
    // WACC = 9.0% + 4% * 0.65 = 9.0% + 2.6% = 11.60%
    const wacc = calculateWacc(15, 10, 0.6, 0.4, 35);
    expect(wacc).toBeCloseTo(11.6, 2);
  });

  it("calcula WACC con 100% fondos propios (sin deuda)", () => {
    const wacc = calculateWacc(14, 0, 1.0, 0, 35);
    expect(wacc).toBeCloseTo(14.0, 2);
  });

  it("calcula WACC con tasa impositiva cero", () => {
    // WACC = 0.5 * 20% + 0.5 * 10% * 1 = 15%
    const wacc = calculateWacc(20, 10, 0.5, 0.5, 0);
    expect(wacc).toBeCloseTo(15.0, 2);
  });

  it("resuelve la estructura de capital consolidada a partir de préstamos", () => {
    const loans = [
      { principal: 40000, annualRate: 10 },
      { principal: 10000, annualRate: 12 },
    ];
    // Inversión total = 100,000; Deuda total = 50,000 (50%); Patrimonio = 50,000 (50%)
    // Kd ponderado = (40k*10% + 10k*12%) / 50k = (4000 + 1200)/50000 = 5200/50000 = 10.4%
    // Kd después de impuesto (35%) = 10.4% * 0.65 = 6.76%
    // Ke = 16% -> WACC = 0.5 * 16% + 0.5 * 6.76% = 8% + 3.38% = 11.38%
    const structure = buildCapitalStructure(loans, 100000, 16, 35);

    expect(structure.totalDebt).toBe(50000);
    expect(structure.totalEquity).toBe(50000);
    expect(structure.debtWeight).toBeCloseTo(0.5, 2);
    expect(structure.equityWeight).toBeCloseTo(0.5, 2);
    expect(structure.costOfDebtBeforeTax).toBeCloseTo(10.4, 2);
    expect(structure.wacc).toBeCloseTo(11.38, 2);
  });
});
