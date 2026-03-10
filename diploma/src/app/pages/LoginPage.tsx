import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { TrendingUp, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { api } from "../lib/api";
import { setSession } from "../lib/auth";
import { useI18n } from "../i18n";

interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const path = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin ? { email, password } : { name, email, password };
      const data = await api.post<AuthResponse>(path, payload);
      setSession(data);
      navigate(isLogin ? "/dashboard" : "/onboarding");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("login.authFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-foreground flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-background" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">InvestAI</h1>
              <p className="text-sm text-muted-foreground">{t("login.subtitle")}</p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-bold">{isLogin ? t("login.welcomeBack") : t("login.getStarted")}</h2>
            <p className="text-muted-foreground mt-2">
              {isLogin ? t("login.loginPrompt") : t("login.registerPrompt")}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">{t("login.fullName")}</Label>
                <Input id="name" placeholder={t("login.fullNamePlaceholder")} required value={name} onChange={(e) => setName(e.target.value)} />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">{t("login.password")}</Label>
                {isLogin && (
                  <Link to="#" className="text-sm text-primary hover:underline">
                    {t("login.forgotPassword")}
                  </Link>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="pl-10 pr-10"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? t("login.pleaseWait") : isLogin ? t("login.signIn") : t("login.createAccount")}
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-background text-muted-foreground">{t("login.orContinueWith")}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" type="button">Google</Button>
            <Button variant="outline" type="button">GitHub</Button>
          </div>

          <div className="text-center text-sm">
            <span className="text-muted-foreground">{isLogin ? t("login.noAccount") : t("login.haveAccount")}</span>
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-primary hover:underline font-medium">
              {isLogin ? t("login.register") : t("login.signInLink")}
            </button>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-primary via-blue-600 to-blue-700 p-12 items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/10" />
        <div className="relative z-10 max-w-lg text-white space-y-6">
          <h2 className="text-4xl font-bold">{t("login.heroTitle")}</h2>
          <p className="text-lg text-blue-100">{t("login.heroDesc")}</p>
        </div>
      </div>
    </div>
  );
}
