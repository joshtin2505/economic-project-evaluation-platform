"use client"

import { useTranslations } from "next-intl"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import ProjectForm from "@/components/project-form"
import { useProjectForm } from "@/lib/hooks/useProjectForm"
import * as projectService from "@/lib/services/projects"
import { buildResultsPayload } from "@/lib/utils/project-results"
import { estimatePaybackPeriod } from "@/lib/services/project-analytics"
import * as auth from "@/lib/supabase/auth"
import { routes } from "@/lib/routes"
import { toast } from "sonner"

export default function NewProjectPage() {
  const router = useRouter()
  const t = useTranslations("dashboard.projectsNewPage")
  const form = useProjectForm()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<null | "draft" | "calculate">(null)

  const saveProject = async (mode: "draft" | "calculate") => {
    setSubmitError(null)
    setIsSaving(mode)

    try {
      const user = await auth.getUser()
      if (!user) throw new Error("Session expired. Please log in again.")

      const status = mode === "draft" ? "draft" : "completed"

      const payload: any = {
        user_id: user.id,
        name: form.projectName || "Untitled Project",
        description: form.description,
        initial_investment: form.initialInvestment,
        periods: form.cashFlows.length,
        discount_rate: form.discountRate,
        inflation: form.inflation,
        risk_premium: form.riskPremium,
        tmar_method: form.tmarMethod,
        use_tmar_as_discount_rate: form.useTmarAsDiscountRate,
        funding_sources: form.fundingSources,
        salvage_value: form.salvageValue,
        status,
        results:
          mode === "calculate"
            ? buildResultsPayload(form.calculations, {
                paybackPeriod: estimatePaybackPeriod(
                  { initial_investment: form.initialInvestment },
                  form.cashFlows,
                ),
              })
            : null,
      }

      await projectService.createProjectWithFlows(payload, form.cashFlows).then(() => {
        toast.success("Project saved successfully")
      }).catch((error) => {
        toast.error(error instanceof Error ? error.message : "Error al guardar el proyecto")
      })

      router.push(routes.projects)
      router.refresh()
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save project")
    } finally {
      setIsSaving(null)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <Card>
        <CardContent>
          <ProjectForm
            t={t}
            projectName={form.projectName}
            setProjectName={form.setProjectName}
            description={form.description}
            setDescription={form.setDescription}
            initialInvestment={form.initialInvestment}
            setInitialInvestment={form.setInitialInvestment}
            periods={form.periods}
            setPeriods={form.setPeriods}
            discountRate={form.discountRate}
            setDiscountRate={form.setDiscountRate}
            inflation={form.inflation}
            setInflation={form.setInflation}
            riskPremium={form.riskPremium}
            setRiskPremium={form.setRiskPremium}
            tmarMethod={form.tmarMethod}
            setTmarMethod={form.setTmarMethod}
            useTmarAsDiscountRate={form.useTmarAsDiscountRate}
            setUseTmarAsDiscountRate={form.setUseTmarAsDiscountRate}
            fundingSources={form.fundingSources}
            updateFundingSource={form.updateFundingSource}
            addFundingSource={form.addFundingSource}
            removeFundingSource={form.removeFundingSource}
            cashFlows={form.cashFlows}
            addPeriod={form.addPeriod}
            removePeriod={form.removePeriod}
            updateCashFlow={form.updateCashFlow}
            calculations={form.calculations}
            isSaving={isSaving}
            submitError={submitError}
            onSaveDraft={() => void saveProject("draft")}
            onCalculate={() => void saveProject("calculate")}
            salvageValue={form.salvageValue}
            setSalvageValue={form.setSalvageValue}
          />
        </CardContent>
      </Card>
    </div>
  )
}
