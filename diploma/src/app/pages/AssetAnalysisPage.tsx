import { useEffect, useState } from "react";
import { useParams } from "react-router";
import { ArrowUpRight, ArrowDownRight, Activity, DollarSign, BarChart3, Sparkles, AlertTriangle } from "lucide-react";
import { ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "../components/ui/tabs";
import { api } from "../lib/api";
import { useI18n } from "../i18n";

export function AssetAnalysisPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [asset, setAsset] = useState<any>(null);
  const { t } = useI18n();

  useEffect(() => {
    if (!symbol) return;
    api.get<any>(`/assets/${symbol}`).then(setAsset).catch(() => setAsset(null));
  }, [symbol]);

  if (!asset) {
    return <div>{t("common.loading")}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><span className="text-lg font-bold text-primary">{asset.symbol.slice(0, 2)}</span></div>
            <div><h1 className="text-3xl font-bold">{asset.symbol}</h1><p className="text-muted-foreground">{asset.name}</p></div>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold">${Number(asset.price).toFixed(2)}</span>
            <div className={`flex items-center gap-1 text-lg font-medium ${asset.change >= 0 ? "text-success" : "text-destructive"}`}>
              {asset.change >= 0 ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              {asset.change >= 0 ? "+" : ""}${Number(asset.change).toFixed(2)} ({Number(asset.changePercent).toFixed(2)}%)
            </div>
          </div>
        </div>
        <div className="flex gap-2"><Button variant="outline">{t("asset.addToWatchlist")}</Button><Button>{t("asset.trade")}</Button></div>
      </div>

      <Card className="bg-gradient-to-br from-primary/5 to-blue-600/5 border-primary/20">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="w-5 h-5 text-primary" />{t("asset.aiRecommendation")}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant="default" className="text-lg px-4 py-1">{asset.recommendation}</Badge>
            <div className="text-2xl font-bold text-primary">{asset.confidence}%</div>
          </div>
          <ul className="space-y-2">{(asset.reasoning || []).map((reason: string, index: number) => <li key={index} className="text-sm">• {reason}</li>)}</ul>
          {(asset.riskFactors || []).length > 0 && <div><h4 className="font-medium mb-2 flex items-center gap-2 text-warning"><AlertTriangle className="w-4 h-4" />{t("asset.riskFactors")}</h4><ul className="space-y-2">{asset.riskFactors.map((risk: string, index: number) => <li key={index} className="text-sm">• {risk}</li>)}</ul></div>}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" />{t("asset.volume")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{(Number(asset.volume) / 1_000_000).toFixed(1)}M</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" />{t("asset.marketCap")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">${asset.marketCap}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4" />{t("asset.peRatio")}</CardTitle></CardHeader><CardContent><div className="text-xl font-bold">{asset.pe || "-"}</div></CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{t("asset.range52w")}</CardTitle></CardHeader><CardContent><div className="text-sm">${Number(asset.low52w).toFixed(2)} - ${Number(asset.high52w).toFixed(2)}</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><div className="flex items-center justify-between"><CardTitle>{t("asset.priceChart")}</CardTitle><Tabs defaultValue="1M"><TabsList><TabsTrigger value="1M">1M</TabsTrigger></TabsList></Tabs></div></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={asset.history || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Area type="monotone" dataKey="price" stroke="#0ea5e9" strokeWidth={2} fill="rgba(14,165,233,0.2)" />
              <Line type="monotone" dataKey="ma20" stroke="#10b981" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
              <Line type="monotone" dataKey="ma50" stroke="#f59e0b" strokeWidth={1.5} dot={false} strokeDasharray="5 5" />
            </ComposedChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle>{t("asset.volume")}</CardTitle></CardHeader><CardContent><ResponsiveContainer width="100%" height={200}><BarChart data={asset.history || []}><CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} /><XAxis dataKey="date" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip /><Bar dataKey="volume" fill="#0ea5e9" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></CardContent></Card>
        <Card><CardHeader><CardTitle>{t("asset.technicalIndicators")}</CardTitle></CardHeader><CardContent><div className="space-y-4">{(asset.indicators || []).map((indicator: any) => <div key={indicator.name} className="flex items-center justify-between p-3 rounded-lg bg-accent/50"><div><div className="font-medium">{indicator.name}</div><div className="text-sm text-muted-foreground">{t("asset.value", { value: String(indicator.value) })}</div></div><Badge variant="secondary" className={indicator.color}>{indicator.signal}</Badge></div>)}</div></CardContent></Card>
      </div>
    </div>
  );
}
