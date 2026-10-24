# EconoLab — Audit, Financial Engine Unification & Precision Workbench Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify all financial mathematics into tested pure engines, eliminate projected/actual cash-flow contamination and dead code, connect orphaned high-value capabilities (multi-period CAPEX discounting, asset/loan/group editing, PUC catalog, project snapshots, WACC/TMAR discount rate selector), and redesign the Landing Page and Dashboard into a unified **Precision Financial Workbench** (`Framed Sheet` workspace with full ES/EN i18n).

**Architecture:** Pure domain calculations live exclusively in `lib/engines/*` (accepting decimal rates via `percentToDecimal` at the service boundary); Supabase I/O and cross-entity orchestration live in `lib/services/*`; and Next.js App Router pages compose a two-level Dashboard (`Portfolio Overview` + `Project Workspace` at `/dashboard/projects/[id]/**`) styled with a strict `1px` framed-sheet hierarchy and `tabular-nums` financial typography.

**Tech Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Vitest · Supabase (Auth + Postgres + RLS) · next-intl (`es` / `en`) · Tailwind CSS v4 · shadcn/ui · Recharts · Zod.

**Spec:** [`docs/superpowers/specs/2026-10-24-econolab-audit-and-redesign-design.md`](../specs/2026-10-24-econolab-audit-and-redesign-design.md)

## Global Constraints

- `lib/engines/*` must remain 100% pure: no Supabase imports, no `Date.now()`, no React hooks.
- Database and UI store rates as percentages (`12` = 12%); engines receive decimals (`0.12`) converted via `percentToDecimal` / `decimalToPercent` (`lib/utils/tmar.ts`).
- `cash_flows` queries for valuation, pro-forma, scenarios, and editing must explicitly filter `.eq("flow_type", "projected")` unless actual flows are requested.
- Every user-visible string added or modified must exist in both `messages/es.json` and `messages/en.json`.
- No `any` types and no `console.log` statements in committed code.
- Every task must keep `pnpm exec tsc --noEmit` and `pnpm test` (`vitest run`) green.

## Review Focus

1. **Operating loss in unlevered FCFF ($\text{EBIT}_t < 0$):** When a period has negative `EBIT`, unlevered tax must be `0` (not negative tax credit), so `NOPAT === EBIT` and `FCFF` is not artificially inflated. (Tested in Task 1).
2. **Project with `actual` cash flows recorded in `/control`:** Calling `fetchCashFlows(projectId)` without arguments must return only `flow_type = 'projected'` rows, preventing duplicate periods in Pro-Forma, Scenarios, and Project Edit. (Tested in Task 2).
3. **High IRR ($> 100\%$) and non-convergent cash flows in form & portfolio analytics:** Replacing bisection `[-0.5, 1.0]` with `calculateIRR` from `financial-engine.ts` must accurately compute IRRs above `1.0` (`100%`) and return `{ irr: 0, converged: false }` when all flows have the same sign. (Tested in Task 3).
4. **Discount rate source set to `'wacc'` when project has zero loans and zero equity:** `resolveProjectDiscountRatePercent` must gracefully fall back to `project.discount_rate` instead of returning `0%` or `NaN`. (Tested in Task 4).
5. **Mutually exclusive alternatives with unequal lifespans (`periods` $3$ vs $5$):** `analyzeProjectGroup` must flag `hasUnequalLifespans: true` and select `recommendedProjectId` by highest `baue` (`calculateEquivalentAnnualWorth`) rather than raw `npv` padded with zeros. (Tested in Task 5).

---

## File Structure Map

- **Phase 1 — Core Financial Engines, Data Integrity & Dead Code Removal (Tasks 1–5):**
  - Modify: `lib/engines/financial-engine.ts`, `lib/engines/financial-engine.test.ts`
  - Modify: `lib/engines/depreciation-engine.ts`, `lib/engines/depreciation-engine.test.ts`
  - Modify: `lib/routes.ts`
  - Modify: `lib/services/projects.ts`, `lib/services/disbursements.ts`, `lib/services/pro-forma.ts`, `lib/services/scenarios.ts`, `lib/services/actual-flows.ts`, `lib/services/loans.ts`
  - Modify: `lib/hooks/useProjectForm.ts`, `lib/services/project-analytics.ts`, `lib/services/portfolio-analytics.ts`
  - Modify: `lib/services/alternatives-analysis.ts`
  - Create: `supabase/migrations/20261024140000_discount_rate_source_and_cleanup.sql`
  - Create: `lib/services/discount-rate.ts`, `lib/services/discount-rate.test.ts`
  - Update: `docs/domain/BUSINESS-LOGIC.md`
- **Phase 2 — Information Architecture & Unified Project Workspace (Tasks 6–7):**
  - Create: `components/dashboard/project-workspace-header.tsx`
  - Create: `components/dashboard/project-workspace-tabs.tsx`
  - Create: `app/dashboard/projects/[id]/layout.tsx`
  - Create: `app/dashboard/projects/[id]/page.tsx`
  - Modify: `components/dashboard/app-sidebar.tsx`, `lib/utils/get-breadcrumbs.ts`, `app/dashboard/projects/page.tsx`
- **Phase 3 — Visual Redesign ("Precision Financial Workbench") & 100% i18n (Tasks 8–10):**
  - Create: `components/landing/interactive-model-preview.tsx`
  - Create: `components/landing/lifecycle-showcase-section.tsx`
  - Modify: `app/page.tsx`, `components/landing/hero-section.tsx`, `components/landing/features-section.tsx`, `components/landing/indicators-section.tsx`, `components/landing/how-it-works-section.tsx`, `components/landing/cta-section.tsx`
  - Modify: `app/globals.css`, `app/dashboard/layout.tsx`, `app/dashboard/page.tsx`
  - Modify: `app/dashboard/projects/[id]/investment/page.tsx`, `control/page.tsx`, `scenarios/page.tsx`, `financing/page.tsx`, `assets/page.tsx`, `pro-forma/page.tsx`, `app/dashboard/alternatives/page.tsx`, `app/dashboard/alternatives/[groupId]/page.tsx`
  - Modify: `messages/es.json`, `messages/en.json`
- **Phase 4 — High-Value Orphaned Features Connection (Tasks 11–12):**
  - Create: `lib/services/chart-of-accounts.ts`, `components/dashboard/puc-account-select.tsx`
  - Modify: `app/dashboard/projects/[id]/assets/page.tsx`, `app/dashboard/projects/[id]/financing/page.tsx`, `app/dashboard/alternatives/page.tsx`
  - Create: `lib/services/snapshots.ts`, `lib/services/snapshots.test.ts`, `components/dashboard/project-snapshots-panel.tsx`
  - Modify: `app/dashboard/projects/[id]/control/page.tsx`

---

### Task 1: Unlevered FCFF, Salvage Value Recovery, Dual Payback & Dead Engine Cleanup

**Files:**
- Modify: `lib/engines/financial-engine.ts`
- Modify: `lib/engines/financial-engine.test.ts`
- Modify: `lib/engines/depreciation-engine.ts`
- Modify: `lib/engines/depreciation-engine.test.ts`
- Modify: `lib/routes.ts`

**Interfaces:**
- Consumes: existing `CashFlowItem`, `IncomeStatementRow`, `FreeCashFlowInput` in `lib/engines/financial-engine.ts`
- Produces:
  - `calculateSimplePayback(initialInvestment: number, cashFlows: CashFlowItem[]): number | null` in `lib/engines/financial-engine.ts`
  - Updated `FreeCashFlowRow` adding `nopat: number` and `salvageValue: number` in `lib/engines/financial-engine.ts`
  - Updated `FreeCashFlowInput` adding `taxRateDecimal?: number` and `salvageSchedule?: Record<number, number>` in `lib/engines/financial-engine.ts`
  - Updated `FinancialResults` adding `simplePayback: number | null` in `lib/engines/financial-engine.ts`
  - Removal of `generateAssetDepreciationSummary` and `'units_of_production'` from `lib/engines/depreciation-engine.ts` and `routes.recurring*` from `lib/routes.ts`

- [ ] **Step 1: Write the failing tests in `lib/engines/financial-engine.test.ts`**

```typescript
import { describe, expect, it } from "vitest"
import {
  calculateSimplePayback,
  calculateAllIndicators,
  generateIncomeStatement,
  generateFreeCashFlowStatement,
} from "./financial-engine"

describe("calculateSimplePayback", () => {
  it("computes undiscounted fractional payback period", () => {
    const flows = [
      { period: 1, inflow: 600, outflow: 0, net: 600 },
      { period: 2, inflow: 600, outflow: 0, net: 600 },
    ]
    expect(calculateSimplePayback(900, flows)).toBeCloseTo(1.5, 6)
  })

  it("returns null when undiscounted flows never recover initial investment", () => {
    const flows = [{ period: 1, inflow: 200, outflow: 0, net: 200 }]
    expect(calculateSimplePayback(900, flows)).toBeNull()
  })
})

describe("generateFreeCashFlowStatement — unlevered FCFF & salvage value", () => {
  it("computes unlevered FCFF = EBIT(1-T) + Dep - CAPEX - dWK + Salvage and reconciles with FCFE", () => {
    const income = generateIncomeStatement({
      periods: 1,
      revenueSchedule: { 1: 1000 },
      operatingCostsSchedule: { 1: 400 },
      depreciationSchedule: { 1: 100 },
      interestSchedule: { 1: 50 },
      taxRateDecimal: 0.3,
    })
    const fcf = generateFreeCashFlowStatement({
      incomeStatement: income,
      capexSchedule: { 1: 0 },
      workingCapitalChanges: { 1: 0 },
      principalPaymentsSchedule: { 1: 80 },
      newDebtSchedule: { 1: 0 },
      salvageSchedule: { 1: 40 },
      taxRateDecimal: 0.3,
    })
    expect(fcf[0].nopat).toBeCloseTo(350, 6)
    expect(fcf[0].fcff).toBeCloseTo(490, 6)
    expect(fcf[0].fcfe).toBeCloseTo(375, 6)
  })

  it("Review Focus #1: does not create negative unlevered tax credit when EBIT < 0", () => {
    const income = generateIncomeStatement({
      periods: 1,
      revenueSchedule: { 1: 200 },
      operatingCostsSchedule: { 1: 400 },
      depreciationSchedule: { 1: 100 },
      interestSchedule: { 1: 50 },
      taxRateDecimal: 0.3,
    })
    const fcf = generateFreeCashFlowStatement({
      incomeStatement: income,
      capexSchedule: { 1: 0 },
      workingCapitalChanges: { 1: 0 },
      principalPaymentsSchedule: { 1: 0 },
      newDebtSchedule: { 1: 0 },
      salvageSchedule: { 1: 0 },
      taxRateDecimal: 0.3,
    })
    // EBIT = -300 -> unlevered tax = 0 -> NOPAT = -300 -> FCFF = -300 + 100 = -200
    expect(fcf[0].nopat).toBeCloseTo(-300, 6)
    expect(fcf[0].fcff).toBeCloseTo(-200, 6)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/engines/financial-engine.test.ts`
Expected: FAIL with `calculateSimplePayback is not a function` and `fcf[0].fcff` returning `415` instead of `490`.

- [ ] **Step 3: Implement `calculateSimplePayback`, unlevered `generateFreeCashFlowStatement`, and dead code cleanup**

In `lib/engines/financial-engine.ts`:
- Add `calculateSimplePayback(initialInvestment: number, cashFlows: CashFlowItem[]): number | null` using undiscounted `cf.net ?? (cf.inflow - cf.outflow)` sorted by `period`.
- Include `simplePayback` in `FinancialResults` and `calculateAllIndicators`.
- In `generateFreeCashFlowStatement(input: FreeCashFlowInput)`: compute `unleveredTax = income.ebit > 0 ? income.ebit * (input.taxRateDecimal ?? 0) : 0`, `nopat = income.ebit - unleveredTax`, `salvageValue = input.salvageSchedule?.[p] ?? 0`, `fcff = nopat + income.depreciation - capex - deltaWk + salvageValue`, and `fcfe = income.netIncome + income.depreciation - capex - deltaWk + salvageValue - principalPaid + newDebt`.
- In `lib/engines/depreciation-engine.ts`: remove unused `generateAssetDepreciationSummary` and remove `'units_of_production'` from `DepreciationMethod`.
- In `lib/routes.ts`: remove `recurring`, `recurringNew`, and `recurringEdit`.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `pnpm exec vitest run lib/engines/financial-engine.test.ts lib/engines/depreciation-engine.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/engines/financial-engine.ts lib/engines/financial-engine.test.ts lib/engines/depreciation-engine.ts lib/engines/depreciation-engine.test.ts lib/routes.ts
git commit -m "fix(engines): compute unlevered FCFF with salvage value, add simple payback, and remove dead code"
```

---

### Task 2: Fix `fetchCashFlows` Projected/Actual Contamination & Wire Salvage Value into Pro-Forma

**Files:**
- Modify: `lib/services/projects.ts`
- Modify: `lib/services/pro-forma.ts`
- Modify: `lib/services/disbursements.ts`
- Create: `lib/services/projects.test.ts`

**Interfaces:**
- Consumes: `FreeCashFlowInput` from Task 1 (`salvageSchedule`, `taxRateDecimal`)
- Produces:
  - `fetchCashFlows(projectId: string, flowType: 'projected' | 'actual' = 'projected'): Promise<CashFlowRow[]>` in `lib/services/projects.ts`
  - Removal of unused `calculateTotalActualInvestment` in `lib/services/disbursements.ts`

- [ ] **Step 1: Write the failing test in `lib/services/projects.test.ts`**

```typescript
import { describe, expect, it, vi } from "vitest"

const eqMock = vi.fn().mockReturnThis()
const orderMock = vi.fn().mockResolvedValue({
  data: [{ id: "1", project_id: "p1", period: 1, inflow: 500, outflow: 200, net_flow: 300, flow_type: "projected" }],
  error: null,
})

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseClient: () => ({
    from: () => ({
      select: () => ({
        eq: eqMock,
        order: orderMock,
      }),
    }),
  }),
}))

import { fetchCashFlows } from "./projects"

describe("fetchCashFlows — Review Focus #2", () => {
  it("filters by flow_type = 'projected' by default so actual flows never contaminate valuation", async () => {
    eqMock.mockClear()
    await fetchCashFlows("proj-123")
    expect(eqMock).toHaveBeenCalledWith("project_id", "proj-123")
    expect(eqMock).toHaveBeenCalledWith("flow_type", "projected")
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/services/projects.test.ts`
Expected: FAIL because `fetchCashFlows` only calls `.eq("project_id", projectId)` without `.eq("flow_type", "projected")`.

- [ ] **Step 3: Implement `flow_type` filter in `fetchCashFlows`, salvage schedule in `pro-forma.ts`, and remove `calculateTotalActualInvestment`**

- In `lib/services/projects.ts:62-72`: update signature to `export async function fetchCashFlows(projectId: string, flowType: "projected" | "actual" = "projected"): Promise<CashFlowRow[]>` and chain `.eq("project_id", projectId).eq("flow_type", flowType)`.
- In `lib/services/pro-forma.ts:86-135`: build `salvageSchedule: Record<number, number> = { [periods]: assets.reduce((sum, a) => sum + Number(a.salvage_value ?? 0), 0) }` and pass `salvageSchedule` and `taxRateDecimal` into `generateFreeCashFlowStatement`.
- In `lib/services/disbursements.ts:183-190`: delete unused `calculateTotalActualInvestment`.

- [ ] **Step 4: Run test and typecheck to verify they pass**

Run: `pnpm exec vitest run lib/services/projects.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/services/projects.ts lib/services/projects.test.ts lib/services/pro-forma.ts lib/services/disbursements.ts
git commit -m "fix(services): filter projected cash flows by default and include asset salvage value in pro-forma"
```

---

### Task 3: Eliminate Duplicated Financial Math & Connect Multi-Period CAPEX Disbursements (`t < 0`, `t > 0`)

**Files:**
- Modify: `lib/hooks/useProjectForm.ts`
- Modify: `lib/services/project-analytics.ts`
- Modify: `lib/services/portfolio-analytics.ts`
- Create: `lib/services/project-analytics.test.ts`

**Interfaces:**
- Consumes: `calculateAllIndicators`, `calculateNPVWithDisbursements`, `calculateIRRWithDisbursements`, `calculateSimplePayback`, `calculateIRR` from `lib/engines/financial-engine.ts`
- Produces:
  - `calculateProjectMetricsWithDisbursements(project: ProjectRow, flows: CashFlowRow[], disbursements?: InvestmentDisbursement[], effectiveRatePercent?: number)` in `lib/services/project-analytics.ts`
  - Unified `ResultsPreview` in `lib/hooks/useProjectForm.ts` including `simplePayback: number | null` and `irrConverged: boolean`

- [ ] **Step 1: Write the failing test in `lib/services/project-analytics.test.ts`**

```typescript
import { describe, expect, it } from "vitest"
import { calculateProjectMetrics } from "./project-analytics"

describe("calculateProjectMetrics — Review Focus #3 & Multi-period Disbursements", () => {
  const baseProject = {
    id: "p1",
    user_id: "u1",
    name: "High IRR Project",
    description: null,
    currency: "USD",
    initial_investment: 1000,
    discount_rate: 10,
    periods: 2,
    inflation_rate: null,
    risk_premium: null,
    tmar_calculated: null,
    use_tmar_as_discount_rate: false,
    phase: "preinversion",
    lifecycle_status: "active",
    tax_rate: 30,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  }

  it("correctly computes IRR > 100% (where legacy bisection [-0.5, 1.0] capped out at 100%)", () => {
    const flows = [
      { id: "f1", project_id: "p1", period: 1, inflow: 2500, outflow: 0, net_flow: 2500, notes: null, created_at: "" },
    ]
    const metrics = calculateProjectMetrics(baseProject, flows)
    // -1000 + 2500 / (1 + IRR) = 0 -> IRR = 1.5 (150%)
    expect(metrics.irrPercent).toBeCloseTo(150, 2)
    expect(metrics.irrConverged).toBe(true)
  })

  it("discounts staged CAPEX disbursements at t = -1 and t = 0 via calculateNPVWithDisbursements", () => {
    const flows = [
      { id: "f1", project_id: "p1", period: 1, inflow: 1500, outflow: 0, net_flow: 1500, notes: null, created_at: "" },
    ]
    const disbursements = [
      { period: -1, amount: 500 },
      { period: 0, amount: 500 },
    ]
    const metrics = calculateProjectMetrics(baseProject, flows, undefined, disbursements)
    // At r = 10%: -500*(1.1)^1 - 500 + 1500/1.1 = -550 - 500 + 1363.6363 = 313.6363
    expect(metrics.npv).toBeCloseTo(313.64, 1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/services/project-analytics.test.ts`
Expected: FAIL because `calculateProjectMetrics` does not accept `disbursements` or call `calculateNPVWithDisbursements`.

- [ ] **Step 3: Refactor `project-analytics.ts`, `portfolio-analytics.ts`, and `useProjectForm.ts` to delegate exclusively to `lib/engines/financial-engine.ts`**

- In `lib/services/project-analytics.ts`:
  - Update `calculateProjectMetrics(project, flows, overrideDiscountRatePercent?, disbursements?: Array<{ period: number; amount: number }>)` so that when `disbursements` has entries with `period !== 0`, it computes `npv` via `calculateNPVWithDisbursements(rateDecimal, disbursements, engineFlows)` and `irr` via `calculateIRRWithDisbursements(disbursements, engineFlows)`.
  - Expose `simplePayback: calculateSimplePayback(initialInvestment, engineFlows)` alongside discounted `payback: results.payback`.
  - Remove the fake `projectedNpv: Number((runningTotal * 1.08).toFixed(2))` in `buildCashFlowSeries` (`lib/services/project-analytics.ts:325`); replace with discounted cumulative NPV at each period (`cumulativeDiscountedNpv`).
  - Replace manual `estimatePaybackPeriod` (`lib/services/project-analytics.ts:443`) with `calculateSimplePayback` / `calculatePayback` from `lib/engines/financial-engine.ts`.
- In `lib/services/portfolio-analytics.ts:78-110`: delete `calculateIrrFromConsolidatedSeries` bisection and call `calculateIRR` from `lib/engines/financial-engine.ts`.
- In `lib/hooks/useProjectForm.ts:187-286`: delete the 100-line manual loop (`npv`, bisection `irr`, `bcRatio`, `payback`, `profitabilityIndex`) and call `calculateAllIndicators` from `lib/engines/financial-engine.ts` with `percentToDecimal(ratePercent)`.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `pnpm exec vitest run lib/services/project-analytics.test.ts lib/engines/financial-engine.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/services/project-analytics.ts lib/services/project-analytics.test.ts lib/services/portfolio-analytics.ts lib/hooks/useProjectForm.ts
git commit -m "refactor(analytics): unify financial calculations in financial-engine and wire multi-period CAPEX disbursements"
```

---

### Task 4: Centralize Discount Rate Resolution (`Manual | TMAR | WACC`) Across All Services

**Files:**
- Create: `supabase/migrations/20261024140000_discount_rate_source_and_cleanup.sql`
- Create: `lib/services/discount-rate.ts`
- Create: `lib/services/discount-rate.test.ts`
- Modify: `lib/types/project.ts`
- Modify: `lib/services/project-analytics.ts`
- Modify: `lib/services/pro-forma.ts`
- Modify: `lib/services/scenarios.ts`
- Modify: `lib/services/actual-flows.ts`
- Modify: `lib/services/loans.ts`

**Interfaces:**
- Consumes: `calculateEffectiveTMAR` (`lib/utils/tmar.ts`), `calculateWACC` (`lib/engines/wacc-engine.ts`)
- Produces:
  - `DiscountRateSource = 'manual' | 'tmar' | 'wacc'` in `lib/types/project.ts`
  - `resolveProjectDiscountRatePercent(project: Pick<ProjectRow, 'discount_rate' | 'tmar_calculated' | 'inflation_rate' | 'risk_premium' | 'use_tmar_as_discount_rate'> & { discount_rate_source?: DiscountRateSource | null }, waccPercent?: number | null): { ratePercent: number; source: DiscountRateSource }` in `lib/services/discount-rate.ts`

- [ ] **Step 1: Write the failing test in `lib/services/discount-rate.test.ts`**

```typescript
import { describe, expect, it } from "vitest"
import { resolveProjectDiscountRatePercent } from "./discount-rate"

describe("resolveProjectDiscountRatePercent", () => {
  const baseProject = {
    discount_rate: 12,
    tmar_calculated: 16.5,
    inflation_rate: 5,
    risk_premium: 10.95,
    use_tmar_as_discount_rate: false,
    discount_rate_source: "manual" as const,
  }

  it("returns manual discount_rate when source is 'manual'", () => {
    expect(resolveProjectDiscountRatePercent(baseProject)).toEqual({ ratePercent: 12, source: "manual" })
  })

  it("returns TMAR when source is 'tmar' or legacy use_tmar_as_discount_rate is true", () => {
    expect(resolveProjectDiscountRatePercent({ ...baseProject, discount_rate_source: "tmar" })).toEqual({
      ratePercent: 16.5,
      source: "tmar",
    })
  })

  it("returns WACC when source is 'wacc' and waccPercent > 0", () => {
    expect(resolveProjectDiscountRatePercent({ ...baseProject, discount_rate_source: "wacc" }, 11.25)).toEqual({
      ratePercent: 11.25,
      source: "wacc",
    })
  })

  it("Review Focus #4: falls back to manual discount_rate when source is 'wacc' but waccPercent is 0 or null", () => {
    expect(resolveProjectDiscountRatePercent({ ...baseProject, discount_rate_source: "wacc" }, 0)).toEqual({
      ratePercent: 12,
      source: "manual",
    })
    expect(resolveProjectDiscountRatePercent({ ...baseProject, discount_rate_source: "wacc" }, null)).toEqual({
      ratePercent: 12,
      source: "manual",
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/services/discount-rate.test.ts`
Expected: FAIL with `Cannot find module './discount-rate'`.

- [ ] **Step 3: Create migration, implement `lib/services/discount-rate.ts`, and wire into `pro-forma.ts`, `scenarios.ts`, `actual-flows.ts`, `loans.ts`, and `project-analytics.ts`**

- Create `supabase/migrations/20261024140000_discount_rate_source_and_cleanup.sql`:
  ```sql
  ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS discount_rate_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (discount_rate_source IN ('manual', 'tmar', 'wacc'));

  UPDATE public.projects
  SET discount_rate_source = 'tmar'
  WHERE use_tmar_as_discount_rate = true AND discount_rate_source = 'manual';
  ```
- Implement `resolveProjectDiscountRatePercent` in `lib/services/discount-rate.ts`.
- Replace direct `Number(project.discount_rate ?? 0)` reads in `lib/services/pro-forma.ts:55`, `lib/services/scenarios.ts:69`, `lib/services/actual-flows.ts:237`, and `lib/services/loans.ts:244` with `resolveProjectDiscountRatePercent`.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `pnpm exec vitest run lib/services/discount-rate.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20261024140000_discount_rate_source_and_cleanup.sql lib/types/project.ts lib/services/discount-rate.ts lib/services/discount-rate.test.ts lib/services/project-analytics.ts lib/services/pro-forma.ts lib/services/scenarios.ts lib/services/actual-flows.ts lib/services/loans.ts
git commit -m "feat(discount-rate): centralize Manual/TMAR/WACC discount rate resolution across all services"
```

---

### Task 5: Equal vs. Unequal Lifespan Handling (`BAUE`) in Mutually Exclusive Alternatives & Domain Docs Update

**Files:**
- Modify: `lib/services/alternatives-analysis.ts`
- Create: `lib/services/alternatives-analysis.test.ts`
- Modify: `docs/domain/BUSINESS-LOGIC.md`

**Interfaces:**
- Consumes: `calculateEquivalentAnnualWorth` from `lib/engines/financial-engine.ts`
- Produces:
  - Updated `AlternativeProjectMetrics` adding `baue: number` in `lib/services/alternatives-analysis.ts`
  - Updated `GroupComparisonResult` adding `hasUnequalLifespans: boolean` and `selectionCriterion: 'npv_incremental' | 'baue'` in `lib/services/alternatives-analysis.ts`

- [ ] **Step 1: Write the failing test in `lib/services/alternatives-analysis.test.ts`**

```typescript
import { describe, expect, it } from "vitest"
import { rankAndSelectAlternatives } from "./alternatives-analysis"

describe("rankAndSelectAlternatives — Review Focus #5 (Unequal Lifespans)", () => {
  it("selects winner by BAUE instead of raw NPV when alternatives have unequal periods", () => {
    // Project A: 3 years, I0 = 1000, NPV = 300 at r = 10% -> BAUE = 300 * 0.1 / (1 - 1.1^-3) = 120.63
    // Project B: 6 years, I0 = 1000, NPV = 400 at r = 10% -> BAUE = 400 * 0.1 / (1 - 1.1^-6) = 91.84
    // Raw NPV would pick B (400 > 300), but per year of useful life A creates more value (BAUE 120.63 > 91.84)
    const result = rankAndSelectAlternatives(
      [
        {
          project: { id: "A", name: "Short Life", initialInvestment: 1000, periods: 3, currency: "USD" },
          flows: [
            { period: 1, inflow: 523.1, outflow: 0, net: 523.1 },
            { period: 2, inflow: 523.1, outflow: 0, net: 523.1 },
            { period: 3, inflow: 523.1, outflow: 0, net: 523.1 },
          ],
        },
        {
          project: { id: "B", name: "Long Life", initialInvestment: 1000, periods: 6, currency: "USD" },
          flows: [
            { period: 1, inflow: 321.4, outflow: 0, net: 321.4 },
            { period: 2, inflow: 321.4, outflow: 0, net: 321.4 },
            { period: 3, inflow: 321.4, outflow: 0, net: 321.4 },
            { period: 4, inflow: 321.4, outflow: 0, net: 321.4 },
            { period: 5, inflow: 321.4, outflow: 0, net: 321.4 },
            { period: 6, inflow: 321.4, outflow: 0, net: 321.4 },
          ],
        },
      ],
      10
    )

    expect(result.hasUnequalLifespans).toBe(true)
    expect(result.selectionCriterion).toBe("baue")
    expect(result.recommendedProjectId).toBe("A")
    expect(result.projects.find((p) => p.projectId === "A")!.baue).toBeGreaterThan(
      result.projects.find((p) => p.projectId === "B")!.baue
    )
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/services/alternatives-analysis.test.ts`
Expected: FAIL with `rankAndSelectAlternatives is not a function`.

- [ ] **Step 3: Extract pure `rankAndSelectAlternatives` helper in `lib/services/alternatives-analysis.ts` and update `docs/domain/BUSINESS-LOGIC.md`**

- In `lib/services/alternatives-analysis.ts`:
  - Compute `baue = calculateEquivalentAnnualWorth(results.npv, commonRateDecimal, p.periods)` for every project.
  - Detect `hasUnequalLifespans = new Set(projects.map(p => p.periods)).size > 1`.
  - When `hasUnequalLifespans` is `true`, set `selectionCriterion = 'baue'` and pick the project with highest `baue > 0` as `recommendedProjectId`. When `false`, preserve incremental $\Delta\text{VPN} > 0$ pairwise selection (`selectionCriterion = 'npv_incremental'`).
- Update `docs/domain/BUSINESS-LOGIC.md` documenting unlevered `FCFF` with salvage value, `simplePayback` vs `discountedPayback`, `DiscountRateSource` (`manual | tmar | wacc`), and `BAUE` selection for unequal lifespans.

- [ ] **Step 4: Run tests and typecheck to verify they pass**

Run: `pnpm exec vitest run lib/services/alternatives-analysis.test.ts && pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/services/alternatives-analysis.ts lib/services/alternatives-analysis.test.ts docs/domain/BUSINESS-LOGIC.md
git commit -m "feat(alternatives): use BAUE criterion when comparing projects with unequal lifespans"
```

---

### Task 6: Unified Project Workspace (`/dashboard/projects/[id]`) & Lifecycle Header

**Files:**
- Create: `components/dashboard/project-workspace-header.tsx`
- Create: `components/dashboard/project-workspace-tabs.tsx`
- Create: `app/dashboard/projects/[id]/layout.tsx`
- Create: `app/dashboard/projects/[id]/page.tsx`
- Modify: `lib/services/projects.ts`

**Interfaces:**
- Consumes: `resolveProjectDiscountRatePercent` (Task 4), `calculateProjectMetrics` (Task 3)
- Produces:
  - `updateProjectLifecycleAndRate(projectId: string, payload: { phase?: ProjectPhase; lifecycle_status?: ProjectLifecycleStatus; discount_rate_source?: DiscountRateSource })` in `lib/services/projects.ts`
  - Unified layout `app/dashboard/projects/[id]/layout.tsx` wrapping `/dashboard/projects/[id]` and all its subroutes (`investment`, `assets`, `financing`, `pro-forma`, `scenarios`, `control`, `edit`) with `ProjectWorkspaceHeader` and `ProjectWorkspaceTabs`
  - Executive project overview page at `app/dashboard/projects/[id]/page.tsx`

- [ ] **Step 1: Implement `updateProjectLifecycleAndRate` in `lib/services/projects.ts`**

Add Zod-validated mutation `updateProjectLifecycleAndRate` updating `phase` (`'preinversion' | 'inversion' | 'operacion' | 'liquidacion'`), `lifecycle_status` (`'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'`), and `discount_rate_source` (`'manual' | 'tmar' | 'wacc'`) on `public.projects`.

- [ ] **Step 2: Create `ProjectWorkspaceHeader` and `ProjectWorkspaceTabs`**

- `components/dashboard/project-workspace-header.tsx`: Renders project name, currency badge, interactive selectors for `phase`, `lifecycle_status`, and `discount_rate_source` (`Manual | TMAR | WACC`), and a compact 4-metric strip (`VPN`, `TIR`, `BAUE`, `Tasa Efectiva`) with `tabular-nums`.
- `components/dashboard/project-workspace-tabs.tsx`: Renders horizontal lifecycle navigation tabs linking to:
  1. `/dashboard/projects/[id]` (*Resumen & KPIs*)
  2. `/dashboard/projects/[id]/investment` (*Flujos & CAPEX*)
  3. `/dashboard/projects/[id]/assets` (*Activos & Depreciación*)
  4. `/dashboard/projects/[id]/financing` (*Financiamiento & WACC*)
  5. `/dashboard/projects/[id]/pro-forma` (*Estados Pro-Forma*)
  6. `/dashboard/projects/[id]/scenarios` (*Escenarios & Sensibilidad*)
  7. `/dashboard/projects/[id]/control` (*Control Ex-Post & Snapshots*)
  8. `/dashboard/projects/[id]/edit` (*Configuración Base*)

- [ ] **Step 3: Create `app/dashboard/projects/[id]/layout.tsx` and `app/dashboard/projects/[id]/page.tsx`**

- `app/dashboard/projects/[id]/layout.tsx`: Loads the project header context once and renders `ProjectWorkspaceHeader` + `ProjectWorkspaceTabs` above `{children}`, removing redundant back buttons from subpages.
- `app/dashboard/projects/[id]/page.tsx`: Renders the Project Executive Summary (NPV/IRR/Payback Simple & Descontado/IR/B-C cards, cumulative cash flow & discounted NPV chart, CAPEX execution progress summary, and quick links to each lifecycle stage).

- [ ] **Step 4: Run typecheck to verify compilation**

Run: `pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 5: Commit**

```bash
git add lib/services/projects.ts components/dashboard/project-workspace-header.tsx components/dashboard/project-workspace-tabs.tsx app/dashboard/projects/[id]/layout.tsx app/dashboard/projects/[id]/page.tsx
git commit -m "feat(workspace): create unified Project Workspace at /dashboard/projects/[id] with lifecycle tabs and header"
```

---

### Task 7: Two-Level Sidebar Navigation, Pedagogical Lab Group & Projects List Deduplication

**Files:**
- Modify: `components/dashboard/app-sidebar.tsx`
- Modify: `lib/utils/get-breadcrumbs.ts`
- Modify: `app/dashboard/projects/page.tsx`

**Interfaces:**
- Consumes: `/dashboard/projects/[id]` workspace routes from Task 6
- Produces:
  - Reorganized `AppSidebar` (`components/dashboard/app-sidebar.tsx`) with 1) *Portafolio* (`Resumen`, `Proyectos`, `Alternativas Excluyentes`, `Reportes`), 2) contextual *Proyecto Activo* submenu when URL matches `/dashboard/projects/[id]/**`, and 3) collapsible *Laboratorio Pedagógico* (`VPN`, `TIR`, `TMAR` re-enabled, `Costo-Beneficio`, `Flujo de Caja`)
  - Deduplicated `/dashboard/projects/page.tsx` with a view toggle (`Tabla` | `Tarjetas`) and row click / `"Ver"` action linked to `/dashboard/projects/[id]`

- [ ] **Step 1: Update `components/dashboard/app-sidebar.tsx` and `lib/utils/get-breadcrumbs.ts`**

- Uncomment and include `/dashboard/tmar` inside the collapsible *Laboratorio Pedagógico* section in `components/dashboard/app-sidebar.tsx`.
- Detect active project ID from `usePathname()` (`/dashboard/projects/([^/]+)`) and display a contextual quick-jump section for the active project's lifecycle tabs.
- Update `lib/utils/get-breadcrumbs.ts` to resolve `/dashboard/projects/[id]` and its 7 lifecycle sub-routes cleanly in ES and EN.

- [ ] **Step 2: Deduplicate `app/dashboard/projects/page.tsx` and wire the "View" link**

- Add a segmented toggle `viewMode: 'table' | 'grid'` (default `'table'`) so `/dashboard/projects` renders either the high-density financial table OR the card grid—never both stacked on the same page.
- Make clicking a project name or the `"Ver"` (`Eye`) action navigate directly to `/dashboard/projects/${project.id}`.

- [ ] **Step 3: Run typecheck to verify compilation**

Run: `pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/app-sidebar.tsx lib/utils/get-breadcrumbs.ts app/dashboard/projects/page.tsx
git commit -m "feat(navigation): reorganize sidebar with Pedagogical Lab and deduplicate projects view"
```

---

### Task 8: Landing Page Redesign — "Precision Financial Workbench" & Live Interactive Model

**Files:**
- Create: `components/landing/interactive-model-preview.tsx`
- Create: `components/landing/lifecycle-showcase-section.tsx`
- Modify: `components/landing/hero-section.tsx`
- Modify: `components/landing/features-section.tsx`
- Modify: `components/landing/indicators-section.tsx`
- Modify: `components/landing/how-it-works-section.tsx`
- Modify: `components/landing/cta-section.tsx`
- Modify: `app/page.tsx`

**Interfaces:**
- Consumes: `calculateAllIndicators`, `generateIncomeStatement`, `generateFreeCashFlowStatement` from `lib/engines/financial-engine.ts`
- Produces:
  - `InteractiveModelPreview` client component (`components/landing/interactive-model-preview.tsx`): runs real `financial-engine.ts` calculations in the browser as the visitor drags 3 sliders (*Tasa de Descuento / WACC*: `4%–25%`, *Crecimiento de Ingresos*: `-20% a +40%`, *CAPEX Inicial*: `$50k–$250k`), updating VPN, TIR, Payback Simple/Descontado, BAUE, and a 5-year FCFF bar/line schedule with `tabular-nums`
  - `LifecycleShowcaseSection` (`components/landing/lifecycle-showcase-section.tsx`): interactive tabbed preview showcasing EconoLab's 4 flagship capabilities (1. *Pro-Forma FCFF/FCFE*, 2. *Sensibilidad Tornado & Matriz 2D*, 3. *Estructura de Capital WACC & Amortización*, 4. *Control Ex-Post & Alternativas Incrementales*)

- [ ] **Step 1: Build `components/landing/interactive-model-preview.tsx` using `lib/engines/financial-engine.ts`**

Create `InteractiveModelPreview` with zero fake arrays: wire sliders directly to `calculateAllIndicators` and `generateFreeCashFlowStatement`, styled as a crisp `1px` framed financial terminal with `font-mono tabular-nums` and semantic status pills (`Viable: VPN > 0` vs `Destruye Valor: VPN < 0`).

- [ ] **Step 2: Build `components/landing/lifecycle-showcase-section.tsx` and refactor `hero-section.tsx`, `features-section.tsx`, `indicators-section.tsx`, `how-it-works-section.tsx`, and `cta-section.tsx`**

Apply `design-taste-frontend` rules across all landing sections:
- Remove blurred background blobs (`blur-[120px]`), pulsing pill badge, gradient text (`bg-gradient-to-r ... bg-clip-text`), 6 identical icon-in-tinted-box cards, and `01/02/03` circle badges.
- Use an asymmetric 2-column Hero on desktop (`lg:grid-cols-12`: 5 cols editorial copy + CTAs on the left, 7 cols live `InteractiveModelPreview` workbench on the right) over a subtle `1px` architectural hairline grid.
- Replace generic feature cards with the interactive `LifecycleShowcaseSection` and formula specification ledger.

- [ ] **Step 3: Run typecheck to verify compilation**

Run: `pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx components/landing/hero-section.tsx components/landing/interactive-model-preview.tsx components/landing/lifecycle-showcase-section.tsx components/landing/features-section.tsx components/landing/indicators-section.tsx components/landing/how-it-works-section.tsx components/landing/cta-section.tsx
git commit -m "feat(landing): redesign landing page as Precision Financial Workbench with live interactive financial model"
```

---

### Task 9: Dashboard "Framed Sheet" Shell, Portfolio Overview Redesign & Visual Polish

**Files:**
- Modify: `app/globals.css`
- Modify: `app/dashboard/layout.tsx`
- Modify: `app/dashboard/page.tsx`

**Interfaces:**
- Consumes: `AppSidebar` (Task 7), `calculateProjectMetrics` with `cumulativeDiscountedNpv` (Task 3)
- Produces:
  - Updated `app/dashboard/layout.tsx` implementing the `Framed Sheet` paradigm from `design-taste-frontend/references/app-screens.md` (sidebar on subtle canvas background, main content area inside a rounded `1px`-bordered elevated sheet with sticky header bar)
  - Redesigned `app/dashboard/page.tsx` with clean KPI ledger strip (no decorative icons in tinted squares), real cumulative cash flow vs. discounted NPV chart (replacing the deleted `runningTotal * 1.08` fake line), and tabular portfolio breakdown

- [ ] **Step 1: Apply `Framed Sheet` layout and financial utility classes in `app/globals.css` and `app/dashboard/layout.tsx`**

- Add `.tabular-financial { font-variant-numeric: tabular-nums; font-feature-settings: "tnum" 1; }` in `app/globals.css` and refine surface tokens so the sidebar sits on a subtle muted canvas while `<SidebarInset>` renders as a crisp bordered sheet (`md:m-2 md:rounded-xl md:border md:border-border/80 md:bg-background md:shadow-xs`).

- [ ] **Step 2: Redesign `app/dashboard/page.tsx` (Portfolio Overview)**

- Replace the 4 icon-in-tinted-square KPI cards with a unified 4-column `1px`-divided financial ledger bar (`VPN Consolidado`, `TIR Ponderada de Portafolio`, `Capital Comprometido CAPEX`, `Proyectos Viables vs. En Riesgo`) using `font-mono tabular-nums`.
- Update the main Recharts `AreaChart` to plot real `cumulativeNet` and `cumulativeDiscountedNpv` from `buildCashFlowSeries`.

- [ ] **Step 3: Run typecheck to verify compilation**

Run: `pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add app/globals.css app/dashboard/layout.tsx app/dashboard/page.tsx
git commit -m "feat(dashboard): implement Framed Sheet layout and redesign portfolio overview with real discounted series"
```

---

### Task 10: Complete ES/EN i18n & Visual Unification Across All 8 Advanced Modules

**Files:**
- Modify: `messages/es.json`
- Modify: `messages/en.json`
- Modify: `app/dashboard/projects/[id]/investment/page.tsx`
- Modify: `app/dashboard/projects/[id]/assets/page.tsx`
- Modify: `app/dashboard/projects/[id]/financing/page.tsx`
- Modify: `app/dashboard/projects/[id]/pro-forma/page.tsx`
- Modify: `app/dashboard/projects/[id]/scenarios/page.tsx`
- Modify: `app/dashboard/projects/[id]/control/page.tsx`
- Modify: `app/dashboard/alternatives/page.tsx`
- Modify: `app/dashboard/alternatives/[groupId]/page.tsx`

**Interfaces:**
- Consumes: `useTranslations` from `next-intl`
- Produces:
  - Complete translation namespaces in `messages/es.json` and `messages/en.json`: `workspace`, `investmentPage`, `assetsPage`, `financingPage`, `proFormaPage`, `scenariosPage`, `controlPage`, `alternativesPage`, and updated `landing`
  - Consistent semantic color tokens and `tabular-nums` across all 8 advanced module pages

- [ ] **Step 1: Add complete ES and EN translation keys in `messages/es.json` and `messages/en.json`**

Add structured keys covering every title, table column header, form label, badge, alert, and empty state for `workspace`, `investmentPage`, `assetsPage`, `financingPage`, `proFormaPage`, `scenariosPage`, `controlPage`, `alternativesPage`, and the new `landing` simulator/showcase sections. Ensure JSON structure parity between `es.json` and `en.json`.

- [ ] **Step 2: Replace hardcoded Spanish strings and arbitrary colors in the 8 advanced pages**

- Wire `useTranslations` in `investment/page.tsx`, `assets/page.tsx`, `financing/page.tsx`, `pro-forma/page.tsx`, `scenarios/page.tsx`, `control/page.tsx`, `alternatives/page.tsx`, and `alternatives/[groupId]/page.tsx`.
- In `alternatives/[groupId]/page.tsx`: display the new `baue` column and show a prominent banner when `hasUnequalLifespans` is `true` explaining that selection uses `BAUE` (`calculateEquivalentAnnualWorth`).
- In `pro-forma/page.tsx`: display the new `NOPAT` and `Salvage Value` rows in the Free Cash Flow table.
- Remove duplicate inner page headers that are now rendered by `ProjectWorkspaceHeader` in `app/dashboard/projects/[id]/layout.tsx`.

- [ ] **Step 3: Verify JSON key parity and TypeScript compilation**

Run: `node -e "const es=require('./messages/es.json'), en=require('./messages/en.json'); const k=o=>Object.keys(o).flatMap(x=>typeof o[x]==='object'?k(o[x]).map(y=>x+'.'+y):[x]); const d=k(es).filter(x=>!k(en).includes(x)); if(d.length) throw new Error('Missing EN keys: '+d.join(',')); console.log('i18n parity OK');" && pnpm exec tsc --noEmit`
Expected: `i18n parity OK` and 0 TypeScript errors.

- [ ] **Step 4: Commit**

```bash
git add messages/es.json messages/en.json app/dashboard/projects/[id]/investment/page.tsx app/dashboard/projects/[id]/assets/page.tsx app/dashboard/projects/[id]/financing/page.tsx app/dashboard/projects/[id]/pro-forma/page.tsx app/dashboard/projects/[id]/scenarios/page.tsx app/dashboard/projects/[id]/control/page.tsx app/dashboard/alternatives/page.tsx app/dashboard/alternatives/[groupId]/page.tsx
git commit -m "feat(i18n): localize all lifecycle and alternatives modules in ES/EN and unify financial table styling"
```

---

### Task 11: Connect Orphaned Edit Mutations (`updateAsset`, `updateLoan`, `updateProjectGroup`) & PUC Catalog Selector (`chart_of_accounts`)

**Files:**
- Create: `lib/services/chart-of-accounts.ts`
- Create: `components/dashboard/puc-account-select.tsx`
- Modify: `app/dashboard/projects/[id]/assets/page.tsx`
- Modify: `app/dashboard/projects/[id]/financing/page.tsx`
- Modify: `app/dashboard/projects/[id]/investment/page.tsx`
- Modify: `app/dashboard/alternatives/page.tsx`

**Interfaces:**
- Consumes: existing `updateAsset` (`lib/services/assets.ts:171`), `updateLoan` (`lib/services/loans.ts:153`), `updateProjectGroup` (`lib/services/project-groups.ts:168`), and table `public.chart_of_accounts`
- Produces:
  - `getChartOfAccounts(accountType?: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense'): Promise<ChartOfAccountRow[]>` in `lib/services/chart-of-accounts.ts`
  - `PucAccountSelect` component (`components/dashboard/puc-account-select.tsx`) replacing raw free-text `account_code` inputs in `/assets`, `/financing`, and `/investment`
  - Edit mode in the dialogs of `/assets` (calling `updateAsset`), `/financing` (calling `updateLoan`, plus a `"Usar este WACC como tasa del proyecto"` button calling `updateProjectLifecycleAndRate`), and `/alternatives` (calling `updateProjectGroup`)

- [ ] **Step 1: Create `lib/services/chart-of-accounts.ts` and `components/dashboard/puc-account-select.tsx`**

- Query `public.chart_of_accounts` ordered by `code ASC`, with a fallback list of standard PUC accounts if the table is empty in a local environment.
- Render a searchable select (`PucAccountSelect`) showing `code — name` (e.g., `1520 — Maquinaria y Equipo`, `2105 — Bancos Nacionales`) while still allowing custom codes.

- [ ] **Step 2: Wire `updateAsset`, `updateLoan`, and `updateProjectGroup` into their respective pages**

- In `app/dashboard/projects/[id]/assets/page.tsx`: add an `"Editar"` (`Pencil`) button per asset row that opens the dialog pre-filled with the asset's values and calls `updateAsset(editingAsset.id, form)` on submit; replace the raw `account_code` `<Input>` with `<PucAccountSelect accountType="asset" />`.
- In `app/dashboard/projects/[id]/financing/page.tsx`: add an `"Editar"` (`Pencil`) button per loan card/tab that opens the dialog pre-filled and calls `updateLoan(editingLoan.id, form)` on submit; replace raw `account_code` `<Input>` with `<PucAccountSelect accountType="liability" />`; add a button on the WACC card to set `discount_rate_source = 'wacc'` on the project.
- In `app/dashboard/alternatives/page.tsx`: add an `"Editar Grupo"` button on each group card that opens the dialog pre-filled with `name`, `description`, `common_discount_rate`, and `memberIds`, calling `updateProjectGroup(editingGroup.id, form)` on submit.

- [ ] **Step 3: Run typecheck to verify compilation**

Run: `pnpm exec tsc --noEmit`
Expected: PASS with 0 errors.

- [ ] **Step 4: Commit**

```bash
git add lib/services/chart-of-accounts.ts components/dashboard/puc-account-select.tsx app/dashboard/projects/[id]/assets/page.tsx app/dashboard/projects/[id]/financing/page.tsx app/dashboard/projects/[id]/investment/page.tsx app/dashboard/alternatives/page.tsx
git commit -m "feat(crud): wire updateAsset, updateLoan, updateProjectGroup in UI and add PUC chart_of_accounts selector"
```

---

### Task 12: Connect `project_snapshots` Baseline Versioning & Comparison Panel

**Files:**
- Create: `lib/services/snapshots.ts`
- Create: `lib/services/snapshots.test.ts`
- Create: `components/dashboard/project-snapshots-panel.tsx`
- Modify: `app/dashboard/projects/[id]/control/page.tsx`

**Interfaces:**
- Consumes: `public.project_snapshots` table (`20260613185000_lifecycle_foundations.sql`), `calculateProjectMetrics` (`lib/services/project-analytics.ts`)
- Produces:
  - `ProjectSnapshot` type and `createProjectSnapshot(projectId: string, label: string, notes?: string): Promise<ProjectSnapshot>`, `getProjectSnapshots(projectId: string): Promise<ProjectSnapshot[]>`, `deleteProjectSnapshot(snapshotId: string): Promise<void>`, and `compareSnapshotWithCurrent(snapshot: ProjectSnapshot, currentMetrics: { npv: number; irrPercent: number; payback: number | null; initialInvestment: number; discountRatePercent: number })` in `lib/services/snapshots.ts`
  - `ProjectSnapshotsPanel` rendered in `app/dashboard/projects/[id]/control/page.tsx`

- [ ] **Step 1: Write the failing test in `lib/services/snapshots.test.ts`**

```typescript
import { describe, expect, it } from "vitest"
import { compareSnapshotWithCurrent } from "./snapshots"

describe("compareSnapshotWithCurrent", () => {
  it("computes deltas between a frozen baseline snapshot and current project indicators", () => {
    const snapshot = {
      id: "s1",
      project_id: "p1",
      snapshot_name: "Línea Base Preinversión",
      phase: "preinversion",
      snapshot_data: {
        npv: 15000,
        irrPercent: 18.5,
        payback: 2.4,
        initialInvestment: 50000,
        discountRatePercent: 12,
      },
      notes: null,
      created_at: "2026-10-01T00:00:00Z",
    }

    const diff = compareSnapshotWithCurrent(snapshot, {
      npv: 12500,
      irrPercent: 16.0,
      payback: 2.8,
      initialInvestment: 55000,
      discountRatePercent: 12,
    })

    expect(diff.npvDelta).toBeCloseTo(-2500, 2)
    expect(diff.irrDeltaPercent).toBeCloseTo(-2.5, 2)
    expect(diff.investmentDelta).toBeCloseTo(5000, 2)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm exec vitest run lib/services/snapshots.test.ts`
Expected: FAIL with `Cannot find module './snapshots'`.

- [ ] **Step 3: Implement `lib/services/snapshots.ts` and `components/dashboard/project-snapshots-panel.tsx`, and mount in `control/page.tsx`**

- Implement `createProjectSnapshot`, `getProjectSnapshots`, `deleteProjectSnapshot`, and pure `compareSnapshotWithCurrent` in `lib/services/snapshots.ts` using Zod validation for the snapshot payload.
- Build `components/dashboard/project-snapshots-panel.tsx` allowing the user to freeze the current project state with a custom label (e.g., *"Aprobación Comité Preinversión"*) and inspect side-by-side deltas (`ΔVPN`, `ΔTIR`, `ΔCAPEX`, `ΔPayback`) against the live project.
- Mount `ProjectSnapshotsPanel` inside `app/dashboard/projects/[id]/control/page.tsx` andrun full verification (`vitest`, `tsc --noEmit`, `pnpm build`).

- [ ] **Step 4: Run all tests, typecheck, and production build**

Run: `pnpm exec vitest run && pnpm exec tsc --noEmit && pnpm build`
Expected: All test suites PASS, 0 TypeScript errors, and production build succeeds.

- [ ] **Step 5: Commit**

```bash
git add lib/services/snapshots.ts lib/services/snapshots.test.ts components/dashboard/project-snapshots-panel.tsx app/dashboard/projects/[id]/control/page.tsx
git commit -m "feat(snapshots): wire project_snapshots baseline versioning and comparison panel into Control view"
```
