-- =============================================
-- AI 短影音助理 - 管理員後台 Schema
-- 請在 Supabase Dashboard > SQL Editor 執行
-- =============================================

-- 1. 建立 API 成本追蹤表
CREATE TABLE IF NOT EXISTS api_cost_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  feature_type feature_type NOT NULL,
  model_name TEXT NOT NULL,
  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  cost_usd DECIMAL(10, 6) DEFAULT 0,
  cost_twd DECIMAL(10, 2) DEFAULT 0,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 建立索引
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_created_at ON api_cost_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_user_id ON api_cost_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_model_name ON api_cost_logs(model_name);
CREATE INDEX IF NOT EXISTS idx_api_cost_logs_feature_type ON api_cost_logs(feature_type);

-- 3. 在 profiles 表加入 is_admin 欄位
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 4. RLS 政策：api_cost_logs
ALTER TABLE api_cost_logs ENABLE ROW LEVEL SECURITY;

-- 用戶只能看到自己的成本記錄
CREATE POLICY "Users can view own cost logs"
  ON api_cost_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 管理員可以看到所有成本記錄
CREATE POLICY "Admins can view all cost logs"
  ON api_cost_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Service role 可以新增記錄
CREATE POLICY "Service can insert cost logs"
  ON api_cost_logs FOR INSERT
  WITH CHECK (TRUE);

-- 5. 管理員可以查看所有用戶的 RLS 政策
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- 刪除舊的政策（如果存在）
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;

-- 6. 管理員儀表板統計 View
CREATE OR REPLACE VIEW admin_stats AS
SELECT
  -- 用戶統計
  (SELECT COUNT(*) FROM profiles) as total_users,
  (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'free') as free_users,
  (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'creator') as creator_users,
  (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'pro') as pro_users,
  (SELECT COUNT(*) FROM profiles WHERE subscription_tier = 'lifetime') as lifetime_users,

  -- 本月統計
  (SELECT COUNT(*) FROM profiles WHERE created_at >= date_trunc('month', NOW())) as new_users_this_month,
  (SELECT COUNT(*) FROM generations WHERE created_at >= date_trunc('month', NOW())) as generations_this_month,

  -- 成本統計
  (SELECT COALESCE(SUM(cost_usd), 0) FROM api_cost_logs) as total_cost_usd,
  (SELECT COALESCE(SUM(cost_usd), 0) FROM api_cost_logs WHERE created_at >= date_trunc('month', NOW())) as cost_this_month_usd,
  (SELECT COALESCE(SUM(cost_usd), 0) FROM api_cost_logs WHERE created_at >= date_trunc('day', NOW())) as cost_today_usd;

-- 7. 模型成本統計 View
CREATE OR REPLACE VIEW model_cost_stats AS
SELECT
  model_name,
  COUNT(*) as call_count,
  SUM(input_tokens) as total_input_tokens,
  SUM(output_tokens) as total_output_tokens,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as total_cost_usd,
  SUM(cost_twd) as total_cost_twd,
  AVG(cost_usd) as avg_cost_per_call_usd
FROM api_cost_logs
GROUP BY model_name
ORDER BY total_cost_usd DESC;

-- 8. 每日成本統計 View
CREATE OR REPLACE VIEW daily_cost_stats AS
SELECT
  DATE(created_at) as date,
  model_name,
  COUNT(*) as call_count,
  SUM(total_tokens) as total_tokens,
  SUM(cost_usd) as cost_usd,
  SUM(cost_twd) as cost_twd
FROM api_cost_logs
WHERE created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), model_name
ORDER BY date DESC, cost_usd DESC;

-- 9. 用戶成本統計 View
CREATE OR REPLACE VIEW user_cost_stats AS
SELECT
  p.id as user_id,
  p.email,
  p.display_name,
  p.subscription_tier,
  COUNT(a.id) as total_api_calls,
  COALESCE(SUM(a.total_tokens), 0) as total_tokens,
  COALESCE(SUM(a.cost_usd), 0) as total_cost_usd,
  COALESCE(SUM(a.cost_twd), 0) as total_cost_twd
FROM profiles p
LEFT JOIN api_cost_logs a ON p.id = a.user_id
GROUP BY p.id, p.email, p.display_name, p.subscription_tier
ORDER BY total_cost_usd DESC;

-- 10. 給 View 加上 RLS（只有管理員可存取）
-- Note: Views 繼承基礎表的 RLS，所以管理員才能看到

-- =============================================
-- 11. 訂閱收入追蹤表（記錄每筆付款）
-- =============================================

CREATE TYPE payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
CREATE TYPE payment_type AS ENUM ('subscription', 'one_time', 'lifetime');

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  -- 付款資訊
  payment_type payment_type NOT NULL,
  amount_twd DECIMAL(10, 2) NOT NULL,
  amount_usd DECIMAL(10, 2),
  currency TEXT DEFAULT 'TWD',

  -- 訂閱資訊
  subscription_tier subscription_tier,
  billing_period TEXT, -- 'monthly', 'yearly', 'lifetime'

  -- Stripe 資訊（如果使用 Stripe）
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_invoice_id TEXT,
  stripe_subscription_id TEXT,

  -- 狀態
  status payment_status DEFAULT 'pending',

  -- 時間
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- 備註
  notes TEXT
);

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_created_at ON payment_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_logs_status ON payment_logs(status);
CREATE INDEX IF NOT EXISTS idx_payment_logs_payment_type ON payment_logs(payment_type);

-- RLS 政策
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- 用戶只能看到自己的付款記錄
CREATE POLICY "Users can view own payment logs"
  ON payment_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 管理員可以看到所有付款記錄
CREATE POLICY "Admins can view all payment logs"
  ON payment_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = TRUE
    )
  );

-- Service role 可以新增/更新記錄
CREATE POLICY "Service can manage payment logs"
  ON payment_logs FOR ALL
  WITH CHECK (TRUE);

-- =============================================
-- 12. 收入統計 View
-- =============================================

CREATE OR REPLACE VIEW revenue_stats AS
SELECT
  -- 總收入
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed') as total_revenue_twd,
  (SELECT COALESCE(SUM(amount_usd), 0) FROM payment_logs WHERE status = 'completed') as total_revenue_usd,

  -- 本月收入
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND created_at >= date_trunc('month', NOW())) as revenue_this_month_twd,

  -- 今日收入
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND created_at >= date_trunc('day', NOW())) as revenue_today_twd,

  -- 付款筆數
  (SELECT COUNT(*) FROM payment_logs WHERE status = 'completed') as total_payments,
  (SELECT COUNT(*) FROM payment_logs WHERE status = 'completed' AND created_at >= date_trunc('month', NOW())) as payments_this_month,

  -- 各方案收入
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND subscription_tier = 'creator') as creator_revenue_twd,
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND subscription_tier = 'pro') as pro_revenue_twd,
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND subscription_tier = 'lifetime') as lifetime_revenue_twd;

-- =============================================
-- 13. 每月收入統計 View
-- =============================================

CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  DATE_TRUNC('month', created_at) as month,
  subscription_tier,
  COUNT(*) as payment_count,
  SUM(amount_twd) as total_revenue_twd,
  SUM(amount_usd) as total_revenue_usd
FROM payment_logs
WHERE status = 'completed'
GROUP BY DATE_TRUNC('month', created_at), subscription_tier
ORDER BY month DESC, total_revenue_twd DESC;

-- =============================================
-- 14. 利潤計算 View（收入 - API 成本）
-- =============================================

CREATE OR REPLACE VIEW profit_stats AS
SELECT
  -- 總利潤
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed') -
  (SELECT COALESCE(SUM(cost_twd), 0) FROM api_cost_logs) as total_profit_twd,

  -- 本月利潤
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND created_at >= date_trunc('month', NOW())) -
  (SELECT COALESCE(SUM(cost_twd), 0) FROM api_cost_logs WHERE created_at >= date_trunc('month', NOW())) as profit_this_month_twd,

  -- 今日利潤
  (SELECT COALESCE(SUM(amount_twd), 0) FROM payment_logs WHERE status = 'completed' AND created_at >= date_trunc('day', NOW())) -
  (SELECT COALESCE(SUM(cost_twd), 0) FROM api_cost_logs WHERE created_at >= date_trunc('day', NOW())) as profit_today_twd;

-- =============================================
-- 設定管理員：
-- UPDATE profiles SET is_admin = TRUE WHERE email = 'your-admin@email.com';
-- =============================================
