import { useEffect, useState } from "react";
import { Link } from "react-router";
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Activity, Globe } from "lucide-react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { api } from "../lib/api";
import { LOCALE_TAG, useI18n } from "../i18n";

export function MarketOverviewPage() {
  const [data, setData] = useState<any>({ indices: [], intraday: [], topGainers: [], topLosers: [], sectors: [], signals: [] });
  const { t, locale } = useI18n();
  const localeTag = LOCALE_TAG[locale];

  useEffect(() => {
    api.get<any>("/market/overview").then(setData).catch(() => setData({ indices: [], intraday: [], topGainers: [], topLosers: [], sectors: [], signals: [] }));
  }, []);

  const indices = data.indices || [];
  const topGainers = data.topGainers || [];
  const topLosers = data.topLosers || [];
  const marketSectors = data.sectors || [];
  const aiSignals = data.signals || [];
  const indexData = data.intraday || [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2"><Globe className="w-5 h-5" />{t("market.indices")}</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {indices.map((index: any) => (
            <Card key={index.symbol}><CardContent className="p-4"><div className="flex items-start justify-between mb-2"><div><div className="text-sm text-muted-foreground">{index.name}</div><div className="text-2xl font-bold mt-1">{Number(index.value).toLocaleString(localeTag)}</div></div>{index.change >= 0 ? <TrendingUp className="w-5 h-5 text-success" /> : <TrendingDown className="w-5 h-5 text-destructive" />}</div><div className={`flex items-center gap-1 text-sm font-medium ${index.change >= 0 ? "text-success" : "text-destructive"}`}>{index.change >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}{index.change >= 0 ? "+" : ""}{Number(index.change).toFixed(2)} ({Number(index.changePercent).toFixed(2)}%)</div></CardContent></Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>{t("market.intraday")}</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={indexData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="time" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="spx" stroke="#0ea5e9" strokeWidth={2} dot={false} name="S&P 500" />
              <Line type="monotone" dataKey="ndx" stroke="#10b981" strokeWidth={2} dot={false} name="NASDAQ" />
              <Line type="monotone" dataKey="dji" stroke="#f59e0b" strokeWidth={2} dot={false} name="Dow Jones" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-success"><TrendingUp className="w-5 h-5" />{t("market.topGainers")}</CardTitle></CardHeader><CardContent><div className="space-y-3">{topGainers.map((stock: any) => <Link key={stock.symbol} to={`/asset/${stock.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"><div><div className="font-medium">{stock.symbol}</div><div className="text-sm text-muted-foreground">{stock.name}</div></div><div className="text-right"><div className="font-medium">${Number(stock.price).toFixed(2)}</div><div className="text-sm text-success flex items-center justify-end gap-1"><ArrowUpRight className="w-3 h-3" />+{Number(stock.change).toFixed(2)}%</div></div></Link>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2 text-destructive"><TrendingDown className="w-5 h-5" />{t("market.topLosers")}</CardTitle></CardHeader><CardContent><div className="space-y-3">{topLosers.map((stock: any) => <Link key={stock.symbol} to={`/asset/${stock.symbol}`} className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors"><div><div className="font-medium">{stock.symbol}</div><div className="text-sm text-muted-foreground">{stock.name}</div></div><div className="text-right"><div className="font-medium">${Number(stock.price).toFixed(2)}</div><div className="text-sm text-destructive flex items-center justify-end gap-1"><ArrowDownRight className="w-3 h-3" />{Number(stock.change).toFixed(2)}%</div></div></Link>)}</div></CardContent></Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>{t("market.sectorPerformance")}</CardTitle></CardHeader><CardContent><div className="space-y-3">{marketSectors.map((sector: any) => <div key={sector.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/50"><div className="flex items-center gap-3">{sector.trend === "up" ? <TrendingUp className="w-4 h-4 text-success" /> : <TrendingDown className="w-4 h-4 text-destructive" />}<span className="font-medium">{sector.name}</span></div><div className={`font-medium ${sector.change >= 0 ? "text-success" : "text-destructive"}`}>{sector.change >= 0 ? "+" : ""}{Number(sector.change).toFixed(2)}%</div></div>)}</div></CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Activity className="w-5 h-5 text-primary" />{t("market.aiSignals")}</CardTitle></CardHeader><CardContent className="space-y-4">{aiSignals.map((signal: any, index: number) => <div key={index} className="p-4 rounded-lg border border-border bg-accent/50 space-y-2"><div className="flex items-start justify-between"><h4 className="font-medium">{signal.title}</h4><Badge variant={signal.signal === "Bullish" ? "default" : signal.signal === "Bearish" ? "destructive" : "secondary"}>{signal.signal}</Badge></div><p className="text-sm text-muted-foreground">{signal.description}</p><div className="text-xs">{t("market.confidence", { value: signal.confidence })}</div></div>)}</CardContent></Card>
      </div>
    </div>
  );
}
