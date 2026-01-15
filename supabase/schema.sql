-- =============================================
-- AI 短影音助理 - Supabase 資料庫 Schema
-- 請在 Supabase Dashboard > SQL Editor 執行
-- =============================================

-- 1. 建立 ENUM 類型
CREATE TYPE subscription_tier AS ENUM ('free', 'creator', 'pro', 'lifetime');
CREATE TYPE subscription_status AS ENUM ('active', 'canceled', 'past_due', 'trialing');
CREATE TYPE feature_type AS ENUM ('script', 'carousel', 'positioning', 'copy_optimizer', 'topic_ideas');

-- 2. 用戶資料表
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  display_name TEXT,
  avatar_url TEXT,

  -- 訂閱資訊
  subscription_tier subscription_tier DEFAULT 'free',
  subscription_status subscription_status DEFAULT 'active',
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  current_period_end TIMESTAMPTZ,

  -- 額度（分開計算腳本和輪播）
  credits_script INTEGER DEFAULT 5,
  credits_carousel INTEGER DEFAULT 2,
  credits_reset_date TIMESTAMPTZ DEFAULT (date_trunc('month', NOW()) + interval '1 month'),

  -- 時間戳
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 生成記錄表
CREATE TABLE generations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature_type feature_type NOT NULL,
  title TEXT,
  input_data JSONB NOT NULL DEFAULT '{}',
  output_data JSONB NOT NULL DEFAULT '{}',
  model_used TEXT,
  tokens_used INTEGER,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 使用量日誌表
CREATE TABLE usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  feature_type feature_type NOT NULL,
  credits_consumed INTEGER DEFAULT 1,
  generation_id UUID REFERENCES generations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. 建立索引（提升查詢效能）
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_stripe_customer ON profiles(stripe_customer_id);
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_created_at ON generations(created_at DESC);
CREATE INDEX idx_generations_feature_type ON generations(feature_type);
CREATE INDEX idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- 6. 啟用 RLS（Row Level Security）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- 7. RLS 政策：profiles
-- 用戶只能看到自己的資料
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- 用戶只能更新自己的資料（但不能改訂閱等級）
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 8. RLS 政策：generations
-- 用戶只能看到自己的生成記錄
CREATE POLICY "Users can view own generations"
  ON generations FOR SELECT
  USING (auth.uid() = user_id);

-- 用戶只能新增自己的生成記錄
CREATE POLICY "Users can insert own generations"
  ON generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 用戶只能更新自己的生成記錄（標題、收藏）
CREATE POLICY "Users can update own generations"
  ON generations FOR UPDATE
  USING (auth.uid() = user_id);

-- 用戶只能刪除自己的生成記錄
CREATE POLICY "Users can delete own generations"
  ON generations FOR DELETE
  USING (auth.uid() = user_id);

-- 9. RLS 政策：usage_logs
-- 用戶只能看到自己的使用日誌
CREATE POLICY "Users can view own usage logs"
  ON usage_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 用戶只能新增自己的使用日誌
CREATE POLICY "Users can insert own usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 10. 自動建立 profile 的 trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 11. 自動更新 updated_at 的 trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- 12. 消耗額度的函數（原子操作，防止競態條件）
CREATE OR REPLACE FUNCTION public.consume_credit(
  p_user_id UUID,
  p_feature_type feature_type
)
RETURNS JSON AS $$
DECLARE
  v_profile profiles%ROWTYPE;
  v_credit_column TEXT;
  v_current_credits INTEGER;
  v_tier_limit INTEGER;
BEGIN
  -- 決定要扣哪個欄位
  IF p_feature_type IN ('script', 'positioning', 'copy_optimizer', 'topic_ideas') THEN
    v_credit_column := 'credits_script';
  ELSE
    v_credit_column := 'credits_carousel';
  END IF;

  -- 鎖定該用戶的 row（防止競態條件）
  SELECT * INTO v_profile
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'remaining_credits', 0, 'message', '用戶不存在');
  END IF;

  -- 取得目前額度
  IF v_credit_column = 'credits_script' THEN
    v_current_credits := v_profile.credits_script;
  ELSE
    v_current_credits := v_profile.credits_carousel;
  END IF;

  -- 取得方案上限
  SELECT
    CASE v_credit_column
      WHEN 'credits_script' THEN
        CASE v_profile.subscription_tier
          WHEN 'free' THEN 5
          WHEN 'creator' THEN 15
          WHEN 'pro' THEN 100
          WHEN 'lifetime' THEN -1
        END
      WHEN 'credits_carousel' THEN
        CASE v_profile.subscription_tier
          WHEN 'free' THEN 2
          WHEN 'creator' THEN 10
          WHEN 'pro' THEN 50
          WHEN 'lifetime' THEN -1
        END
    END
  INTO v_tier_limit;

  -- lifetime 用戶無限額度
  IF v_tier_limit = -1 THEN
    RETURN json_build_object('success', true, 'remaining_credits', -1, 'message', '無限額度');
  END IF;

  -- 檢查額度
  IF v_current_credits <= 0 THEN
    RETURN json_build_object('success', false, 'remaining_credits', 0, 'message', '額度不足，請升級方案');
  END IF;

  -- 扣除額度
  IF v_credit_column = 'credits_script' THEN
    UPDATE profiles SET credits_script = credits_script - 1 WHERE id = p_user_id;
    v_current_credits := v_current_credits - 1;
  ELSE
    UPDATE profiles SET credits_carousel = credits_carousel - 1 WHERE id = p_user_id;
    v_current_credits := v_current_credits - 1;
  END IF;

  -- 記錄使用日誌
  INSERT INTO usage_logs (user_id, feature_type, credits_consumed)
  VALUES (p_user_id, p_feature_type, 1);

  RETURN json_build_object('success', true, 'remaining_credits', v_current_credits, 'message', '成功');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 重置每月額度的函數（由 Supabase Cron 呼叫）
CREATE OR REPLACE FUNCTION public.reset_monthly_credits()
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET
    credits_script = CASE subscription_tier
      WHEN 'free' THEN 5
      WHEN 'creator' THEN 15
      WHEN 'pro' THEN 100
      WHEN 'lifetime' THEN -1
    END,
    credits_carousel = CASE subscription_tier
      WHEN 'free' THEN 2
      WHEN 'creator' THEN 10
      WHEN 'pro' THEN 50
      WHEN 'lifetime' THEN -1
    END,
    credits_reset_date = date_trunc('month', NOW()) + interval '1 month'
  WHERE credits_reset_date <= NOW()
    AND subscription_tier != 'lifetime';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. 清理過期歷史記錄的函數
CREATE OR REPLACE FUNCTION public.cleanup_expired_generations()
RETURNS void AS $$
BEGIN
  -- 刪除超過保留期限的記錄
  DELETE FROM generations
  WHERE id IN (
    SELECT g.id
    FROM generations g
    JOIN profiles p ON g.user_id = p.id
    WHERE
      -- 免費版：立即刪除（0 天保留）
      (p.subscription_tier = 'free')
      -- 創作者版：30 天後刪除
      OR (p.subscription_tier = 'creator' AND g.created_at < NOW() - interval '30 days')
      -- 專業版：180 天後刪除
      OR (p.subscription_tier = 'pro' AND g.created_at < NOW() - interval '180 days')
      -- lifetime 永久保留，不刪除
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 執行完成後，請在 Supabase Dashboard 設定：
--
-- 1. Authentication > Providers > 啟用 Email 和 Google
-- 2. Database > Extensions > 確認 pgcrypto 已啟用
-- 3. 可選：設定 Cron Job 每月 1 號執行 reset_monthly_credits()
-- =============================================
