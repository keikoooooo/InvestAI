import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Slider } from "../components/ui/slider";
import { api } from "../lib/api";
import { LOCALE_TAG, useI18n } from "../i18n";

interface OnboardingData {
  riskTolerance: string;
  investmentGoal: string;
  experienceLevel: string;
  investmentHorizon: string;
  initialInvestment: number;
}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const localeTag = LOCALE_TAG[locale];
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    riskTolerance: "moderate",
    investmentGoal: "growth",
    experienceLevel: "intermediate",
    investmentHorizon: "medium",
    initialInvestment: [10000],
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get<OnboardingData>("/onboarding");
        setFormData({
          riskTolerance: data.riskTolerance || "moderate",
          investmentGoal: data.investmentGoal || "growth",
          experienceLevel: data.experienceLevel || "intermediate",
          investmentHorizon: data.investmentHorizon || "medium",
          initialInvestment: [data.initialInvestment || 10000],
        });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
      return;
    }

    setSaving(true);
    try {
      await api.put("/onboarding", {
        riskTolerance: formData.riskTolerance,
        investmentGoal: formData.investmentGoal,
        experienceLevel: formData.experienceLevel,
        investmentHorizon: formData.investmentHorizon,
        initialInvestment: formData.initialInvestment[0],
      });
      navigate("/dashboard");
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">{t("common.loading")}</div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-foreground flex items-center justify-center">
              <TrendingUp className="w-9 h-9 text-background" />
            </div>
          </div>
          <h1 className="text-3xl font-bold mb-2">{t("onboarding.title")}</h1>
          <p className="text-muted-foreground">{t("onboarding.subtitle")}</p>
        </div>

        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className={`flex-1 h-2 rounded-full mx-1 transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
            ))}
          </div>
          <p className="text-sm text-muted-foreground text-center">{t("onboarding.stepOf", { step, total: 4 })}</p>
        </div>

        <div className="bg-card rounded-2xl shadow-lg p-8 mb-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-semibold mb-2">{t("onboarding.riskTitle")}</h2>
                <p className="text-muted-foreground">{t("onboarding.riskDesc")}</p>
              </div>
              <RadioGroup value={formData.riskTolerance} onValueChange={(value) => setFormData({ ...formData, riskTolerance: value })}>
                <div className="space-y-3">
                  {[{ value: "conservative", label: t("onboarding.risk.conservative.label"), description: t("onboarding.risk.conservative.desc") }, { value: "moderate", label: t("onboarding.risk.moderate.label"), description: t("onboarding.risk.moderate.desc") }, { value: "aggressive", label: t("onboarding.risk.aggressive.label"), description: t("onboarding.risk.aggressive.desc") }].map((option) => (
                    <label key={option.value} className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.riskTolerance === option.value ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <div className="flex-1"><div className="font-medium">{option.label}</div><div className="text-sm text-muted-foreground">{option.description}</div></div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">{t("onboarding.goalTitle")}</h2>
              <RadioGroup value={formData.investmentGoal} onValueChange={(value) => setFormData({ ...formData, investmentGoal: value })}>
                <div className="space-y-3">
                  {[{ value: "income", label: t("onboarding.goal.income") }, { value: "growth", label: t("onboarding.goal.growth") }, { value: "preservation", label: t("onboarding.goal.preservation") }, { value: "balanced", label: t("onboarding.goal.balanced") }].map((option) => (
                    <label key={option.value} className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.investmentGoal === option.value ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <div className="font-medium">{option.label}</div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">{t("onboarding.experienceTitle")}</h2>
              <RadioGroup value={formData.experienceLevel} onValueChange={(value) => setFormData({ ...formData, experienceLevel: value })}>
                <div className="space-y-3">
                  {[{ value: "beginner", label: t("onboarding.experience.beginner") }, { value: "intermediate", label: t("onboarding.experience.intermediate") }, { value: "advanced", label: t("onboarding.experience.advanced") }].map((option) => (
                    <label key={option.value} className={`flex items-start space-x-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${formData.experienceLevel === option.value ? "border-primary bg-accent" : "border-border hover:border-primary/50"}`}>
                      <RadioGroupItem value={option.value} className="mt-1" />
                      <div className="font-medium">{option.label}</div>
                    </label>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-2">{t("onboarding.initialInvestmentTitle")}</h2>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-4"><Label>{t("onboarding.amount")}</Label><span className="text-2xl font-bold text-primary">${formData.initialInvestment[0].toLocaleString(localeTag)}</span></div>
                  <Slider value={formData.initialInvestment} onValueChange={(value) => setFormData({ ...formData, initialInvestment: value })} min={1000} max={100000} step={1000} className="w-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          {step > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" />{t("common.back")}
            </Button>
          )}
          <Button onClick={handleNext} className="flex-1 flex items-center justify-center gap-2" size="lg" disabled={saving}>
            {step === 4 ? (saving ? t("common.saving") : t("onboarding.finish")) : t("common.continue")}
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
