CREATE TABLE IF NOT EXISTS users (
  user_hash TEXT PRIMARY KEY,
  user_name TEXT,
  user_gender TEXT,
  user_birthday TEXT,
  user_email TEXT,
  points INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS coin_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  amount INTEGER NOT NULL,
  reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS promo_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  promo_type TEXT NOT NULL,
  promo_code TEXT,
  amount INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_hash, promo_type)
);

CREATE TABLE IF NOT EXISTS exchanges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_hash TEXT NOT NULL,
  coin_count INTEGER NOT NULL,
  points INTEGER NOT NULL,
  promo_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_exchange', 'PLACEHOLDER_EXCHANGE');
INSERT OR IGNORE INTO settings (key, value) VALUES ('promo_login', 'PLACEHOLDER_LOGIN');
INSERT OR IGNORE INTO settings (key, value) VALUES ('push_template_id', '');

CREATE TABLE IF NOT EXISTS attendance (
  user_hash TEXT NOT NULL,
  date TEXT NOT NULL,
  PRIMARY KEY (user_hash, date)
);

-- 인덱스: coin_transactions user_hash 조회 최적화
-- (attendance는 PRIMARY KEY가 user_hash로 시작하므로 인덱스 불필요)
CREATE INDEX IF NOT EXISTS idx_coin_tx_user ON coin_transactions(user_hash);
