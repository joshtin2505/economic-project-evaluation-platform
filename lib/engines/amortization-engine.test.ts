import { describe, it, expect } from "vitest";
import {
  calculateFrenchAmortization,
  calculateGermanAmortization,
  calculateAmericanAmortization,
  generateAmortizationTable,
} from "./amortization-engine";

describe("Amortization Engine", () => {
  const principal = 100000;
  const ratePercent = 12; // 12% anual
  const rateDecimal = 0.12;
  const term = 5;

  describe("Sistema Francés (Cuota Fija)", () => {
    it("genera cuota fija exacta de 27,740.97 para 100k al 12% en 5 años", () => {
      const schedule = calculateFrenchAmortization(principal, rateDecimal, term);
      expect(schedule).toHaveLength(5);
      // Cuota = 100000 * (0.12 * 1.12^5) / (1.12^5 - 1) = 27740.973
      expect(schedule[0].payment).toBeCloseTo(27740.97, 2);
      expect(schedule[0].interestPayment).toBeCloseTo(12000.0, 2);
      expect(schedule[0].principalPayment).toBeCloseTo(15740.97, 2);
      expect(schedule[4].endingBalance).toBeCloseTo(0, 2);
    });

    it("maneja períodos de gracia (solo interés)", () => {
      const grace = 2;
      const schedule = calculateFrenchAmortization(principal, rateDecimal, term, grace);
      expect(schedule).toHaveLength(5);
      // Periodo 1 y 2: solo interés
      expect(schedule[0].principalPayment).toBe(0);
      expect(schedule[0].payment).toBeCloseTo(12000, 2);
      expect(schedule[1].principalPayment).toBe(0);
      expect(schedule[1].payment).toBeCloseTo(12000, 2);
      // Periodos 3..5: cuota fija sobre saldo amortizado en 3 periodos
      // Cuota = 100000 * (0.12 * 1.12^3) / (1.12^3 - 1) = 41634.90
      expect(schedule[2].payment).toBeCloseTo(41634.9, 1);
      expect(schedule[4].endingBalance).toBeCloseTo(0, 2);
    });
  });

  describe("Sistema Alemán (Amortización Constante de Capital)", () => {
    it("amortiza capital constante de 20,000 por período", () => {
      const schedule = calculateGermanAmortization(principal, rateDecimal, term);
      expect(schedule).toHaveLength(5);
      expect(schedule[0].principalPayment).toBeCloseTo(20000, 2);
      expect(schedule[0].interestPayment).toBeCloseTo(12000, 2);
      expect(schedule[0].payment).toBeCloseTo(32000, 2);

      // Periodo 2: Saldo 80000, interés 9600, cuota 29600
      expect(schedule[1].principalPayment).toBeCloseTo(20000, 2);
      expect(schedule[1].interestPayment).toBeCloseTo(9600, 2);
      expect(schedule[1].payment).toBeCloseTo(29600, 2);

      expect(schedule[4].endingBalance).toBeCloseTo(0, 2);
    });
  });

  describe("Sistema Americano (Bullet)", () => {
    it("paga solo intereses hasta el vencimiento donde cancela todo el capital", () => {
      const schedule = calculateAmericanAmortization(principal, rateDecimal, term);
      expect(schedule).toHaveLength(5);
      for (let i = 0; i < 4; i++) {
        expect(schedule[i].interestPayment).toBeCloseTo(12000, 2);
        expect(schedule[i].principalPayment).toBe(0);
        expect(schedule[i].payment).toBeCloseTo(12000, 2);
        expect(schedule[i].endingBalance).toBe(principal);
      }
      expect(schedule[4].principalPayment).toBe(principal);
      expect(schedule[4].payment).toBeCloseTo(112000, 2);
      expect(schedule[4].endingBalance).toBe(0);
    });
  });

  describe("generateAmortizationTable resumen", () => {
    it("calcula resumen de pagos e intereses acumulados", () => {
      const summary = generateAmortizationTable({
        principal,
        annualRate: ratePercent,
        termPeriods: term,
        paymentType: "french",
      });
      expect(summary.principal).toBe(principal);
      expect(summary.totalPayments).toBeCloseTo(138704.85, 1);
      expect(summary.totalInterest).toBeCloseTo(38704.85, 1);
    });
  });
});
