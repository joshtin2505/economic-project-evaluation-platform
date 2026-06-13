"use client"

import React from "react"
import { TooltipProvider } from "@/components/ui/tooltip"
import ProjectSaveControls from "@/components/ui/project-save-controls"
import type { FundingSource, TmarMethod } from "@/lib/utils/tmar"
import { ProjectInfoCard } from "./project-form/project-info-card"
import { FinancialConfigCard } from "./project-form/financial-config-card"
import { CashFlowsCard } from "./project-form/cash-flows-card"
import { PreviewCard } from "./project-form/preview-card"

interface CashFlowRow {
  period: number
  inflow: number
  outflow: number
}

interface Props {
  t: any
  projectName: string
  setProjectName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  initialInvestment: number
  setInitialInvestment: (v: number) => void
  periods: number
  setPeriods: (v: number) => void
  discountRate: number
  setDiscountRate: (v: number) => void
  inflation: number
  setInflation: (v: number) => void
  riskPremium: number
  setRiskPremium: (v: number) => void
  tmarMethod: TmarMethod
  setTmarMethod: (v: TmarMethod) => void
  useTmarAsDiscountRate: boolean
  setUseTmarAsDiscountRate: (v: boolean) => void
  fundingSources: FundingSource[]
  updateFundingSource: (
    id: string,
    field: keyof Pick<FundingSource, "name" | "share" | "cost">,
    value: string | number,
  ) => void
  addFundingSource: () => void
  removeFundingSource: (id: string) => void
  cashFlows: CashFlowRow[]
  addPeriod: () => void
  removePeriod: (index: number) => void
  updateCashFlow: (index: number, field: "inflow" | "outflow", value: number) => void
  calculations: {
    npv: number
    irr: string
    tmar: string
    tmarMethod: TmarMethod
    fundingShareTotal: number
    bcRatio: string
    totalInflows: number
    totalOutflows: number
    effectiveDiscountRate: number
    useTmarAsDiscountRate: boolean
    isViable: boolean
  }
  isSaving: null | "draft" | "calculate"
  submitError: string | null
  onSaveDraft: () => void
  onCalculate: () => void
  salvageValue: number
  setSalvageValue: (v: number) => void
}

export default function ProjectForm(props: Props) {
  const {
    t,
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
    isSaving,
    submitError,
    onSaveDraft,
    onCalculate,
    salvageValue,
    setSalvageValue,
  } = props

  const fundingShareValid = Math.abs(calculations.fundingShareTotal - 100) < 0.01
  const previewFormulaKey =
    calculations.tmarMethod === "mixta"
      ? "preview.tmarFormulaMixta"
      : "preview.tmarFormulaSimple"

  return (
    <TooltipProvider>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <ProjectInfoCard
            t={t}
            projectName={projectName}
            setProjectName={setProjectName}
            description={description}
            setDescription={setDescription}
            initialInvestment={initialInvestment}
            setInitialInvestment={setInitialInvestment}
            salvageValue={salvageValue}
            setSalvageValue={setSalvageValue}
          />

          <FinancialConfigCard
            t={t}
            discountRate={discountRate}
            setDiscountRate={setDiscountRate}
            periods={periods}
            setPeriods={setPeriods}
            useTmarAsDiscountRate={useTmarAsDiscountRate}
            setUseTmarAsDiscountRate={setUseTmarAsDiscountRate}
            tmarMethod={tmarMethod}
            setTmarMethod={setTmarMethod}
            inflation={inflation}
            setInflation={setInflation}
            riskPremium={riskPremium}
            setRiskPremium={setRiskPremium}
            fundingSources={fundingSources}
            updateFundingSource={updateFundingSource}
            addFundingSource={addFundingSource}
            removeFundingSource={removeFundingSource}
            calculations={calculations}
            fundingShareValid={fundingShareValid}
          />

          <CashFlowsCard
            t={t}
            initialInvestment={initialInvestment}
            cashFlows={cashFlows}
            addPeriod={addPeriod}
            removePeriod={removePeriod}
            updateCashFlow={updateCashFlow}
            calculations={calculations}
          />

          {submitError && <p className="text-sm text-destructive">{submitError}</p>}
          
          <ProjectSaveControls
            isSaving={isSaving}
            onSaveDraft={onSaveDraft}
            onCalculate={onCalculate}
          />
        </div>

        <PreviewCard
          t={t}
          calculations={calculations}
          previewFormulaKey={previewFormulaKey}
        />
      </div>
    </TooltipProvider>
  )
}
