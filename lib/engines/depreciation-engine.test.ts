import { describe, it, expect } from "vitest";
import {
  calculateStraightLine,
  calculateDecliningBalance,
  calculateSumOfYears,
  generateAssetDepreciationSummary,
} from "./depreciation-engine";

describe("Depreciation Engine", () => {
  const cost = 100000;
  const salvage = 10000;
  const usefulLife = 5;

  describe("Línea Recta (Straight Line)", () => {
    it("deprecia base depreciable uniformemente entre los 5 años", () => {
      const schedule = calculateStraightLine(cost, salvage, usefulLife);
      expect(schedule).toHaveLength(5);
      // Depreciable base = 90,000 / 5 = 18,000 / año
      for (const row of schedule) {
        expect(row.depreciationExpense).toBeCloseTo(18000, 2);
      }
      expect(schedule[4].accumulatedDepreciation).toBeCloseTo(90000, 2);
      expect(schedule[4].bookValue).toBeCloseTo(10000, 2);
    });

    it("maneja salvamento cero", () => {
      const schedule = calculateStraightLine(50000, 0, 5);
      expect(schedule[0].depreciationExpense).toBeCloseTo(10000, 2);
      expect(schedule[4].bookValue).toBe(0);
    });
  });

  describe("Suma de Dígitos de los Años (Sum of Years' Digits)", () => {
    it("deprecia aceleradamente según suma de 1+2+3+4+5=15", () => {
      const schedule = calculateSumOfYears(cost, salvage, usefulLife);
      expect(schedule).toHaveLength(5);
      // Año 1: 90000 * 5/15 = 30,000
      expect(schedule[0].depreciationExpense).toBeCloseTo(30000, 2);
      // Año 2: 90000 * 4/15 = 24,000
      expect(schedule[1].depreciationExpense).toBeCloseTo(24000, 2);
      // Año 3: 90000 * 3/15 = 18,000
      expect(schedule[2].depreciationExpense).toBeCloseTo(18000, 2);
      // Año 4: 90000 * 2/15 = 12,000
      expect(schedule[3].depreciationExpense).toBeCloseTo(12000, 2);
      // Año 5: 90000 * 1/15 = 6,000
      expect(schedule[4].depreciationExpense).toBeCloseTo(6000, 2);
      expect(schedule[4].bookValue).toBeCloseTo(10000, 2);
    });
  });

  describe("Saldos Decrecientes (Declining Balance / Doble Cuota)", () => {
    it("deprecia aceleradamente respetando el piso de valor de salvamento", () => {
      const schedule = calculateDecliningBalance(cost, salvage, usefulLife, 2);
      expect(schedule).toHaveLength(5);
      // Rate = 2 / 5 = 40%
      // Año 1: 100k * 40% = 40k -> libro 60k
      expect(schedule[0].depreciationExpense).toBeCloseTo(40000, 2);
      expect(schedule[0].bookValue).toBeCloseTo(60000, 2);
      // Año 2: 60k * 40% = 24k -> libro 36k
      expect(schedule[1].depreciationExpense).toBeCloseTo(24000, 2);
      expect(schedule[1].bookValue).toBeCloseTo(36000, 2);
      // Al final no cruza el valor de salvamento (10k)
      expect(schedule[4].bookValue).toBeGreaterThanOrEqual(salvage);
    });
  });

  describe("generateAssetDepreciationSummary", () => {
    it("genera el resumen consolidado del activo", () => {
      const summary = generateAssetDepreciationSummary({
        acquisitionCost: cost,
        salvageValue: salvage,
        usefulLifePeriods: usefulLife,
        depreciationMethod: "straight_line",
      });
      expect(summary.cost).toBe(cost);
      expect(summary.salvageValue).toBe(salvage);
      expect(summary.depreciableBase).toBe(90000);
      expect(summary.schedule).toHaveLength(5);
    });
  });
});
