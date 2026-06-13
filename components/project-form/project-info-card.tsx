"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from "lucide-react"

interface ProjectInfoCardProps {
  t: any
  projectName: string
  setProjectName: (v: string) => void
  description: string
  setDescription: (v: string) => void
  initialInvestment: number
  setInitialInvestment: (v: number) => void
  salvageValue: number
  setSalvageValue: (v: number) => void
}

export function ProjectInfoCard({
  t,
  projectName,
  setProjectName,
  description,
  setDescription,
  initialInvestment,
  setInitialInvestment,
  salvageValue,
  setSalvageValue,
}: ProjectInfoCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("projectInfo.title")}</CardTitle>
        <CardDescription>{t("projectInfo.description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="projectName">{t("projectInfo.name")}</Label>
            <Input
              id="projectName"
              placeholder={t("projectInfo.namePlaceholder")}
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initialInvestment" className="flex items-center gap-1">
              {t("projectInfo.initialInvestment")}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("projectInfo.initialInvestmentHelp")}</p>
                </TooltipContent>
              </Tooltip>
            </Label>
            <Input
              id="initialInvestment"
              type="number"
              value={initialInvestment}
              onChange={(e) => {
                const value = Number(e.target.value)
                setInitialInvestment(value)
                // Auto-calculate salvage value as 20% of initial investment
                setSalvageValue(value * 0.2)
              }}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="salvageValue" className="flex items-center gap-1">
            {t("projectInfo.salvageValue")}
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-3 w-3 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent>
                <p>{t("projectInfo.salvageValueHelp")}</p>
              </TooltipContent>
            </Tooltip>
          </Label>
          <Input
            id="salvageValue"
            type="number"
            value={salvageValue}
            onChange={(e) => setSalvageValue(Number(e.target.value))}
          />
          <p className="text-xs text-muted-foreground">
            {t("projectInfo.salvageValueNote", {
              percentage: 20,
              value: (initialInvestment * 0.2).toLocaleString(),
            })}
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t("projectInfo.descriptionLabel")}</Label>
          <Textarea
            id="description"
            placeholder={t("projectInfo.descriptionPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>
      </CardContent>
    </Card>
  )
}
