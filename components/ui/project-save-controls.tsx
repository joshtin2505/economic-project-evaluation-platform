"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Save, Calculator, ArrowRight } from "lucide-react"

interface Props {
  isSaving: null | "draft" | "calculate"
  onSaveDraft: () => void
  onCalculate: () => void
  disabled?: boolean
}

export default function ProjectSaveControls({ isSaving, onSaveDraft, onCalculate, disabled }: Props) {
  return (
    <div className="flex items-center justify-end gap-3">
      <Button variant="outline" onClick={onSaveDraft} disabled={disabled || isSaving !== null}>
        <Save className="mr-2 h-4 w-4" />
        {isSaving === "draft" ? "Saving..." : "Save Draft"}
      </Button>

      <Button onClick={onCalculate} disabled={disabled || isSaving !== null}>
        <Calculator className="mr-2 h-4 w-4" />
        {isSaving === "calculate" ? "Calculating..." : "Calculate"}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  )
}
