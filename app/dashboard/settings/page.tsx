"use client";

import { useEffect, useState } from "react";
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
import { User, Bell, Palette, Calculator, Globe, Save } from "lucide-react";
import { useTheme } from "next-themes";
import * as auth from "@/lib/supabase/auth";
import {
  DEFAULT_USER_PROFILE,
  fetchUserProfile,
  upsertUserProfile,
  type UserProfile,
} from "@/lib/services/user-profiles";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("dashboard");
  const [profile, setProfile] = useState<Omit<UserProfile, "id">>(
    DEFAULT_USER_PROFILE,
  );
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const user = await auth.getUser();
        setEmail(user?.email ?? "");

        const existing = await fetchUserProfile();
        if (existing) {
          const { id: _id, ...rest } = existing;
          setProfile({
            ...DEFAULT_USER_PROFILE,
            ...rest,
            display_name:
              rest.display_name || user?.user_metadata?.full_name || "",
          });
        } else if (user?.user_metadata?.full_name) {
          setProfile((current) => ({
            ...current,
            display_name: String(user.user_metadata.full_name),
          }));
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Failed to load settings",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, []);

  const updateProfile = <K extends keyof Omit<UserProfile, "id">>(
    key: K,
    value: Omit<UserProfile, "id">[K],
  ) => {
    setProfile((current) => ({ ...current, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaved(false);

    try {
      await upsertUserProfile(profile);
      setSaved(true);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save settings",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">{t("subtitle")}</p>
      </div>

      {error && (
        <Card className="border-destructive/40">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}
      {saved && (
        <Card className="border-success/40">
          <CardContent className="py-3 text-sm text-success">
            {t("saved") ?? "Settings saved."}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
                  <Input
                    id="name"
                    value={profile.display_name}
                    disabled={isLoading}
                    onChange={(event) =>
                      updateProfile("display_name", event.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">{t("profile.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    readOnly
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">{t("profile.company")}</Label>
                <Input
                  id="company"
                  value={profile.company}
                  disabled={isLoading}
                  onChange={(event) =>
                    updateProfile("company", event.target.value)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">{t("profile.role")}</Label>
                <Input
                  id="role"
                  value={profile.role}
                  disabled={isLoading}
                  onChange={(event) =>
                    updateProfile("role", event.target.value)
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card hidden>
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
                  <Input
                    id="defaultDiscount"
                    type="number"
                    value={profile.default_discount_rate}
                    disabled={isLoading}
                    onChange={(event) =>
                      updateProfile(
                        "default_discount_rate",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultPeriods">
                    {t("calculations.analysisPeriods")}
                  </Label>
                  <Input
                    id="defaultPeriods"
                    type="number"
                    value={profile.default_periods}
                    disabled={isLoading}
                    onChange={(event) =>
                      updateProfile(
                        "default_periods",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="defaultRiskFree">
                    {t("calculations.riskFreeRate")}
                  </Label>
                  <Input
                    id="defaultRiskFree"
                    type="number"
                    value={profile.default_risk_free_rate}
                    disabled={isLoading}
                    onChange={(event) =>
                      updateProfile(
                        "default_risk_free_rate",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultInflation">
                    {t("calculations.inflation")}
                  </Label>
                  <Input
                    id="defaultInflation"
                    type="number"
                    value={profile.default_inflation}
                    disabled={isLoading}
                    onChange={(event) =>
                      updateProfile(
                        "default_inflation",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="defaultRiskPremium">
                    {t("calculations.riskPremium")}
                  </Label>
                  <Input
                    id="defaultRiskPremium"
                    type="number"
                    value={profile.default_risk_premium}
                    disabled={isLoading}
                    onChange={(event) =>
                      updateProfile(
                        "default_risk_premium",
                        Number(event.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("calculations.irrMethod")}</Label>
                <Select
                  value={profile.irr_method}
                  disabled={isLoading}
                  onValueChange={(value) =>
                    updateProfile(
                      "irr_method",
                      value as UserProfile["irr_method"],
                    )
                  }
                >
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

          <Card hidden>
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
                  <Select
                    value={profile.currency}
                    disabled={isLoading}
                    onValueChange={(value) => updateProfile("currency", value)}
                  >
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
                  <Select
                    value={profile.number_format}
                    disabled={isLoading}
                    onValueChange={(value) =>
                      updateProfile("number_format", value)
                    }
                  >
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
                <Select
                  value={profile.preferred_locale}
                  disabled={isLoading}
                  onValueChange={(value) =>
                    updateProfile("preferred_locale", value)
                  }
                >
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

        <div className="space-y-6">
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
                <Switch
                  checked={profile.email_notifications}
                  disabled={isLoading}
                  onCheckedChange={(checked) =>
                    updateProfile("email_notifications", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("notifications.projectUpdates")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.projectUpdatesHelp")}
                  </p>
                </div>
                <Switch
                  checked={profile.project_updates_notifications}
                  disabled={isLoading}
                  onCheckedChange={(checked) =>
                    updateProfile("project_updates_notifications", checked)
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>{t("notifications.weeklySummary")}</Label>
                  <p className="text-xs text-muted-foreground">
                    {t("notifications.weeklySummaryHelp")}
                  </p>
                </div>
                <Switch
                  checked={profile.weekly_summary_notifications}
                  disabled={isLoading}
                  onCheckedChange={(checked) =>
                    updateProfile("weekly_summary_notifications", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => void handleSave()} disabled={isSaving || isLoading}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? t("saving") ?? "Saving..." : t("save")}
        </Button>
      </div>
    </div>
  );
}
