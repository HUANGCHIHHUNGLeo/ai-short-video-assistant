-- =============================================
-- 訪客使用追蹤 - 補充 Schema
-- 請在 Supabase Dashboard > SQL Editor 執行
-- =============================================

-- 1. 修改 usage_logs 表：允許 user_id 為空，加入 guest_ip
ALTER TABLE usage_logs ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE usage_logs ADD COLUMN IF NOT EXISTS guest_ip TEXT;

-- 2. 建立 guest_ip 索引
CREATE INDEX IF NOT EXISTS idx_usage_logs_guest_ip ON usage_logs(guest_ip);

-- 3. 修改 RLS 政策：允許 Service Role 插入訪客記錄
DROP POLICY IF EXISTS "Users can insert own usage logs" ON usage_logs;

CREATE POLICY "Users can insert own usage logs"
  ON usage_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR user_id IS NULL  -- 允許訪客記錄
  );

-- Service role 可以管理所有記錄
CREATE POLICY "Service can manage usage logs"
  ON usage_logs FOR ALL
  USING (TRUE)
  WITH CHECK (TRUE);

-- 4. 修改 profiles 表：加入已使用額度欄位（如果不存在）
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS script_credits_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS carousel_credits_used INTEGER DEFAULT 0;

-- =============================================
-- 執行完成！
-- =============================================
