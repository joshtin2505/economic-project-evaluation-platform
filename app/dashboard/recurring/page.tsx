"use client";
import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { routes } from "@/lib/routes";
import {
  fetchIncomeSources,
  fetchRecurringExpenses,
  IncomeSource,
  RecurringExpense,
} from "@/lib/services/recurring";
import { toast } from "sonner";

export default function RecurringPage() {
  const t = useTranslations("dashboard.recurringPage");
  const [incomes, setIncomes] = useState<IncomeSource[]>([]);
  const [expenses, setExpenses] = useState<RecurringExpense[]>([]);

  useEffect(() => {
    async function loadData() {
      fetchIncomeSources()
        .then(setIncomes)
        .catch((err) => {
          toast.error(t("errors.income"));
          console.error("Error fetching income sources:", err);
        });
      fetchRecurringExpenses()
        .then(setExpenses)
        .catch((err) => {
          toast.error(t("errors.expenses"));
          console.error("Error fetching recurring expenses:", err);
        });
    }
    loadData();
  }, [t]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <div className="flex gap-2">
          <Link href="/dashboard/settings">
            <Button variant="outline">{t("settings")}</Button>
          </Link>
          <Link href={routes.recurringNew}>
            <Button>{t("new")}</Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("incomeSources")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.amount")}</TableHead>
                  <TableHead>{t("table.frequency")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incomes.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell>{inc.name}</TableCell>
                    <TableCell>{Number(inc.amount).toLocaleString()}</TableCell>
                    <TableCell>{inc.frequency}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={routes.recurringEdit("income", inc.id)}>
                          {t("edit")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("expenses")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.name")}</TableHead>
                  <TableHead>{t("table.amount")}</TableHead>
                  <TableHead>{t("table.frequency")}</TableHead>
                  <TableHead className="text-right">
                    {t("table.actions")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expenses.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell>{exp.name}</TableCell>
                    <TableCell>{Number(exp.amount).toLocaleString()}</TableCell>
                    <TableCell>{exp.frequency}</TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link href={routes.recurringEdit("expense", exp.id)}>
                          {t("edit")}
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
