import { useEffect, useState } from "react";
import { User, Bell, Shield, Palette, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Switch } from "../components/ui/switch";
import { Slider } from "../components/ui/slider";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Separator } from "../components/ui/separator";
import { api } from "../lib/api";
import { Locale, useI18n } from "../i18n";

export function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    api.get<any>("/settings").then((res) => setSettings(res)).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const updated = await api.put<any>("/settings", settings);
      setSettings(updated);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">{t("settings.title")}</h1>
        <p className="text-muted-foreground mt-1">{t("settings.subtitle")}</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile">{t("settings.tab.profile")}</TabsTrigger>
          <TabsTrigger value="investment">{t("settings.tab.investment")}</TabsTrigger>
          <TabsTrigger value="notifications">{t("settings.tab.notifications")}</TabsTrigger>
          <TabsTrigger value="security">{t("settings.tab.security")}</TabsTrigger>
          <TabsTrigger value="preferences">{t("settings.tab.preferences")}</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="w-5 h-5" />{t("settings.personalInfo")}</CardTitle>
              <CardDescription>{t("settings.personalInfoDesc")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2"><Label htmlFor="firstName">{t("settings.firstName")}</Label><Input id="firstName" value={settings.firstName || ""} onChange={(e) => setSettings({ ...settings, firstName: e.target.value })} /></div>
                <div className="space-y-2"><Label htmlFor="lastName">{t("settings.lastName")}</Label><Input id="lastName" value={settings.lastName || ""} onChange={(e) => setSettings({ ...settings, lastName: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label htmlFor="email">{t("settings.email")}</Label><Input id="email" type="email" value={settings.email || ""} onChange={(e) => setSettings({ ...settings, email: e.target.value })} /></div>
              <div className="space-y-2"><Label htmlFor="phone">{t("settings.phone")}</Label><Input id="phone" type="tel" value={settings.phone || ""} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} /></div>
              <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("settings.saveChanges")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="investment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5" />{t("settings.riskProfile")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between"><Label>{t("settings.riskTolerance")}</Label><span className="text-sm font-medium text-primary">{settings.riskTolerance}</span></div>
                <Slider value={[settings.riskTolerance || 5]} onValueChange={(v) => setSettings({ ...settings, riskTolerance: v[0] })} min={1} max={10} step={1} className="w-full" />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>{t("settings.investmentGoals")}</Label>
                <RadioGroup value={settings.investmentGoal || "growth"} onValueChange={(v) => setSettings({ ...settings, investmentGoal: v })}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border"><RadioGroupItem value="income" id="income" /><Label htmlFor="income" className="flex-1 cursor-pointer">{t("settings.goal.income")}</Label></div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border"><RadioGroupItem value="growth" id="growth" /><Label htmlFor="growth" className="flex-1 cursor-pointer">{t("settings.goal.growth")}</Label></div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border"><RadioGroupItem value="balanced" id="balanced" /><Label htmlFor="balanced" className="flex-1 cursor-pointer">{t("settings.goal.balanced")}</Label></div>
                </RadioGroup>
              </div>
              <Button className="w-full" onClick={save} disabled={saving}>{saving ? t("common.saving") : t("settings.updateInvestmentProfile")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="w-5 h-5" />{t("settings.notificationsTitle")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.priceAlerts")}</div></div><Switch checked={!!settings.notificationPriceAlerts} onCheckedChange={(v) => setSettings({ ...settings, notificationPriceAlerts: v })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.aiRecommendations")}</div></div><Switch checked={!!settings.notificationAIRecommendations} onCheckedChange={(v) => setSettings({ ...settings, notificationAIRecommendations: v })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.portfolioUpdates")}</div></div><Switch checked={!!settings.notificationPortfolioUpdates} onCheckedChange={(v) => setSettings({ ...settings, notificationPortfolioUpdates: v })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.marketNews")}</div></div><Switch checked={!!settings.notificationMarketNews} onCheckedChange={(v) => setSettings({ ...settings, notificationMarketNews: v })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.weeklyReports")}</div></div><Switch checked={!!settings.notificationWeeklyReports} onCheckedChange={(v) => setSettings({ ...settings, notificationWeeklyReports: v })} /></div>
              <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card><CardHeader><CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" />{t("settings.securityTitle")}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">{t("settings.securityNote")}</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Palette className="w-5 h-5" />{t("settings.displayPreferences")}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4"><Label>{t("settings.currency")}</Label><RadioGroup value={settings.currency || "usd"} onValueChange={(v) => setSettings({ ...settings, currency: v })}><div className="flex items-center space-x-2"><RadioGroupItem value="usd" id="usd" /><Label htmlFor="usd">USD ($)</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="eur" id="eur" /><Label htmlFor="eur">EUR (€)</Label></div><div className="flex items-center space-x-2"><RadioGroupItem value="gbp" id="gbp" /><Label htmlFor="gbp">GBP (£)</Label></div></RadioGroup></div>
              <Separator />
              <div className="space-y-2">
                <Label>{t("settings.language")}</Label>
                <RadioGroup value={locale} onValueChange={(v) => setLocale(v as Locale)}>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="ru" id="lang-ru" /><Label htmlFor="lang-ru">{t("settings.lang.ru")}</Label></div>
                  <div className="flex items-center space-x-2"><RadioGroupItem value="en" id="lang-en" /><Label htmlFor="lang-en">{t("settings.lang.en")}</Label></div>
                </RadioGroup>
              </div>
              <Separator />
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.compactView")}</div></div><Switch checked={!!settings.compactView} onCheckedChange={(v) => setSettings({ ...settings, compactView: v })} /></div>
              <Separator />
              <div className="flex items-center justify-between"><div><div className="font-medium">{t("settings.showPercentages")}</div></div><Switch checked={!!settings.showPercentages} onCheckedChange={(v) => setSettings({ ...settings, showPercentages: v })} /></div>
              <Button onClick={save} disabled={saving}>{saving ? t("common.saving") : t("common.save")}</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
