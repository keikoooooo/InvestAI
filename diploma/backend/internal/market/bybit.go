package market

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"net/http"
	"net/url"
	"os"
	"strconv"
	"strings"
	"time"

	"diploma/backend/internal/store"
)

type bybitTickerResponse struct {
	RetCode int    `json:"retCode"`
	RetMsg  string `json:"retMsg"`
	Result  struct {
		Category string `json:"category"`
		List     []struct {
			Symbol    string `json:"symbol"`
			LastPrice string `json:"lastPrice"`
			Volume24h string `json:"volume24h"`
		} `json:"list"`
	} `json:"result"`
}

type Store interface {
	ListAssetsByType(ctx context.Context, assetType string) ([]store.AssetRef, error)
	UpsertMarketTick(ctx context.Context, assetID string, price float64, volume int64) error
}

func StartBybitPoller(ctx context.Context, l *log.Logger, st Store) {
	if !envBool("BYBIT_ENABLED", false) {
		return
	}

	baseURL := strings.TrimSpace(os.Getenv("BYBIT_BASE_URL"))
	if baseURL == "" {
		baseURL = "https://api.bybit.com"
	}
	category := strings.TrimSpace(os.Getenv("BYBIT_CATEGORY"))
	if category == "" {
		category = "spot"
	}
	quote := strings.TrimSpace(os.Getenv("BYBIT_QUOTE"))
	if quote == "" {
		quote = "USDT"
	}
	interval := envDuration("BYBIT_POLL_INTERVAL", 30*time.Second)

	u, err := url.Parse(baseURL)
	if err != nil {
		l.Printf("bybit poller disabled: invalid BYBIT_BASE_URL: %v", err)
		return
	}

	client := &http.Client{Timeout: 10 * time.Second}

	l.Printf("bybit poller enabled: base=%s category=%s quote=%s interval=%s", u.String(), category, quote, interval)

	tick := time.NewTicker(interval)
	defer tick.Stop()

	// Run immediately, then on schedule.
	for {
		if err := pollOnce(ctx, client, u, category, quote, st); err != nil {
			l.Printf("bybit poll error: %v", err)
		}

		select {
		case <-ctx.Done():
			return
		case <-tick.C:
		}
	}
}

func pollOnce(ctx context.Context, client *http.Client, base *url.URL, category, quote string, st Store) error {
	assets, err := st.ListAssetsByType(ctx, "crypto")
	if err != nil {
		return err
	}
	if len(assets) == 0 {
		return nil
	}

	for _, a := range assets {
		bybitSymbol := strings.ToUpper(strings.TrimSpace(a.Symbol)) + strings.ToUpper(quote)
		price, vol, err := fetchLastPrice(ctx, client, base, category, bybitSymbol)
		if err != nil {
			// Best effort: keep going for other symbols.
			continue
		}
		_ = st.UpsertMarketTick(ctx, a.ID, price, vol)
	}
	return nil
}

func fetchLastPrice(ctx context.Context, client *http.Client, base *url.URL, category, symbol string) (price float64, volume int64, err error) {
	u := *base
	u.Path = "/v5/market/tickers"
	q := u.Query()
	q.Set("category", category)
	q.Set("symbol", symbol)
	u.RawQuery = q.Encode()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return 0, 0, err
	}
	req.Header.Set("Accept", "application/json")
	req.Header.Set("User-Agent", "diploma-backend/1.0 (+local)")

	resp, err := client.Do(req)
	if err != nil {
		return 0, 0, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		b, _ := io.ReadAll(io.LimitReader(resp.Body, 8<<10))
		return 0, 0, fmt.Errorf("bybit http %d: %s", resp.StatusCode, strings.TrimSpace(string(b)))
	}

	var out bybitTickerResponse
	dec := json.NewDecoder(resp.Body)
	if err := dec.Decode(&out); err != nil {
		return 0, 0, err
	}
	if out.RetCode != 0 {
		return 0, 0, fmt.Errorf("bybit retCode=%d retMsg=%s", out.RetCode, out.RetMsg)
	}
	if len(out.Result.List) == 0 {
		return 0, 0, errors.New("bybit: empty ticker list")
	}

	p, err := strconv.ParseFloat(out.Result.List[0].LastPrice, 64)
	if err != nil {
		return 0, 0, fmt.Errorf("bybit parse lastPrice: %w", err)
	}

	// volume24h may be fractional; store a rounded value in BIGINT.
	vf := 0.0
	if out.Result.List[0].Volume24h != "" {
		if parsed, perr := strconv.ParseFloat(out.Result.List[0].Volume24h, 64); perr == nil {
			vf = parsed
		}
	}
	if vf > float64(math.MaxInt64) {
		vf = float64(math.MaxInt64)
	}

	return p, int64(math.Round(vf)), nil
}

func envBool(key string, def bool) bool {
	v := strings.TrimSpace(strings.ToLower(os.Getenv(key)))
	if v == "" {
		return def
	}
	switch v {
	case "1", "true", "yes", "y", "on":
		return true
	case "0", "false", "no", "n", "off":
		return false
	default:
		return def
	}
}

func envDuration(key string, def time.Duration) time.Duration {
	v := strings.TrimSpace(os.Getenv(key))
	if v == "" {
		return def
	}
	// Support both "30s" and "30" (seconds).
	if d, err := time.ParseDuration(v); err == nil {
		return d
	}
	if n, err := strconv.Atoi(v); err == nil && n > 0 {
		return time.Duration(n) * time.Second
	}
	return def
}
