import { Outlet, Link, useLocation } from "react-router";
import {
  LayoutDashboard,
  Briefcase,
  TrendingUp,
  MessageSquare,
  Settings,
  Moon,
  Sun,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useState } from "react";
import { Button } from "../ui/button";
import { clearSession } from "../../lib/auth";
import { useI18n } from "../../i18n";

export function RootLayout() {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const { t } = useI18n();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: t("nav.dashboard") },
    { to: "/portfolio", icon: Briefcase, label: t("nav.portfolio") },
    { to: "/market", icon: TrendingUp, label: t("nav.market") },
    { to: "/ai-assistant", icon: MessageSquare, label: t("nav.aiAssistant") },
    { to: "/settings", icon: Settings, label: t("nav.settings") },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border
        transform transition-transform duration-300 lg:translate-x-0 lg:static
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-foreground flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-background" />
              </div>
              <span className="text-lg font-semibold">InvestAI</span>
            </div>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = location.pathname === item.to;
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  onClick={() => setSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                    ${isActive ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border space-y-2">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? (
                <>
                  <Sun className="w-5 h-5" />
                  <span>{t("theme.light")}</span>
                </>
              ) : (
                <>
                  <Moon className="w-5 h-5" />
                  <span>{t("theme.dark")}</span>
                </>
              )}
            </Button>
            <Link to="/">
              <Button onClick={() => clearSession()} variant="ghost" className="w-full justify-start gap-3 text-destructive hover:text-destructive">
                <LogOut className="w-5 h-5" />
                <span>{t("nav.logout")}</span>
              </Button>
            </Link>
          </div>
        </div>
      </aside>

      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex-1 lg:ml-0 ml-4">
            <h1 className="text-xl font-semibold">{navItems.find((nav) => nav.to === location.pathname)?.label || "InvestAI"}</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg bg-accent">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-sm text-muted-foreground">{t("header.marketsOpen")}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
