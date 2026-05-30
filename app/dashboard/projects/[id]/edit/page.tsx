"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import ProjectForm from "@/components/project-form"
import { useProjectForm } from "@/lib/hooks/useProjectForm"
import * as projectService from "@/lib/services/projects"
import { buildResultsPayload } from "@/lib/utils/project-results"
import { estimatePaybackPeriod } from "@/lib/services/project-analytics"
import * as auth from "@/lib/supabase/auth"
import { routes } from "@/lib/routes"

interface Props {
  params: { id: string }
}

export default function EditProjectPage({ params }: Props) {
  const { id } = params
  const router = useRouter()
  const t = useTranslations("dashboard.projectsNewPage")
  const form = useProjectForm()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState<null | "draft" | "calculate">(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await projectService.fetchProjectById(id)
        const flows = await projectService.fetchCashFlows(id)
        form.setInitialValues(data ?? {}, flows ?? [])
      } catch (err) {
        setSubmitError(err instanceof Error ? err.message : "Failed to load project")
      }
    }
    void load()
  }, [id])

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

      await projectService.updateProjectWithFlows(id, payload, form.cashFlows)

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
        cashFlows={form.cashFlows}
        addPeriod={form.addPeriod}
        removePeriod={form.removePeriod}
        updateCashFlow={form.updateCashFlow}
        calculations={form.calculations}
        isSaving={isSaving}
        submitError={submitError}
        onSaveDraft={() => void saveProject("draft")}
        onCalculate={() => void saveProject("calculate")}
      />
    </div>
  )
}
