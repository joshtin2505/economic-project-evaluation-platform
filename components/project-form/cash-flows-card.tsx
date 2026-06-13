"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface CashFlowRow {
  period: number
  inflow: number
  outflow: number
}

interface CashFlowsCardProps {
  t: any
  initialInvestment: number
  cashFlows: CashFlowRow[]
  addPeriod: () => void
  removePeriod: (index: number) => void
  updateCashFlow: (index: number, field: "inflow" | "outflow", value: number) => void
  calculations: {
    totalInflows: number
    totalOutflows: number
  }
}

export function CashFlowsCard({
  t,
  initialInvestment,
  cashFlows,
  addPeriod,
  removePeriod,
  updateCashFlow,
  calculations,
}: CashFlowsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("cashFlows.title")}</CardTitle>
          <CardDescription>{t("cashFlows.description")}</CardDescription>
        </div>
        <Button onClick={addPeriod} size="sm">
          <Plus className="mr-1 h-4 w-4" />
          {t("cashFlows.addPeriod")}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-20">{t("cashFlows.period")}</TableHead>
                <TableHead>{t("cashFlows.inflows")}</TableHead>
                <TableHead>{t("cashFlows.outflows")}</TableHead>
                <TableHead>{t("cashFlows.netFlow")}</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-muted/30">
                <TableCell className="font-medium">{t("cashFlows.year0")}</TableCell>
                <TableCell>
                  <span className="text-muted-foreground">-</span>
                </TableCell>
                <TableCell>
                  <span className="font-mono text-destructive">
                    ${initialInvestment.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <span className="font-mono font-medium text-destructive">
                    -{initialInvestment.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell />
              </TableRow>
              {cashFlows.map((cf, index) => (
                <TableRow key={cf.period}>
                  <TableCell className="font-medium">
                    {t("cashFlows.year", { period: cf.period })}
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={cf.inflow}
                      onChange={(e) =>
                        updateCashFlow(index, "inflow", Number(e.target.value))
                      }
                      className="h-8 w-28 font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={cf.outflow}
                      onChange={(e) =>
                        updateCashFlow(index, "outflow", Number(e.target.value))
                      }
                      className="h-8 w-28 font-mono"
                    />
                  </TableCell>
                  <TableCell>
                    <span
                      className={`font-mono font-medium ${
                        cf.inflow - cf.outflow >= 0
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {cf.inflow - cf.outflow >= 0 ? "+" : ""}$
                      {(cf.inflow - cf.outflow).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removePeriod(index)}
                      disabled={cashFlows.length <= 1}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 flex items-center justify-end gap-6 text-sm">
          <div>
            <span className="text-muted-foreground">{t("cashFlows.totalInflows")}</span>
            <span className="font-mono font-medium text-success ml-1">
              ${calculations.totalInflows.toLocaleString()}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">{t("cashFlows.totalOutflows")}</span>
            <span className="font-mono font-medium text-destructive ml-1">
              ${calculations.totalOutflows.toLocaleString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
