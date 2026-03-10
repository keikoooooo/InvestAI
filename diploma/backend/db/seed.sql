-- Demo user password: password123
INSERT INTO users (full_name, email, password_hash)
VALUES ('Demo User', 'john.doe@example.com', '$2a$10$2vhQKfNhRx3i2zl96MDAvuu7Rucw9sWlyz4wblx0cb8v2Y9f5h7dC')
ON CONFLICT (email) DO NOTHING;

INSERT INTO portfolios (user_id, name)
SELECT u.id, 'Main Portfolio'
FROM users u
WHERE u.email = 'john.doe@example.com'
AND NOT EXISTS (
  SELECT 1 FROM portfolios p WHERE p.user_id = u.id AND p.name = 'Main Portfolio'
);

INSERT INTO assets (symbol, name, asset_type)
VALUES
('AAPL', 'Apple Inc.', 'stock'),
('MSFT', 'Microsoft Corporation', 'stock'),
('GOOGL', 'Alphabet Inc.', 'stock'),
('TSLA', 'Tesla Inc.', 'stock'),
('BND', 'Vanguard Bond ETF', 'bond'),
('BTC', 'Bitcoin', 'crypto'),
('SPX', 'S&P 500', 'etf'),
('IXIC', 'NASDAQ', 'etf'),
('DJI', 'Dow Jones', 'etf'),
('RUT', 'Russell 2000', 'etf')
ON CONFLICT (symbol) DO NOTHING;

WITH pf AS (
  SELECT p.id
  FROM portfolios p
  JOIN users u ON u.id = p.user_id
  WHERE u.email = 'john.doe@example.com'
  ORDER BY p.created_at
  LIMIT 1
)
INSERT INTO portfolio_assets (portfolio_id, asset_id, quantity, avg_price, current_price)
SELECT pf.id, a.id, x.quantity, x.avg_price, x.current_price
FROM pf
JOIN (
  VALUES
    ('AAPL', 45::numeric, 165.50::numeric, 182.30::numeric),
    ('MSFT', 28::numeric, 320.00::numeric, 350.00::numeric),
    ('GOOGL', 52::numeric, 135.00::numeric, 140.25::numeric),
    ('TSLA', 35::numeric, 195.00::numeric, 209.20::numeric),
    ('BND', 200::numeric, 72.50::numeric, 71.80::numeric),
    ('BTC', 0.25::numeric, 42000.00::numeric, 45200.00::numeric)
) AS x(symbol, quantity, avg_price, current_price) ON TRUE
JOIN assets a ON a.symbol = x.symbol
WHERE NOT EXISTS (
  SELECT 1 FROM portfolio_assets pa WHERE pa.portfolio_id = pf.id AND pa.asset_id = a.id
);

INSERT INTO portfolio_history (portfolio_id, total_value, recorded_at)
SELECT p.id, v.total_value, v.recorded_at
FROM portfolios p
JOIN users u ON u.id = p.user_id
JOIN (
  VALUES
    (52000.00::numeric, NOW() - INTERVAL '5 months'),
    (53500.00::numeric, NOW() - INTERVAL '4 months'),
    (51200.00::numeric, NOW() - INTERVAL '3 months'),
    (54800.00::numeric, NOW() - INTERVAL '2 months'),
    (56300.00::numeric, NOW() - INTERVAL '1 month'),
    (58200.00::numeric, NOW())
) AS v(total_value, recorded_at) ON TRUE
WHERE u.email = 'john.doe@example.com';

INSERT INTO asset_market_data (asset_id, price, volume, recorded_at)
SELECT a.id, v.price, v.volume, v.recorded_at
FROM assets a
JOIN (
  VALUES
    ('AAPL', 165.00::numeric, 45000000::bigint, NOW() - INTERVAL '6 day'),
    ('AAPL', 168.00::numeric, 52000000::bigint, NOW() - INTERVAL '5 day'),
    ('AAPL', 172.00::numeric, 48000000::bigint, NOW() - INTERVAL '4 day'),
    ('AAPL', 169.00::numeric, 55000000::bigint, NOW() - INTERVAL '3 day'),
    ('AAPL', 175.00::numeric, 60000000::bigint, NOW() - INTERVAL '2 day'),
    ('AAPL', 178.00::numeric, 58000000::bigint, NOW() - INTERVAL '1 day'),
    ('AAPL', 182.30::numeric, 62000000::bigint, NOW()),

    ('MSFT', 330.00::numeric, 18000000::bigint, NOW() - INTERVAL '1 day'),
    ('MSFT', 350.00::numeric, 21000000::bigint, NOW()),
    ('GOOGL', 137.00::numeric, 16000000::bigint, NOW() - INTERVAL '1 day'),
    ('GOOGL', 140.25::numeric, 17500000::bigint, NOW()),
    ('TSLA', 202.00::numeric, 30000000::bigint, NOW() - INTERVAL '1 day'),
    ('TSLA', 209.20::numeric, 32000000::bigint, NOW()),
    ('BND', 72.10::numeric, 9000000::bigint, NOW() - INTERVAL '1 day'),
    ('BND', 71.80::numeric, 8500000::bigint, NOW()),
    ('BTC', 44200.00::numeric, 1200000000::bigint, NOW() - INTERVAL '1 day'),
    ('BTC', 45200.00::numeric, 1400000000::bigint, NOW()),

    ('SPX', 4750.00::numeric, 0::bigint, NOW() - INTERVAL '5 hour'),
    ('SPX', 4760.00::numeric, 0::bigint, NOW() - INTERVAL '4 hour'),
    ('SPX', 4778.00::numeric, 0::bigint, NOW() - INTERVAL '2 hour'),
    ('SPX', 4783.45::numeric, 0::bigint, NOW()),

    ('IXIC', 14900.00::numeric, 0::bigint, NOW() - INTERVAL '5 hour'),
    ('IXIC', 14920.00::numeric, 0::bigint, NOW() - INTERVAL '4 hour'),
    ('IXIC', 15010.00::numeric, 0::bigint, NOW() - INTERVAL '2 hour'),
    ('IXIC', 15034.72::numeric, 0::bigint, NOW()),

    ('DJI', 37350.00::numeric, 0::bigint, NOW() - INTERVAL '5 hour'),
    ('DJI', 37340.00::numeric, 0::bigint, NOW() - INTERVAL '4 hour'),
    ('DJI', 37310.00::numeric, 0::bigint, NOW() - INTERVAL '2 hour'),
    ('DJI', 37305.16::numeric, 0::bigint, NOW()),

    ('RUT', 2008.00::numeric, 0::bigint, NOW() - INTERVAL '5 hour'),
    ('RUT', 2012.00::numeric, 0::bigint, NOW() - INTERVAL '4 hour'),
    ('RUT', 2018.00::numeric, 0::bigint, NOW() - INTERVAL '2 hour'),
    ('RUT', 2023.45::numeric, 0::bigint, NOW())
) AS v(symbol, price, volume, recorded_at) ON a.symbol = v.symbol;

INSERT INTO user_risk_profiles (user_id, risk_level, investment_horizon, capital_amount, goals)
SELECT u.id, 'moderate', 5, 10000,
'{"investmentGoal":"growth","experienceLevel":"intermediate","currency":"usd","compactView":false,"showPercentages":true,"notificationPriceAlerts":true,"notificationAIRecommendations":true,"notificationPortfolioUpdates":true,"notificationMarketNews":false,"notificationWeeklyReports":true}'
FROM users u
WHERE u.email = 'john.doe@example.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO ai_market_signals (signal_type, description, sentiment, confidence, model_version)
VALUES
('Tech Sector Momentum', 'Strong buying pressure in semiconductor stocks.', 'bullish', 89.0, 'deepseek-v1'),
('Market Volatility Alert', 'VIX indicates potential short-term volatility spike.', 'caution', 76.0, 'deepseek-v1'),
('Energy Sector Weakness', 'Energy names underperform broad market.', 'bearish', 82.0, 'deepseek-v1');

INSERT INTO ai_recommendations (user_id, portfolio_id, recommendation_text, risk_level, expected_return, confidence_score, model_version)
SELECT u.id, p.id,
'Consider trimming overweight tech and increasing bond allocation by 5%.',
'moderate', 8.5, 87.0, 'deepseek-v1'
FROM users u
JOIN portfolios p ON p.user_id = u.id
WHERE u.email = 'john.doe@example.com';
