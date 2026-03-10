package store

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"math"
	"strings"
	"time"

	"diploma/backend/internal/model"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

type Store struct {
	pool             *pgxpool.Pool
	defaultUserEmail string
}

type ErrCode string

const (
	ErrNotFound ErrCode = "not_found"
)

type StoreError struct {
	Code ErrCode
	Err  error
}

func (e *StoreError) Error() string {
	return e.Err.Error()
}

func New(databaseURL, defaultUserEmail string) (*Store, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	pool, err := pgxpool.New(ctx, databaseURL)
	if err != nil {
		return nil, fmt.Errorf("connect pg: %w", err)
	}
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("ping pg: %w", err)
	}

	if defaultUserEmail == "" {
		defaultUserEmail = "john.doe@example.com"
	}

	s := &Store{pool: pool, defaultUserEmail: defaultUserEmail}
	if _, err := s.ensureDefaultUser(ctx); err != nil {
		pool.Close()
		return nil, err
	}
	return s, nil
}

func (s *Store) Close() {
	s.pool.Close()
}

func (s *Store) ensureDefaultUser(ctx context.Context) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `SELECT id::text FROM users WHERE email=$1`, s.defaultUserEmail).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}

	hash, err := bcrypt.GenerateFromPassword([]byte("password123"), bcrypt.DefaultCost)
	if err != nil {
		return "", err
	}
	name := "Demo User"
	err = s.pool.QueryRow(ctx, `
		INSERT INTO users (full_name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id::text
	`, name, s.defaultUserEmail, string(hash)).Scan(&id)
	if err != nil {
		return "", err
	}

	_, _ = s.pool.Exec(ctx, `INSERT INTO portfolios (user_id, name) VALUES ($1::uuid, 'Main Portfolio') ON CONFLICT DO NOTHING`, id)
	return id, nil
}

func (s *Store) ResolveUserID(ctx context.Context, requested string) (string, error) {
	requested = strings.TrimSpace(requested)
	if requested != "" {
		return requested, nil
	}
	return s.ensureDefaultUser(ctx)
}

func (s *Store) Register(ctx context.Context, name, email, password string) (model.User, error) {
	hash, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return model.User{}, err
	}

	var user model.User
	err = s.pool.QueryRow(ctx, `
		INSERT INTO users (full_name, email, password_hash)
		VALUES ($1, $2, $3)
		RETURNING id::text, full_name, email
	`, name, strings.ToLower(strings.TrimSpace(email)), string(hash)).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return model.User{}, err
	}

	_, _ = s.pool.Exec(ctx, `INSERT INTO portfolios (user_id, name) VALUES ($1::uuid, 'Main Portfolio')`, user.ID)
	return user, nil
}

func (s *Store) Login(ctx context.Context, email, password string) (model.User, error) {
	var user model.User
	var hash string
	err := s.pool.QueryRow(ctx, `
		SELECT id::text, full_name, email, password_hash
		FROM users
		WHERE email = $1
	`, strings.ToLower(strings.TrimSpace(email))).Scan(&user.ID, &user.Name, &user.Email, &hash)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.User{}, &StoreError{Code: ErrNotFound, Err: errors.New("user not found")}
		}
		return model.User{}, err
	}
	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password)); err != nil {
		return model.User{}, errors.New("invalid credentials")
	}
	return user, nil
}

func (s *Store) UserByID(ctx context.Context, userID string) (model.User, error) {
	var user model.User
	err := s.pool.QueryRow(ctx, `SELECT id::text, full_name, email FROM users WHERE id=$1::uuid`, userID).Scan(&user.ID, &user.Name, &user.Email)
	if err != nil {
		return model.User{}, err
	}
	return user, nil
}

type onboardingGoals struct {
	InvestmentGoal  string `json:"investmentGoal"`
	ExperienceLevel string `json:"experienceLevel"`
	Currency        string `json:"currency"`
	CompactView     bool   `json:"compactView"`
	ShowPercentages bool   `json:"showPercentages"`

	NotificationPriceAlerts       bool `json:"notificationPriceAlerts"`
	NotificationAIRecommendations bool `json:"notificationAIRecommendations"`
	NotificationPortfolioUpdates  bool `json:"notificationPortfolioUpdates"`
	NotificationMarketNews        bool `json:"notificationMarketNews"`
	NotificationWeeklyReports     bool `json:"notificationWeeklyReports"`
}

func defaultGoals() onboardingGoals {
	return onboardingGoals{
		InvestmentGoal:                "growth",
		ExperienceLevel:               "intermediate",
		Currency:                      "usd",
		CompactView:                   false,
		ShowPercentages:               true,
		NotificationPriceAlerts:       true,
		NotificationAIRecommendations: true,
		NotificationPortfolioUpdates:  true,
		NotificationMarketNews:        false,
		NotificationWeeklyReports:     true,
	}
}

func riskToInt(risk string) int {
	switch strings.ToLower(risk) {
	case "conservative":
		return 2
	case "aggressive":
		return 9
	default:
		return 5
	}
}

func intToRisk(v int) string {
	if v <= 3 {
		return "conservative"
	}
	if v >= 8 {
		return "aggressive"
	}
	return "moderate"
}

func horizonToInt(h string) int {
	switch strings.ToLower(h) {
	case "short":
		return 2
	case "long":
		return 10
	default:
		return 5
	}
}

func intToHorizon(v int) string {
	if v <= 3 {
		return "short"
	}
	if v >= 8 {
		return "long"
	}
	return "medium"
}

func parseGoals(raw string) onboardingGoals {
	g := defaultGoals()
	if strings.TrimSpace(raw) == "" {
		return g
	}
	_ = json.Unmarshal([]byte(raw), &g)
	return g
}

func (s *Store) Onboarding(ctx context.Context, userID string) (model.Onboarding, error) {
	var risk string
	var horizon int
	var capital float64
	var goalsRaw string
	err := s.pool.QueryRow(ctx, `
		SELECT risk_level, COALESCE(investment_horizon, 5), COALESCE(capital_amount, 0)::float8, COALESCE(goals, '')
		FROM user_risk_profiles
		WHERE user_id = $1::uuid
	`, userID).Scan(&risk, &horizon, &capital, &goalsRaw)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return model.Onboarding{RiskTolerance: "moderate", InvestmentGoal: "growth", ExperienceLevel: "intermediate", InvestmentHorizon: "medium", InitialInvestment: 10000}, nil
		}
		return model.Onboarding{}, err
	}
	g := parseGoals(goalsRaw)
	return model.Onboarding{
		RiskTolerance:     risk,
		InvestmentGoal:    g.InvestmentGoal,
		ExperienceLevel:   g.ExperienceLevel,
		InvestmentHorizon: intToHorizon(horizon),
		InitialInvestment: capital,
	}, nil
}

func (s *Store) UpdateOnboarding(ctx context.Context, userID string, in model.Onboarding) (model.Onboarding, error) {
	g := defaultGoals()
	g.InvestmentGoal = in.InvestmentGoal
	g.ExperienceLevel = in.ExperienceLevel
	data, _ := json.Marshal(g)

	_, err := s.pool.Exec(ctx, `
		INSERT INTO user_risk_profiles (user_id, risk_level, investment_horizon, capital_amount, goals, updated_at)
		VALUES ($1::uuid, $2, $3, $4, $5, NOW())
		ON CONFLICT (user_id)
		DO UPDATE SET risk_level=EXCLUDED.risk_level, investment_horizon=EXCLUDED.investment_horizon,
		capital_amount=EXCLUDED.capital_amount, goals=EXCLUDED.goals, updated_at=NOW()
	`, userID, in.RiskTolerance, horizonToInt(in.InvestmentHorizon), in.InitialInvestment, string(data))
	if err != nil {
		return model.Onboarding{}, err
	}
	return in, nil
}

func (s *Store) Holdings(ctx context.Context, userID, search, filterType string) ([]model.Holding, error) {
	search = strings.TrimSpace(search)
	filterType = strings.TrimSpace(strings.ToLower(filterType))
	if filterType == "all" {
		filterType = ""
	}

	rows, err := s.pool.Query(ctx, `
		SELECT a.symbol, a.name, pa.quantity::float8, pa.avg_price::float8,
			COALESCE(pa.current_price, pa.avg_price)::float8, INITCAP(a.asset_type)
		FROM portfolio_assets pa
		JOIN assets a ON a.id = pa.asset_id
		JOIN portfolios p ON p.id = pa.portfolio_id
		WHERE p.user_id = $1::uuid
			AND ($2 = '' OR a.symbol ILIKE '%' || $2 || '%' OR a.name ILIKE '%' || $2 || '%')
			AND ($3 = '' OR a.asset_type = $3)
		ORDER BY (pa.quantity * COALESCE(pa.current_price, pa.avg_price)) DESC
	`, userID, search, filterType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.Holding, 0)
	for rows.Next() {
		var h model.Holding
		if err := rows.Scan(&h.Symbol, &h.Name, &h.Quantity, &h.AvgPrice, &h.CurrentPrice, &h.Type); err != nil {
			return nil, err
		}
		out = append(out, h)
	}
	return out, rows.Err()
}

func (s *Store) Portfolio(ctx context.Context, userID string) (map[string]interface{}, error) {
	holdings, err := s.Holdings(ctx, userID, "", "")
	if err != nil {
		return nil, err
	}

	totalValue := 0.0
	totalGain := 0.0
	byMonth := make(map[string]float64)
	for _, h := range holdings {
		value := h.Quantity * h.CurrentPrice
		gain := (h.CurrentPrice - h.AvgPrice) * h.Quantity
		totalValue += value
		totalGain += gain
	}

	rows, err := s.pool.Query(ctx, `
		SELECT TO_CHAR(recorded_at, 'Mon') AS month, MAX(total_value)::float8
		FROM portfolio_history ph
		JOIN portfolios p ON p.id = ph.portfolio_id
		WHERE p.user_id = $1::uuid
		GROUP BY TO_CHAR(recorded_at, 'Mon'), date_trunc('month', recorded_at)
		ORDER BY date_trunc('month', recorded_at)
		LIMIT 12
	`, userID)
	if err == nil {
		for rows.Next() {
			var month string
			var val float64
			if scanErr := rows.Scan(&month, &val); scanErr == nil {
				byMonth[month] = val
			}
		}
		rows.Close()
	}

	performance := make([]model.PerformancePoint, 0, len(byMonth))
	for month, value := range byMonth {
		performance = append(performance, model.PerformancePoint{Label: month, Value: value})
	}
	if len(performance) == 0 {
		performance = []model.PerformancePoint{{Label: "Now", Value: totalValue}}
	}

	totalGainPercent := 0.0
	if totalValue-totalGain > 0 {
		totalGainPercent = totalGain / (totalValue - totalGain) * 100
	}

	return map[string]interface{}{
		"summary": map[string]interface{}{
			"totalValue":       totalValue,
			"totalGain":        totalGain,
			"totalGainPercent": totalGainPercent,
			"assetsCount":      len(holdings),
		},
		"performance": performance,
		"holdings":    holdings,
	}, nil
}

func allocationColor(assetType string) string {
	switch strings.ToLower(assetType) {
	case "stock":
		return "#0ea5e9"
	case "bond":
		return "#10b981"
	case "crypto":
		return "#f59e0b"
	case "etf":
		return "#6366f1"
	default:
		return "#94a3b8"
	}
}

func (s *Store) Dashboard(ctx context.Context, userID string) (map[string]interface{}, error) {
	portfolio, err := s.Portfolio(ctx, userID)
	if err != nil {
		return nil, err
	}
	summary := portfolio["summary"].(map[string]interface{})
	holdings := portfolio["holdings"].([]model.Holding)
	performance := portfolio["performance"]

	rows, err := s.pool.Query(ctx, `
		SELECT a.asset_type, SUM(pa.quantity * COALESCE(pa.current_price, pa.avg_price))::float8
		FROM portfolio_assets pa
		JOIN assets a ON a.id = pa.asset_id
		JOIN portfolios p ON p.id = pa.portfolio_id
		WHERE p.user_id = $1::uuid
		GROUP BY a.asset_type
	`, userID)
	allocation := make([]model.Allocation, 0)
	if err == nil {
		total := summary["totalValue"].(float64)
		for rows.Next() {
			var assetType string
			var value float64
			if scanErr := rows.Scan(&assetType, &value); scanErr == nil && total > 0 {
				allocation = append(allocation, model.Allocation{Name: strings.Title(assetType), Value: value / total * 100, Color: allocationColor(assetType)})
			}
		}
		rows.Close()
	}

	insights := make([]model.Insight, 0)
	recRows, err := s.pool.Query(ctx, `
		SELECT recommendation_text, COALESCE(confidence_score, 0)::float8, COALESCE(risk_level, 'info')
		FROM ai_recommendations
		WHERE user_id = $1::uuid
		ORDER BY created_at DESC
		LIMIT 3
	`, userID)
	if err == nil {
		for recRows.Next() {
			var text string
			var conf float64
			var risk string
			if scanErr := recRows.Scan(&text, &conf, &risk); scanErr == nil {
				t := "recommendation"
				if strings.Contains(strings.ToLower(risk), "high") {
					t = "alert"
				}
				insights = append(insights, model.Insight{Type: t, Title: "AI Recommendation", Description: text, Confidence: int(math.Round(conf))})
			}
		}
		recRows.Close()
	}

	top := make([]map[string]interface{}, 0, len(holdings))
	for _, h := range holdings {
		value := h.Quantity * h.CurrentPrice
		gain := (h.CurrentPrice/h.AvgPrice - 1) * 100
		top = append(top, map[string]interface{}{"symbol": h.Symbol, "name": h.Name, "value": value, "change": gain, "shares": h.Quantity})
	}
	if len(top) > 5 {
		top = top[:5]
	}

	return map[string]interface{}{
		"summary": map[string]interface{}{
			"totalValue":       summary["totalValue"],
			"totalGain":        summary["totalGain"],
			"gainPercent":      summary["totalGainPercent"],
			"dayChange":        0,
			"dayChangePercent": 0,
			"aiConfidence":     80,
			"activePositions":  len(holdings),
		},
		"performance": performance,
		"allocation":  allocation,
		"insights":    insights,
		"topHoldings": top,
	}, nil
}

func movingAverage(data []float64, n int) float64 {
	if len(data) == 0 {
		return 0
	}
	if n > len(data) {
		n = len(data)
	}
	sum := 0.0
	for _, v := range data[len(data)-n:] {
		sum += v
	}
	return sum / float64(n)
}

func (s *Store) Asset(ctx context.Context, userID, symbol string) (model.AssetAnalysis, error) {
	symbol = strings.ToUpper(strings.TrimSpace(symbol))
	rows, err := s.pool.Query(ctx, `
		SELECT COALESCE(amd.price, pa.current_price, pa.avg_price)::float8,
			COALESCE(amd.volume, 0),
			amd.recorded_at
		FROM assets a
		LEFT JOIN asset_market_data amd ON amd.asset_id = a.id
		LEFT JOIN portfolio_assets pa ON pa.asset_id = a.id
		LEFT JOIN portfolios p ON p.id = pa.portfolio_id AND p.user_id = $1::uuid
		WHERE a.symbol = $2
		ORDER BY amd.recorded_at ASC NULLS LAST
		LIMIT 120
	`, userID, symbol)
	if err != nil {
		return model.AssetAnalysis{}, err
	}
	defer rows.Close()

	type point struct {
		price  float64
		volume int64
		at     time.Time
	}
	series := make([]point, 0)
	for rows.Next() {
		var p point
		if err := rows.Scan(&p.price, &p.volume, &p.at); err != nil {
			return model.AssetAnalysis{}, err
		}
		series = append(series, p)
	}
	if len(series) == 0 {
		return model.AssetAnalysis{}, &StoreError{Code: ErrNotFound, Err: errors.New("asset not found")}
	}

	var name string
	var assetType string
	err = s.pool.QueryRow(ctx, `SELECT name, asset_type FROM assets WHERE symbol = $1`, symbol).Scan(&name, &assetType)
	if err != nil {
		return model.AssetAnalysis{}, err
	}

	prices := make([]float64, 0, len(series))
	history := make([]model.AssetHistoryPoint, 0, len(series))
	high := -1.0
	low := math.MaxFloat64
	for _, p := range series {
		prices = append(prices, p.price)
		if p.price > high {
			high = p.price
		}
		if p.price < low {
			low = p.price
		}
		history = append(history, model.AssetHistoryPoint{
			Date:   p.at.Format("Jan 2"),
			Price:  p.price,
			Volume: p.volume,
			MA20:   movingAverage(prices, 20),
			MA50:   movingAverage(prices, 50),
		})
	}

	latest := series[len(series)-1].price
	prev := latest
	if len(series) > 1 {
		prev = series[len(series)-2].price
	}
	change := latest - prev
	changePct := 0.0
	if prev != 0 {
		changePct = change / prev * 100
	}

	rec := "Hold"
	conf := 70
	reasoning := []string{"Signal based on recent market data and your portfolio exposure."}
	riskFactors := []string{"Market volatility can rapidly change short-term trends."}
	_ = s.pool.QueryRow(ctx, `
		SELECT recommendation_text, COALESCE(confidence_score, 70)::float8
		FROM ai_recommendations r
		JOIN portfolios p ON p.id = r.portfolio_id
		JOIN assets a ON a.symbol = $2
		WHERE p.user_id = $1::uuid
		ORDER BY r.created_at DESC
		LIMIT 1
	`, userID, symbol).Scan(&rec, &conf)

	volume := series[len(series)-1].volume
	indicators := []model.AssetIndicator{
		{Name: "MA20", Value: movingAverage(prices, 20), Signal: "Trend", Color: "text-success"},
		{Name: "MA50", Value: movingAverage(prices, 50), Signal: "Trend", Color: "text-warning"},
		{Name: "Volume", Value: volume, Signal: "Activity", Color: "text-primary"},
	}

	return model.AssetAnalysis{
		Symbol:         symbol,
		Name:           name,
		Price:          latest,
		Change:         change,
		ChangePercent:  changePct,
		Volume:         volume,
		MarketCap:      fmt.Sprintf("%.2fB", latest*float64(max(volume, 1))/1_000_000_000),
		PE:             0,
		High52W:        high,
		Low52W:         low,
		Recommendation: rec,
		Confidence:     conf,
		Reasoning:      reasoning,
		RiskFactors:    riskFactors,
		Indicators:     indicators,
		History:        history,
	}, nil
}

func max(a, b int64) int64 {
	if a > b {
		return a
	}
	return b
}

func (s *Store) MarketOverview(ctx context.Context, userID string) (map[string]interface{}, error) {
	indices := make([]model.MarketIndex, 0)
	for _, sym := range []string{"SPX", "IXIC", "DJI", "RUT"} {
		var idx model.MarketIndex
		err := s.pool.QueryRow(ctx, `
			WITH ranked AS (
				SELECT a.name, a.symbol, amd.price::float8,
				LAG(amd.price::float8) OVER (ORDER BY amd.recorded_at) AS prev_price,
				ROW_NUMBER() OVER (ORDER BY amd.recorded_at DESC) rn
				FROM assets a
				JOIN asset_market_data amd ON amd.asset_id = a.id
				WHERE a.symbol = $1
			)
			SELECT name, symbol, price, COALESCE(price - prev_price, 0),
				CASE WHEN prev_price IS NULL OR prev_price = 0 THEN 0 ELSE ((price-prev_price)/prev_price)*100 END
			FROM ranked WHERE rn = 1
		`, sym).Scan(&idx.Name, &idx.Symbol, &idx.Value, &idx.Change, &idx.ChangePercent)
		if err == nil {
			indices = append(indices, idx)
		}
	}

	movers := make([]model.MarketMover, 0)
	rows, err := s.pool.Query(ctx, `
		WITH ranked AS (
			SELECT a.symbol, a.name, amd.price::float8,
				LAG(amd.price::float8) OVER (PARTITION BY a.id ORDER BY amd.recorded_at) AS prev_price,
				ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY amd.recorded_at DESC) rn
			FROM assets a
			JOIN asset_market_data amd ON amd.asset_id = a.id
		)
		SELECT symbol, name, price,
			CASE WHEN prev_price IS NULL OR prev_price = 0 THEN 0 ELSE ((price-prev_price)/prev_price)*100 END AS pct
		FROM ranked
		WHERE rn = 1
		ORDER BY pct DESC
		LIMIT 10
	`)
	if err == nil {
		for rows.Next() {
			var m model.MarketMover
			if scanErr := rows.Scan(&m.Symbol, &m.Name, &m.Price, &m.Change); scanErr == nil {
				movers = append(movers, m)
			}
		}
		rows.Close()
	}
	topGainers := movers
	if len(topGainers) > 5 {
		topGainers = topGainers[:5]
	}
	topLosers := make([]model.MarketMover, 0)
	for i := len(movers) - 1; i >= 0 && len(topLosers) < 5; i-- {
		topLosers = append(topLosers, movers[i])
	}

	sectors := make([]model.MarketSector, 0)
	sectorRows, err := s.pool.Query(ctx, `
		WITH ranked AS (
			SELECT a.asset_type, amd.price::float8,
				LAG(amd.price::float8) OVER (PARTITION BY a.id ORDER BY amd.recorded_at) AS prev_price,
				ROW_NUMBER() OVER (PARTITION BY a.id ORDER BY amd.recorded_at DESC) rn
			FROM assets a
			JOIN asset_market_data amd ON amd.asset_id = a.id
		)
		SELECT asset_type,
			AVG(CASE WHEN prev_price IS NULL OR prev_price = 0 THEN 0 ELSE ((price-prev_price)/prev_price)*100 END)::float8
		FROM ranked
		WHERE rn = 1
		GROUP BY asset_type
	`)
	if err == nil {
		for sectorRows.Next() {
			var name string
			var change float64
			if scanErr := sectorRows.Scan(&name, &change); scanErr == nil {
				trend := "down"
				if change >= 0 {
					trend = "up"
				}
				sectors = append(sectors, model.MarketSector{Name: strings.Title(name), Change: change, Trend: trend})
			}
		}
		sectorRows.Close()
	}

	signals := make([]model.MarketSignal, 0)
	sigRows, err := s.pool.Query(ctx, `
		SELECT signal_type, description, sentiment, COALESCE(confidence, 0)::float8
		FROM ai_market_signals
		ORDER BY generated_at DESC
		LIMIT 5
	`)
	if err == nil {
		for sigRows.Next() {
			var title, desc, sentiment string
			var confidence float64
			if scanErr := sigRows.Scan(&title, &desc, &sentiment, &confidence); scanErr == nil {
				signals = append(signals, model.MarketSignal{Title: title, Description: desc, Signal: strings.Title(sentiment), Confidence: int(math.Round(confidence))})
			}
		}
		sigRows.Close()
	}

	intraday := make([]map[string]interface{}, 0)
	intradayRows, err := s.pool.Query(ctx, `
		SELECT TO_CHAR(amd.recorded_at, 'HH24:MI') AS t, a.symbol, amd.price::float8
		FROM asset_market_data amd
		JOIN assets a ON a.id = amd.asset_id
		WHERE a.symbol IN ('SPX','IXIC','DJI')
		ORDER BY amd.recorded_at DESC
		LIMIT 60
	`)
	if err == nil {
		tmp := map[string]map[string]interface{}{}
		for intradayRows.Next() {
			var t, sym string
			var price float64
			if scanErr := intradayRows.Scan(&t, &sym, &price); scanErr == nil {
				row, ok := tmp[t]
				if !ok {
					row = map[string]interface{}{"time": t}
					tmp[t] = row
				}
				key := strings.ToLower(strings.TrimSpace(sym))
				if key == "ixic" {
					key = "ndx"
				}
				if key == "dji" {
					key = "dji"
				}
				if key == "spx" {
					key = "spx"
				}
				row[key] = price
			}
		}
		intradayRows.Close()
		for _, row := range tmp {
			intraday = append(intraday, row)
		}
	}

	return map[string]interface{}{
		"indices":    indices,
		"intraday":   intraday,
		"topGainers": topGainers,
		"topLosers":  topLosers,
		"sectors":    sectors,
		"signals":    signals,
	}, nil
}

func (s *Store) ensureConversation(ctx context.Context, userID string) (string, error) {
	var id string
	err := s.pool.QueryRow(ctx, `
		SELECT id::text
		FROM ai_conversations
		WHERE user_id = $1::uuid
		ORDER BY created_at DESC
		LIMIT 1
	`, userID).Scan(&id)
	if err == nil {
		return id, nil
	}
	if !errors.Is(err, pgx.ErrNoRows) {
		return "", err
	}
	err = s.pool.QueryRow(ctx, `
		INSERT INTO ai_conversations (user_id, title)
		VALUES ($1::uuid, 'General Chat')
		RETURNING id::text
	`, userID).Scan(&id)
	return id, err
}

func (s *Store) AIHistory(ctx context.Context, userID string) ([]model.AIMessage, error) {
	convID, err := s.ensureConversation(ctx, userID)
	if err != nil {
		return nil, err
	}

	rows, err := s.pool.Query(ctx, `
		SELECT id::text, role, content, created_at
		FROM ai_messages
		WHERE conversation_id = $1::uuid
		ORDER BY created_at ASC
	`, convID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]model.AIMessage, 0)
	for rows.Next() {
		var m model.AIMessage
		var ts time.Time
		if err := rows.Scan(&m.ID, &m.Role, &m.Content, &ts); err != nil {
			return nil, err
		}
		m.Timestamp = ts.Format(time.RFC3339)
		out = append(out, m)
	}
	return out, rows.Err()
}

func (s *Store) AskAI(ctx context.Context, userID, text string) (model.AIMessage, error) {
	convID, err := s.ensureConversation(ctx, userID)
	if err != nil {
		return model.AIMessage{}, err
	}

	_, err = s.pool.Exec(ctx, `
		INSERT INTO ai_messages (conversation_id, role, content)
		VALUES ($1::uuid, 'user', $2)
	`, convID, text)
	if err != nil {
		return model.AIMessage{}, err
	}

	var totalValue float64
	var totalGain float64
	portfolio, err := s.Portfolio(ctx, userID)
	if err == nil {
		summary := portfolio["summary"].(map[string]interface{})
		totalValue, _ = summary["totalValue"].(float64)
		totalGain, _ = summary["totalGain"].(float64)
	}

	signalText := "Market data is limited."
	_ = s.pool.QueryRow(ctx, `SELECT description FROM ai_market_signals ORDER BY generated_at DESC LIMIT 1`).Scan(&signalText)

	content := fmt.Sprintf("Portfolio value: $%.2f. P/L: $%.2f. Latest market signal: %s", totalValue, totalGain, signalText)
	if strings.Contains(strings.ToLower(text), "rebalance") {
		content = content + " Recommendation: reduce overweight positions and rebalance toward target risk profile."
	}

	var msg model.AIMessage
	var ts time.Time
	err = s.pool.QueryRow(ctx, `
		INSERT INTO ai_messages (conversation_id, role, content)
		VALUES ($1::uuid, 'assistant', $2)
		RETURNING id::text, created_at
	`, convID, content).Scan(&msg.ID, &ts)
	if err != nil {
		return model.AIMessage{}, err
	}

	_, _ = s.pool.Exec(ctx, `
		INSERT INTO ai_request_logs (user_id, conversation_id, model_name, prompt_tokens, completion_tokens, total_tokens, response_time_ms, request_status)
		VALUES ($1::uuid, $2::uuid, 'deepseek', $3, $4, $5, $6, 'ok')
	`, userID, convID, len(text)/4, len(content)/4, len(text)/4+len(content)/4, 100)

	msg.Role = "assistant"
	msg.Content = content
	msg.Timestamp = ts.Format(time.RFC3339)
	return msg, nil
}

func splitName(full string) (string, string) {
	parts := strings.Fields(full)
	if len(parts) == 0 {
		return "", ""
	}
	if len(parts) == 1 {
		return parts[0], ""
	}
	return parts[0], strings.Join(parts[1:], " ")
}

func (s *Store) Settings(ctx context.Context, userID string) (model.Settings, error) {
	var fullName, email string
	err := s.pool.QueryRow(ctx, `SELECT full_name, email FROM users WHERE id = $1::uuid`, userID).Scan(&fullName, &email)
	if err != nil {
		return model.Settings{}, err
	}
	first, last := splitName(fullName)

	out := model.Settings{FirstName: first, LastName: last, Email: email, Phone: "", RiskTolerance: 5, InvestmentGoal: "growth", Currency: "usd", CompactView: false, ShowPercentages: true, NotificationPriceAlerts: true, NotificationAIRecommendations: true, NotificationPortfolioUpdates: true, NotificationMarketNews: false, NotificationWeeklyReports: true}

	var risk string
	var goalsRaw string
	err = s.pool.QueryRow(ctx, `SELECT risk_level, COALESCE(goals, '') FROM user_risk_profiles WHERE user_id = $1::uuid`, userID).Scan(&risk, &goalsRaw)
	if err == nil {
		out.RiskTolerance = riskToInt(risk)
		g := parseGoals(goalsRaw)
		out.InvestmentGoal = g.InvestmentGoal
		out.Currency = g.Currency
		out.CompactView = g.CompactView
		out.ShowPercentages = g.ShowPercentages
		out.NotificationPriceAlerts = g.NotificationPriceAlerts
		out.NotificationAIRecommendations = g.NotificationAIRecommendations
		out.NotificationPortfolioUpdates = g.NotificationPortfolioUpdates
		out.NotificationMarketNews = g.NotificationMarketNews
		out.NotificationWeeklyReports = g.NotificationWeeklyReports
	}

	return out, nil
}

func (s *Store) UpdateSettings(ctx context.Context, userID string, in model.Settings) (model.Settings, error) {
	fullName := strings.TrimSpace(strings.TrimSpace(in.FirstName) + " " + strings.TrimSpace(in.LastName))
	_, err := s.pool.Exec(ctx, `
		UPDATE users
		SET full_name = $2, email = $3, updated_at = NOW()
		WHERE id = $1::uuid
	`, userID, fullName, in.Email)
	if err != nil {
		return model.Settings{}, err
	}

	goals := onboardingGoals{
		InvestmentGoal:                in.InvestmentGoal,
		ExperienceLevel:               "intermediate",
		Currency:                      in.Currency,
		CompactView:                   in.CompactView,
		ShowPercentages:               in.ShowPercentages,
		NotificationPriceAlerts:       in.NotificationPriceAlerts,
		NotificationAIRecommendations: in.NotificationAIRecommendations,
		NotificationPortfolioUpdates:  in.NotificationPortfolioUpdates,
		NotificationMarketNews:        in.NotificationMarketNews,
		NotificationWeeklyReports:     in.NotificationWeeklyReports,
	}
	data, _ := json.Marshal(goals)
	_, err = s.pool.Exec(ctx, `
		INSERT INTO user_risk_profiles (user_id, risk_level, investment_horizon, capital_amount, goals, updated_at)
		VALUES ($1::uuid, $2, 5, 0, $3, NOW())
		ON CONFLICT (user_id)
		DO UPDATE SET risk_level=EXCLUDED.risk_level, goals=EXCLUDED.goals, updated_at=NOW()
	`, userID, intToRisk(in.RiskTolerance), string(data))
	if err != nil {
		return model.Settings{}, err
	}
	return s.Settings(ctx, userID)
}
