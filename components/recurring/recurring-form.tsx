"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createIncomeSource,
  createRecurringExpense,
  updateIncomeSource,
  updateRecurringExpense,
  type IncomeSource,
  type RecurringExpense,
  type RecurringKind,
} from "@/lib/services/recurring";
import { routes } from "@/lib/routes";

type EditableRecurringItem = IncomeSource | RecurringExpense;

const frequencyOptions = [
  "daily",
  "weekly",
  "monthly",
  "quarterly",
  "annual",
] as const;

interface Props {
  mode: "create" | "edit";
  kind: RecurringKind;
  initialData?: EditableRecurringItem | null;
}

export default function RecurringForm({ mode, kind, initialData }: Props) {
  const router = useRouter();
  const t = useTranslations("dashboard.recurringForm");
  const [itemKind, setItemKind] = useState<RecurringKind>(kind);
  const [name, setName] = useState(initialData?.name ?? "");
  const [amount, setAmount] = useState(Number(initialData?.amount ?? 0));
  const [frequency, setFrequency] = useState<
    EditableRecurringItem["frequency"]
  >(initialData?.frequency ?? "monthly");
  const [startDate, setStartDate] = useState(
    initialData?.start_date ?? new Date().toISOString().slice(0, 10),
  );
  const [endDate, setEndDate] = useState(initialData?.end_date ?? "");
  const [notes, setNotes] = useState(initialData?.notes ?? "");
  const [category, setCategory] = useState(
    "category" in (initialData ?? {})
      ? ((initialData as RecurringExpense)?.category ?? "")
      : "",
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const title = useMemo(() => {
    if (mode === "edit") {
      return itemKind === "income" ? t("edit.income") : t("edit.expense");
    }
    return itemKind === "income" ? t("create.income") : t("create.expense");
  }, [itemKind, mode, t]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    const payload = {
      name,
      amount,
      frequency,
      start_date: startDate,
      end_date: endDate || null,
      notes: notes || null,
      ...(itemKind === "expense" ? { category: category || "" } : {}),
    };

    try {
      if (itemKind === "income") {
        if (mode === "edit" && initialData) {
          await updateIncomeSource(initialData.id, payload);
        } else {
          await createIncomeSource(payload);
        }
      } else {
        if (mode === "edit" && initialData) {
          await updateRecurringExpense(initialData.id, payload);
        } else {
          await createRecurringExpense(payload);
        }
      }

      router.push(routes.recurring);
      router.refresh();
    } catch (saveError) {
      setError(
        saveError instanceof Error ? saveError.message : t("errors.save"),
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("types.title")}</Label>
            <Select
              value={itemKind}
              onValueChange={(value) => setItemKind(value as RecurringKind)}
              disabled={mode === "edit"}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("types.select")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">{t("types.income")}</SelectItem>
                <SelectItem value="expense">{t("types.expense")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("namePlaceholder")}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label>{t("amount")}</Label>
            <Input
              type="number"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("frequency")}</Label>
            <Select
              value={frequency}
              onValueChange={(value) =>
                setFrequency(value as EditableRecurringItem["frequency"])
              }
            >
              <SelectTrigger>
                <SelectValue placeholder={t("selectFrequency")} />
              </SelectTrigger>
              <SelectContent>
                {frequencyOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t("startDate")}</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(event) => setStartDate(event.target.value)}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("endDate")}</Label>
            <Input
              type="date"
              value={endDate ?? ""}
              onChange={(event) => setEndDate(event.target.value)}
            />
          </div>
          {itemKind === "expense" && (
            <div className="space-y-2">
              <Label>{t("category")}</Label>
              <Input
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                placeholder={t("categoryPlaceholder")}
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("notes")}</Label>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(routes.recurring)}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => void handleSave()}
            disabled={isSaving}
          >
            {isSaving ? t("saving") : title}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
