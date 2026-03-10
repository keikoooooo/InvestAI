package model

type User struct {
	ID    string `json:"id"`
	Name  string `json:"name"`
	Email string `json:"email"`
}

type Onboarding struct {
	RiskTolerance     string  `json:"riskTolerance"`
	InvestmentGoal    string  `json:"investmentGoal"`
	ExperienceLevel   string  `json:"experienceLevel"`
	InvestmentHorizon string  `json:"investmentHorizon"`
	InitialInvestment float64 `json:"initialInvestment"`
}

type Holding struct {
	Symbol       string  `json:"symbol"`
	Name         string  `json:"name"`
	Quantity     float64 `json:"quantity"`
	AvgPrice     float64 `json:"avgPrice"`
	CurrentPrice float64 `json:"currentPrice"`
	Type         string  `json:"type"`
}

type PerformancePoint struct {
	Label string  `json:"label"`
	Value float64 `json:"value"`
}

type Allocation struct {
	Name  string  `json:"name"`
	Value float64 `json:"value"`
	Color string  `json:"color"`
}

type Insight struct {
	Type        string `json:"type"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Confidence  int    `json:"confidence"`
}

type Recommendation struct {
	Symbol     string `json:"symbol"`
	Action     string `json:"action"`
	Confidence int    `json:"confidence"`
}

type AIMessage struct {
	ID              string           `json:"id"`
	Role            string           `json:"role"`
	Content         string           `json:"content"`
	Timestamp       string           `json:"timestamp"`
	Recommendations []Recommendation `json:"recommendations,omitempty"`
}

type AssetHistoryPoint struct {
	Date   string  `json:"date"`
	Price  float64 `json:"price"`
	Volume int64   `json:"volume"`
	MA20   float64 `json:"ma20"`
	MA50   float64 `json:"ma50"`
}

type AssetIndicator struct {
	Name   string      `json:"name"`
	Value  interface{} `json:"value"`
	Signal string      `json:"signal"`
	Color  string      `json:"color"`
}

type AssetAnalysis struct {
	Symbol         string              `json:"symbol"`
	Name           string              `json:"name"`
	Price          float64             `json:"price"`
	Change         float64             `json:"change"`
	ChangePercent  float64             `json:"changePercent"`
	Volume         int64               `json:"volume"`
	MarketCap      string              `json:"marketCap"`
	PE             float64             `json:"pe"`
	High52W        float64             `json:"high52w"`
	Low52W         float64             `json:"low52w"`
	Recommendation string              `json:"recommendation"`
	Confidence     int                 `json:"confidence"`
	Reasoning      []string            `json:"reasoning"`
	RiskFactors    []string            `json:"riskFactors"`
	Indicators     []AssetIndicator    `json:"indicators"`
	History        []AssetHistoryPoint `json:"history"`
}

type MarketIndex struct {
	Name          string  `json:"name"`
	Symbol        string  `json:"symbol"`
	Value         float64 `json:"value"`
	Change        float64 `json:"change"`
	ChangePercent float64 `json:"changePercent"`
}

type MarketMover struct {
	Symbol string  `json:"symbol"`
	Name   string  `json:"name"`
	Price  float64 `json:"price"`
	Change float64 `json:"change"`
}

type MarketSector struct {
	Name   string  `json:"name"`
	Change float64 `json:"change"`
	Trend  string  `json:"trend"`
}

type MarketSignal struct {
	Title       string `json:"title"`
	Description string `json:"description"`
	Signal      string `json:"signal"`
	Confidence  int    `json:"confidence"`
}

type Settings struct {
	FirstName string `json:"firstName"`
	LastName  string `json:"lastName"`
	Email     string `json:"email"`
	Phone     string `json:"phone"`

	RiskTolerance  int    `json:"riskTolerance"`
	InvestmentGoal string `json:"investmentGoal"`

	NotificationPriceAlerts       bool `json:"notificationPriceAlerts"`
	NotificationAIRecommendations bool `json:"notificationAIRecommendations"`
	NotificationPortfolioUpdates  bool `json:"notificationPortfolioUpdates"`
	NotificationMarketNews        bool `json:"notificationMarketNews"`
	NotificationWeeklyReports     bool `json:"notificationWeeklyReports"`

	Currency        string `json:"currency"`
	CompactView     bool   `json:"compactView"`
	ShowPercentages bool   `json:"showPercentages"`
}
