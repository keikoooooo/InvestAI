import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight, ArrowDownRight, Search, Filter, Download } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api } from "../lib/api";
import { LOCALE_TAG, useI18n } from "../i18n";

export function PortfolioPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [data, setData] = useState<any>({ summary: {}, performance: [], holdings: [] });
  const { t, locale } = useI18n();
  const localeTag = LOCALE_TAG[locale];

  useEffect(() => {
    api.get<any>("/portfolio").then(setData).catch(() => setData({ summary: {}, performance: [], holdings: [] }));
  }, []);

  useEffect(() => {
    api
      .get<any>(`/portfolio/holdings?search=${encodeURIComponent(searchQuery)}&type=${encodeURIComponent(filterType)}`)
      .then((res) => setData((prev: any) => ({ ...prev, holdings: res.holdings || [] })))
      .catch(() => {});
  }, [searchQuery, filterType]);

  const holdings = data.holdings || [];
  const totalValue = Number(data.summary?.totalValue || 0);
  const totalGain = Number(data.summary?.totalGain || 0);
  const totalGainPercent = Number(data.summary?.totalGainPercent || 0);

  const withMetrics = useMemo(() => {
    return holdings.map((h: any) => {
      const totalValueLocal = Number(h.quantity) * Number(h.currentPrice);
      const gain = (Number(h.currentPrice) - Number(h.avgPrice)) * Number(h.quantity);
      const gainPercent = Number(h.avgPrice) === 0 ? 0 : ((Number(h.currentPrice) - Number(h.avgPrice)) / Number(h.avgPrice)) * 100;
      return { ...h, totalValue: totalValueLocal, gain, gainPercent, allocation: totalValue ? (totalValueLocal / totalValue) * 100 : 0 };
    });
  }, [holdings, totalValue]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{t("portfolio.totalValue")}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">${totalValue.toLocaleString(localeTag)}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{t("portfolio.totalGainLoss")}</CardTitle></CardHeader><CardContent><div className={`text-3xl font-bold ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>{totalGain >= 0 ? "+" : ""}${totalGain.toLocaleString(localeTag)}</div><div className={`flex items-center gap-1 text-sm mt-1 ${totalGain >= 0 ? "text-success" : "text-destructive"}`}>{totalGain >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}{totalGainPercent.toFixed(2)}%</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{t("portfolio.assetCount")}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{holdings.length}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("portfolio.performance")}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={(data.performance || []).map((p: any) => ({ month: p.label || p.month, value: p.value }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="month" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#0ea5e9" strokeWidth={2} dot={{ fill: "#0ea5e9", r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <CardTitle>{t("portfolio.assets")}</CardTitle>
            <div className="flex gap-2"><Button variant="outline" size="sm"><Filter className="w-4 h-4 mr-2" />{t("portfolio.filter")}</Button><Button variant="outline" size="sm"><Download className="w-4 h-4 mr-2" />{t("portfolio.export")}</Button></div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t("portfolio.searchPlaceholder")} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Tabs value={filterType} onValueChange={setFilterType} className="w-auto"><TabsList><TabsTrigger value="all">{t("portfolio.tab.all")}</TabsTrigger><TabsTrigger value="stock">{t("portfolio.tab.stock")}</TabsTrigger><TabsTrigger value="bond">{t("portfolio.tab.bond")}</TabsTrigger><TabsTrigger value="crypto">{t("portfolio.tab.crypto")}</TabsTrigger></TabsList></Tabs>
          </div>

          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full"><thead><tr className="border-b border-border"><th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.asset")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.quantity")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.avgPrice")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.currentPrice")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.totalValue")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.pl")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.allocation")}</th><th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">{t("portfolio.table.action")}</th></tr></thead>
              <tbody>
                {withMetrics.map((holding: any) => (
                  <tr key={holding.symbol} className="border-b border-border hover:bg-accent/50 transition-colors">
                    <td className="py-4 px-2"><div className="font-medium">{holding.symbol}</div><div className="text-sm text-muted-foreground">{holding.name}</div></td>
                    <td className="py-4 px-2 text-right">{Number(holding.quantity).toFixed(4)}</td>
                    <td className="py-4 px-2 text-right">${Number(holding.avgPrice).toFixed(2)}</td>
                    <td className="py-4 px-2 text-right">${Number(holding.currentPrice).toFixed(2)}</td>
                    <td className="py-4 px-2 text-right font-medium">${holding.totalValue.toLocaleString(localeTag)}</td>
                    <td className={`py-4 px-2 text-right ${holding.gain >= 0 ? "text-success" : "text-destructive"}`}>{holding.gain >= 0 ? "+" : ""}${Math.abs(holding.gain).toLocaleString(localeTag)} ({Math.abs(holding.gainPercent).toFixed(2)}%)</td>
                    <td className="py-4 px-2 text-right"><Badge variant="secondary">{holding.allocation.toFixed(1)}%</Badge></td>
                    <td className="py-4 px-2 text-right"><Link to={`/asset/${holding.symbol}`}><Button variant="ghost" size="sm">{t("common.view")}</Button></Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
