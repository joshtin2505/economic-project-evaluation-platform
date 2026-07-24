"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Calculator, Save } from "lucide-react";
import { useTranslations } from "next-intl";

interface Props {
  isSaving: null | "draft" | "calculate";
  onSaveDraft: () => void;
  onCalculate: () => void;
  disabled?: boolean;
}

export default function ProjectSaveControls({
  isSaving,
  onSaveDraft,
  onCalculate,
  disabled,
}: Props) {
  const t = useTranslations("common");
  return (
    <div className="flex items-center justify-end gap-3">
      <Button
        variant="outline"
        onClick={onSaveDraft}
        disabled={disabled || isSaving !== null}
      >
        <Save className="mr-2 h-4 w-4" />
        {isSaving === "draft" ? t("savingDraft") : t("save")}
      </Button>

      <Button onClick={onCalculate} disabled={disabled || isSaving !== null}>
        <Calculator className="mr-2 h-4 w-4" />
        {isSaving === "calculate" ? t("calculating") : t("calculate")}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </div>
  );
}
