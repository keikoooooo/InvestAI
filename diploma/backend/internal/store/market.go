package store

import (
	"context"
)

type AssetRef struct {
	ID     string
	Symbol string
}

func (s *Store) ListAssetsByType(ctx context.Context, assetType string) ([]AssetRef, error) {
	rows, err := s.pool.Query(ctx, `SELECT id::text, symbol FROM assets WHERE asset_type = $1`, assetType)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := make([]AssetRef, 0)
	for rows.Next() {
		var a AssetRef
		if err := rows.Scan(&a.ID, &a.Symbol); err != nil {
			return nil, err
		}
		out = append(out, a)
	}
	return out, rows.Err()
}

func (s *Store) UpsertMarketTick(ctx context.Context, assetID string, price float64, volume int64) error {
	// Insert point-in-time market data.
	_, err := s.pool.Exec(ctx, `
		INSERT INTO asset_market_data (asset_id, price, volume)
		VALUES ($1::uuid, $2, $3)
	`, assetID, price, volume)
	if err != nil {
		return err
	}

	// Update current price used by portfolio endpoints.
	_, _ = s.pool.Exec(ctx, `
		UPDATE portfolio_assets
		SET current_price = $2
		WHERE asset_id = $1::uuid
	`, assetID, price)

	return nil
}
