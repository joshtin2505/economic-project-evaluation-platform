"use client";

import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { User, Bell, Palette, Calculator, Globe, Save } from "lucide-react";
import { useTheme } from "next-themes";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Settings */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                <CardTitle>{t("profile.title")}</CardTitle>
              </div>
              <CardDescription>{t("profile.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("profile.name")}</Label>
                  <Input id="name" defaultValue="John Engineer" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("profile.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue="john@company.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t("profile.company")}</Label>
                <Input id="company" defaultValue="Engineering Solutions Inc." />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t("profile.role")}</Label>
                <Input id="role" defaultValue="Financial Analyst" />
              </div>
            </CardContent>
          </Card>

          {/* Calculation Defaults */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                <CardTitle>{t("calculations.title")}</CardTitle>
              </div>
              <CardDescription>{t("calculations.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="defaultDiscount">
                    {t("calculations.discountRate")}
                  </Label>
                  <Input id="defaultDiscount" type="number" defaultValue="12" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultPeriods">
                    {t("calculations.analysisPeriods")}
                  </Label>
                  <Input id="defaultPeriods" type="number" defaultValue="10" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultRiskFree">
                    {t("calculations.riskFreeRate")}
                  </Label>
                  <Input id="defaultRiskFree" type="number" defaultValue="4" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultInflation">
                    {t("calculations.inflation")}
                  </Label>
                  <Input id="defaultInflation" type="number" defaultValue="3" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultRiskPremium">
                    {t("calculations.riskPremium")}
                  </Label>
                  <Input
                    id="defaultRiskPremium"
                    type="number"
                    defaultValue="5"
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("calculations.irrMethod")}</Label>
                <Select defaultValue="newton">
                  <SelectTrigger>
                    <SelectValue placeholder={t("calculations.selectMethod")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newton">
                      {t("calculations.methods.newton")}
                    </SelectItem>
                    <SelectItem value="bisection">
                      {t("calculations.methods.bisection")}
                    </SelectItem>
                    <SelectItem value="secant">
                      {t("calculations.methods.secant")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("calculations.methodHelp")}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Localization */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                <CardTitle>{t("localization.title")}</CardTitle>
              </div>
              <CardDescription>{t("localization.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>{t("localization.currency")}</Label>
                  <Select defaultValue="usd">
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("localization.selectCurrency")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">
                        {t("localization.currencies.usd")}
                      </SelectItem>
                      <SelectItem value="eur">
                        {t("localization.currencies.eur")}
                      </SelectItem>
                      <SelectItem value="gbp">
                        {t("localization.currencies.gbp")}
                      </SelectItem>
                      <SelectItem value="mxn">
                        {t("localization.currencies.mxn")}
                      </SelectItem>
                      <SelectItem value="brl">
                        {t("localization.currencies.brl")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>{t("localization.numberFormat")}</Label>
                  <Select defaultValue="en-us">
                    <SelectTrigger>
                      <SelectValue
                        placeholder={t("localization.selectNumberFormat")}
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en-us">
                        {t("localization.numberFormats.enUs")}
                      </SelectItem>
                      <SelectItem value="es">
                        {t("localization.numberFormats.es")}
                      </SelectItem>
                      <SelectItem value="de">
                        {t("localization.numberFormats.de")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>{t("localization.language")}</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("localization.selectLanguage")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">
                      {t("localization.languages.en")}
                    </SelectItem>
                    <SelectItem value="es">
                      {t("localization.languages.es")}
                    </SelectItem>
                    <SelectItem value="pt">
                      {t("localization.languages.pt")}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Appearance */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5 text-primary" />
                <CardTitle>{t("appearance.title")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>{t("appearance.theme")}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {["light", "dark", "system"].map((themeName) => (
                    <Button
                      key={themeName}
                      variant={theme === themeName ? "default" : "outline"}
                      size="sm"
                      onClick={() => setTheme(themeName)}
                      className="capitalize"
                    >
                      {themeName === "light"
                        ? t("appearance.themes.light")
                        : themeName === "dark"
                          ? t("appearance.themes.dark")
                          : t("appearance.themes.system")}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5 text-primary" />
                <CardTitle>{t("notifications.title")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("notifications.email")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.emailHelp")}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("notifications.projectUpdates")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.projectUpdatesHelp")}
                  </p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("notifications.weeklySummary")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.weeklySummaryHelp")}
                  </p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>

          {/* Plan Info */}
          <Card>
            <CardHeader>
              <CardTitle>{t("plan.title")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t("plan.name")}</span>
                <Badge>{t("plan.active")}</Badge>
              </div>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>{t("plan.features.projects")}</p>
                <p>{t("plan.features.calculations")}</p>
                <p>{t("plan.features.exports")}</p>
                <p>{t("plan.features.support")}</p>
              </div>
              <Button variant="outline" className="w-full">
                {t("plan.manageSubscription")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button>
          <Save className="mr-2 h-4 w-4" />
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
