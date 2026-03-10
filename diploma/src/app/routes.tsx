import { createBrowserRouter } from "react-router";
import { RootLayout } from "./components/layout/RootLayout";
import { LoginPage } from "./pages/LoginPage";
import { OnboardingPage } from "./pages/OnboardingPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PortfolioPage } from "./pages/PortfolioPage";
import { AssetAnalysisPage } from "./pages/AssetAnalysisPage";
import { AIAssistantPage } from "./pages/AIAssistantPage";
import { MarketOverviewPage } from "./pages/MarketOverviewPage";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/onboarding",
    element: <OnboardingPage />,
  },
  {
    element: <RootLayout />,
    children: [
      {
        path: "/dashboard",
        element: <DashboardPage />,
      },
      {
        path: "/portfolio",
        element: <PortfolioPage />,
      },
      {
        path: "/asset/:symbol",
        element: <AssetAnalysisPage />,
      },
      {
        path: "/ai-assistant",
        element: <AIAssistantPage />,
      },
      {
        path: "/market",
        element: <MarketOverviewPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
  },
]);
