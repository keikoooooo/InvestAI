import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Locale = "ru" | "en";

export const LOCALE_TAG: Record<Locale, string> = {
  ru: "ru-RU",
  en: "en-US",
};

type Messages = Record<string, string>;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const MESSAGES: Record<Locale, Messages> = {
  ru: {
    "nav.dashboard": "Панель управления",
    "nav.portfolio": "Портфель",
    "nav.market": "Обзор рынка",
    "nav.aiAssistant": "AI Ассистент",
    "nav.settings": "Настройки",
    "nav.logout": "Выход",
    "theme.light": "Светлая тема",
    "theme.dark": "Темная тема",
    "header.marketsOpen": "Рынки открыты",

    "common.loading": "Загрузка...",
    "common.saving": "Сохранение...",
    "common.save": "Сохранить",
    "common.all": "Все",
    "common.back": "Назад",
    "common.continue": "Продолжить",
    "common.view": "Просмотр",
    "common.sharesShort": "шт",

    "login.subtitle": "AI-ассистент для инвестиций",
    "login.welcomeBack": "С возвращением",
    "login.getStarted": "Начните сейчас",
    "login.loginPrompt": "Войдите в свой аккаунт, чтобы продолжить",
    "login.registerPrompt": "Создайте аккаунт и инвестируйте с умом",
    "login.fullName": "Полное имя",
    "login.fullNamePlaceholder": "Иван Иванов",
    "login.password": "Пароль",
    "login.forgotPassword": "Забыли пароль?",
    "login.pleaseWait": "Подождите...",
    "login.signIn": "Войти",
    "login.createAccount": "Создать аккаунт",
    "login.orContinueWith": "Или продолжить с",
    "login.noAccount": "Нет аккаунта? ",
    "login.haveAccount": "Уже есть аккаунт? ",
    "login.register": "Регистрация",
    "login.signInLink": "Войти",
    "login.heroTitle": "Инвестируйте с умом, используя AI-аналитику",
    "login.heroDesc": "Получайте анализ рынка в реальном времени, персональные рекомендации и оптимизацию портфеля с помощью продвинутых алгоритмов искусственного интеллекта.",
    "login.authFailed": "Ошибка авторизации",

    "onboarding.title": "Давайте персонализируем ваш опыт",
    "onboarding.subtitle": "Помогите нам понять ваши инвестиционные цели и предпочтения",
    "onboarding.stepOf": "Шаг {step} из {total}",
    "onboarding.riskTitle": "Какова ваша толерантность к риску?",
    "onboarding.riskDesc": "Это поможет нам рекомендовать подходящие инвестиционные стратегии",
    "onboarding.risk.conservative.label": "Консервативная",
    "onboarding.risk.conservative.desc": "Минимизация рисков",
    "onboarding.risk.moderate.label": "Умеренная",
    "onboarding.risk.moderate.desc": "Сбалансированный риск",
    "onboarding.risk.aggressive.label": "Агрессивная",
    "onboarding.risk.aggressive.desc": "Высокий риск",
    "onboarding.goalTitle": "Какова ваша основная инвестиционная цель?",
    "onboarding.goal.income": "Генерация дохода",
    "onboarding.goal.growth": "Рост капитала",
    "onboarding.goal.preservation": "Сохранение капитала",
    "onboarding.goal.balanced": "Сбалансированный подход",
    "onboarding.experienceTitle": "Каков ваш инвестиционный опыт?",
    "onboarding.experience.beginner": "Начинающий",
    "onboarding.experience.intermediate": "Средний",
    "onboarding.experience.advanced": "Продвинутый",
    "onboarding.initialInvestmentTitle": "Начальная сумма инвестиций",
    "onboarding.amount": "Сумма",
    "onboarding.finish": "Завершить настройку",

    "dashboard.totalValue": "Общая стоимость портфеля",
    "dashboard.todayChange": "Изменение за сегодня",
    "dashboard.aiConfidence": "Уровень уверенности AI",
    "dashboard.activePositions": "Активные позиции",
    "dashboard.portfolioTrend": "Динамика портфеля",
    "dashboard.assetAllocation": "Распределение активов",
    "dashboard.aiInsights": "AI аналитика",
    "dashboard.topHoldings": "Топ активов",

    "portfolio.totalValue": "Общая стоимость",
    "portfolio.totalGainLoss": "Общая прибыль/убыток",
    "portfolio.assetCount": "Количество активов",
    "portfolio.performance": "Динамика",
    "portfolio.assets": "Активы",
    "portfolio.filter": "Фильтр",
    "portfolio.export": "Экспорт",
    "portfolio.searchPlaceholder": "Поиск активов...",
    "portfolio.tab.all": "Все",
    "portfolio.tab.stock": "Акции",
    "portfolio.tab.bond": "Облигации",
    "portfolio.tab.crypto": "Крипто",
    "portfolio.table.asset": "Актив",
    "portfolio.table.quantity": "Количество",
    "portfolio.table.avgPrice": "Средняя цена",
    "portfolio.table.currentPrice": "Текущая цена",
    "portfolio.table.totalValue": "Общая стоимость",
    "portfolio.table.pl": "P/L",
    "portfolio.table.allocation": "Доля",
    "portfolio.table.action": "Действие",

    "market.indices": "Индексы рынка",
    "market.intraday": "Внутридневная динамика",
    "market.topGainers": "Лидеры роста",
    "market.topLosers": "Лидеры падения",
    "market.sectorPerformance": "Динамика секторов",
    "market.aiSignals": "AI сигналы рынка",
    "market.confidence": "Уверенность: {value}%",

    "asset.addToWatchlist": "Добавить в избранное",
    "asset.trade": "Торговать",
    "asset.aiRecommendation": "AI рекомендация",
    "asset.riskFactors": "Факторы риска",
    "asset.volume": "Объем",
    "asset.marketCap": "Рыночная капитализация",
    "asset.peRatio": "P/E коэффициент",
    "asset.range52w": "Диапазон 52 недель",
    "asset.priceChart": "График цены",
    "asset.technicalIndicators": "Технические индикаторы",
    "asset.value": "Значение: {value}",

    "ai.title": "AI инвестиционный ассистент",
    "ai.subtitle": "Персональные инсайты и рекомендации",
    "ai.suggest.q1": "Каков прогноз по техсектору?",
    "ai.suggest.q2": "Стоит ли ребалансировать портфель?",
    "ai.suggest.q3": "Проанализируй мой риск",
    "ai.suggest.q4": "Какие возможности сейчас лучшие?",
    "ai.inputPlaceholder": "Спросите что угодно об инвестициях...",
    "ai.disclaimer": "AI-совет. Всегда проверяйте информацию перед инвестированием.",

    "settings.title": "Настройки",
    "settings.subtitle": "Управляйте аккаунтом и предпочтениями",
    "settings.tab.profile": "Профиль",
    "settings.tab.investment": "Инвестиции",
    "settings.tab.notifications": "Уведомления",
    "settings.tab.security": "Безопасность",
    "settings.tab.preferences": "Предпочтения",
    "settings.personalInfo": "Личные данные",
    "settings.personalInfoDesc": "Обновите личную информацию",
    "settings.firstName": "Имя",
    "settings.lastName": "Фамилия",
    "settings.email": "Email",
    "settings.phone": "Телефон",
    "settings.saveChanges": "Сохранить изменения",
    "settings.riskProfile": "Профиль риска",
    "settings.riskTolerance": "Толерантность к риску",
    "settings.investmentGoals": "Инвестиционные цели",
    "settings.goal.income": "Генерация дохода",
    "settings.goal.growth": "Рост капитала",
    "settings.goal.balanced": "Сбалансированный подход",
    "settings.updateInvestmentProfile": "Обновить профиль инвестиций",
    "settings.notificationsTitle": "Настройки уведомлений",
    "settings.priceAlerts": "Ценовые оповещения",
    "settings.aiRecommendations": "AI рекомендации",
    "settings.portfolioUpdates": "Обновления портфеля",
    "settings.marketNews": "Новости рынка",
    "settings.weeklyReports": "Еженедельные отчеты",
    "settings.securityTitle": "Настройки безопасности",
    "settings.securityNote": "Пароль и 2FA можно вынести в отдельный auth-модуль.",
    "settings.displayPreferences": "Параметры отображения",
    "settings.currency": "Валюта",
    "settings.compactView": "Компактный вид",
    "settings.showPercentages": "Показывать проценты",
    "settings.language": "Язык интерфейса",
    "settings.lang.ru": "Русский",
    "settings.lang.en": "English",
  },
  en: {
    "nav.dashboard": "Dashboard",
    "nav.portfolio": "Portfolio",
    "nav.market": "Market Overview",
    "nav.aiAssistant": "AI Assistant",
    "nav.settings": "Settings",
    "nav.logout": "Log out",
    "theme.light": "Light theme",
    "theme.dark": "Dark theme",
    "header.marketsOpen": "Markets open",

    "common.loading": "Loading...",
    "common.saving": "Saving...",
    "common.save": "Save",
    "common.all": "All",
    "common.back": "Back",
    "common.continue": "Continue",
    "common.view": "View",
    "common.sharesShort": "sh",

    "login.subtitle": "AI assistant for investing",
    "login.welcomeBack": "Welcome back",
    "login.getStarted": "Get started",
    "login.loginPrompt": "Sign in to continue",
    "login.registerPrompt": "Create an account and invest smarter",
    "login.fullName": "Full name",
    "login.fullNamePlaceholder": "John Smith",
    "login.password": "Password",
    "login.forgotPassword": "Forgot password?",
    "login.pleaseWait": "Please wait...",
    "login.signIn": "Sign in",
    "login.createAccount": "Create account",
    "login.orContinueWith": "Or continue with",
    "login.noAccount": "No account? ",
    "login.haveAccount": "Already have an account? ",
    "login.register": "Sign up",
    "login.signInLink": "Sign in",
    "login.heroTitle": "Invest smarter with AI-powered analytics",
    "login.heroDesc": "Get real-time market analysis, personalized recommendations, and portfolio optimization powered by advanced AI algorithms.",
    "login.authFailed": "Authentication failed",

    "onboarding.title": "Let us personalize your experience",
    "onboarding.subtitle": "Help us understand your investment goals and preferences",
    "onboarding.stepOf": "Step {step} of {total}",
    "onboarding.riskTitle": "What is your risk tolerance?",
    "onboarding.riskDesc": "This helps us recommend suitable strategies",
    "onboarding.risk.conservative.label": "Conservative",
    "onboarding.risk.conservative.desc": "Minimize risk",
    "onboarding.risk.moderate.label": "Moderate",
    "onboarding.risk.moderate.desc": "Balanced risk",
    "onboarding.risk.aggressive.label": "Aggressive",
    "onboarding.risk.aggressive.desc": "High risk",
    "onboarding.goalTitle": "What is your primary investment goal?",
    "onboarding.goal.income": "Generate income",
    "onboarding.goal.growth": "Capital growth",
    "onboarding.goal.preservation": "Capital preservation",
    "onboarding.goal.balanced": "Balanced approach",
    "onboarding.experienceTitle": "What is your investment experience?",
    "onboarding.experience.beginner": "Beginner",
    "onboarding.experience.intermediate": "Intermediate",
    "onboarding.experience.advanced": "Advanced",
    "onboarding.initialInvestmentTitle": "Initial investment amount",
    "onboarding.amount": "Amount",
    "onboarding.finish": "Finish setup",

    "dashboard.totalValue": "Total portfolio value",
    "dashboard.todayChange": "Today's change",
    "dashboard.aiConfidence": "AI confidence",
    "dashboard.activePositions": "Active positions",
    "dashboard.portfolioTrend": "Portfolio performance",
    "dashboard.assetAllocation": "Asset allocation",
    "dashboard.aiInsights": "AI insights",
    "dashboard.topHoldings": "Top holdings",

    "portfolio.totalValue": "Total value",
    "portfolio.totalGainLoss": "Total gain/loss",
    "portfolio.assetCount": "Number of assets",
    "portfolio.performance": "Performance",
    "portfolio.assets": "Assets",
    "portfolio.filter": "Filter",
    "portfolio.export": "Export",
    "portfolio.searchPlaceholder": "Search assets...",
    "portfolio.tab.all": "All",
    "portfolio.tab.stock": "Stocks",
    "portfolio.tab.bond": "Bonds",
    "portfolio.tab.crypto": "Crypto",
    "portfolio.table.asset": "Asset",
    "portfolio.table.quantity": "Quantity",
    "portfolio.table.avgPrice": "Avg price",
    "portfolio.table.currentPrice": "Current price",
    "portfolio.table.totalValue": "Total value",
    "portfolio.table.pl": "P/L",
    "portfolio.table.allocation": "Allocation",
    "portfolio.table.action": "Action",

    "market.indices": "Market indices",
    "market.intraday": "Intraday performance",
    "market.topGainers": "Top gainers",
    "market.topLosers": "Top losers",
    "market.sectorPerformance": "Sector performance",
    "market.aiSignals": "AI market signals",
    "market.confidence": "Confidence: {value}%",

    "asset.addToWatchlist": "Add to watchlist",
    "asset.trade": "Trade",
    "asset.aiRecommendation": "AI recommendation",
    "asset.riskFactors": "Risk factors",
    "asset.volume": "Volume",
    "asset.marketCap": "Market cap",
    "asset.peRatio": "P/E ratio",
    "asset.range52w": "52W range",
    "asset.priceChart": "Price chart",
    "asset.technicalIndicators": "Technical indicators",
    "asset.value": "Value: {value}",

    "ai.title": "AI Investment Assistant",
    "ai.subtitle": "Get personalized insights and recommendations",
    "ai.suggest.q1": "What's the market outlook for tech stocks?",
    "ai.suggest.q2": "Should I rebalance my portfolio?",
    "ai.suggest.q3": "Analyze my risk exposure",
    "ai.suggest.q4": "What are the top opportunities right now?",
    "ai.inputPlaceholder": "Ask me anything about investments...",
    "ai.disclaimer": "AI-generated advice. Always do your own research before investing.",

    "settings.title": "Settings",
    "settings.subtitle": "Manage your account and preferences",
    "settings.tab.profile": "Profile",
    "settings.tab.investment": "Investment",
    "settings.tab.notifications": "Notifications",
    "settings.tab.security": "Security",
    "settings.tab.preferences": "Preferences",
    "settings.personalInfo": "Personal information",
    "settings.personalInfoDesc": "Update your personal details",
    "settings.firstName": "First name",
    "settings.lastName": "Last name",
    "settings.email": "Email",
    "settings.phone": "Phone number",
    "settings.saveChanges": "Save changes",
    "settings.riskProfile": "Risk profile",
    "settings.riskTolerance": "Risk tolerance",
    "settings.investmentGoals": "Investment goals",
    "settings.goal.income": "Generate income",
    "settings.goal.growth": "Capital growth",
    "settings.goal.balanced": "Balanced approach",
    "settings.updateInvestmentProfile": "Update investment profile",
    "settings.notificationsTitle": "Notification preferences",
    "settings.priceAlerts": "Price alerts",
    "settings.aiRecommendations": "AI recommendations",
    "settings.portfolioUpdates": "Portfolio updates",
    "settings.marketNews": "Market news",
    "settings.weeklyReports": "Weekly reports",
    "settings.securityTitle": "Security settings",
    "settings.securityNote": "Password and 2FA can be moved to a dedicated auth module.",
    "settings.displayPreferences": "Display preferences",
    "settings.currency": "Currency",
    "settings.compactView": "Compact view",
    "settings.showPercentages": "Show percentages",
    "settings.language": "Language",
    "settings.lang.ru": "Russian",
    "settings.lang.en": "English",
  },
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function resolveInitialLocale(): Locale {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("locale");
  if (stored === "ru" || stored === "en") return stored;
  const nav = window.navigator.language.toLowerCase();
  return nav.startsWith("ru") ? "ru" : "en";
}

function formatMessage(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined || value === null ? match : String(value);
  });
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => resolveInitialLocale());

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem("locale", locale);
    }
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const messages = MESSAGES[locale] || MESSAGES.en;
      const fallback = MESSAGES.en;
      const template = messages[key] ?? fallback[key] ?? key;
      return formatMessage(template, params);
    },
    [locale]
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}
