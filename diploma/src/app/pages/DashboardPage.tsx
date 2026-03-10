import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  TrendingUp,
  DollarSign,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { api } from "../lib/api";
import { LOCALE_TAG, useI18n } from "../i18n";

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const { t, locale } = useI18n();
  const localeTag = LOCALE_TAG[locale];

  useEffect(() => {
    api.get<any>("/dashboard").then(setData).catch(() => setData({ summary: {}, performance: [], allocation: [], insights: [], topHoldings: [] }));
  }, []);

  const summary = data?.summary || {};
  const portfolioData = data?.performance || [];
  const allocationData = data?.allocation || [];
  const aiInsights = data?.insights || [];
  const topHoldings = data?.topHoldings || [];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.totalValue")}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${Number(summary.totalValue || 0).toLocaleString(localeTag)}</div>
            <div className="flex items-center text-sm mt-1">
              <TrendingUp className="w-4 h-4 text-success mr-1" />
              <span className="text-success font-medium">+${Number(summary.totalGain || 0).toLocaleString(localeTag)}</span>
              <span className="text-muted-foreground ml-1">({Number(summary.gainPercent || 0).toFixed(2)}%)</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.todayChange")}</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">${Number(summary.dayChange || 0).toLocaleString(localeTag)}</div>
            <div className="flex items-center text-sm mt-1">
              <ArrowUpRight className="w-4 h-4 text-success mr-1" />
              <span className="text-success font-medium">{Number(summary.dayChangePercent || 0).toFixed(2)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.aiConfidence")}</CardTitle>
            <Sparkles className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.aiConfidence || 0}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t("dashboard.activePositions")}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.activePositions || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>{t("dashboard.portfolioTrend")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={portfolioData.map((p: any) => ({ date: p.label || p.date, value: p.value }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" opacity={0.5} />
                <XAxis dataKey="date" stroke="#737373" />
                <YAxis stroke="#737373" />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#0a0a0a" strokeWidth={2} fill="rgba(14,165,233,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>{t("dashboard.assetAllocation")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={allocationData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {allocationData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />{t("dashboard.aiInsights")}</CardTitle>
              <Link to="/ai-assistant"><Button variant="ghost" size="sm">{t("common.all")}</Button></Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {aiInsights.map((insight: any, index: number) => (
              <div key={index} className="p-4 rounded-lg border border-border bg-accent/50 space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {insight.type === "alert" && <AlertCircle className="w-4 h-4 text-warning" />}
                    <h4 className="font-medium text-sm">{insight.title}</h4>
                  </div>
                  <Badge variant="secondary" className="text-xs">{insight.confidence}%</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{insight.description}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t("dashboard.topHoldings")}</CardTitle>
              <Link to="/portfolio"><Button variant="ghost" size="sm">{t("common.all")}</Button></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topHoldings.map((holding: any) => (
                <Link key={holding.symbol} to={`/asset/${holding.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors">
                  <div>
                    <div className="font-medium">{holding.symbol}</div>
                    <div className="text-sm text-muted-foreground">{Number(holding.shares || 0).toFixed(2)} {t("common.sharesShort")}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">${Number(holding.value || 0).toLocaleString(localeTag)}</div>
                    <div className={`text-sm flex items-center justify-end gap-1 ${Number(holding.change || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                      {Number(holding.change || 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {Math.abs(Number(holding.change || 0)).toFixed(2)}%
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
