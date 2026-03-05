-- MoneyFlows Database Schema
-- Run: psql -d finance_tracker -f database/schema.sql

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for full-text search

-- ============================================================
-- 1. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                    UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name             VARCHAR(100) NOT NULL,
  email                 VARCHAR(255) NOT NULL UNIQUE,
  password_hash         VARCHAR(255) NOT NULL,
  preferred_mode        VARCHAR(20)  NOT NULL DEFAULT 'simple' CHECK (preferred_mode IN ('simple', 'detailed')),
  user_types            JSONB        NOT NULL DEFAULT '[]',
  accessibility_settings JSONB       NOT NULL DEFAULT '{"fontSize": 14, "darkMode": false, "highContrast": false, "screenReader": false, "voiceInput": false}',
  language              VARCHAR(10)  NOT NULL DEFAULT 'en',
  refresh_token         TEXT,
  refresh_token_expires TIMESTAMPTZ,
  monthly_budget        NUMERIC(12, 2),
  is_active             BOOLEAN      NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================
-- 2. CATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS categories (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,  -- NULL = default/system category
  name       VARCHAR(100) NOT NULL,
  slug       VARCHAR(100) NOT NULL,
  emoji      VARCHAR(10),
  color      VARCHAR(20),
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_income  BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);

-- ============================================================
-- 3. SUBCATEGORIES
-- ============================================================
CREATE TABLE IF NOT EXISTS subcategories (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(100) NOT NULL,
  emoji       VARCHAR(10),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);

-- ============================================================
-- 4. TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS transactions (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
  subcategory_id      UUID REFERENCES subcategories(id) ON DELETE SET NULL,
  amount              NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  type                VARCHAR(10) NOT NULL DEFAULT 'expense' CHECK (type IN ('expense', 'income')),
  description         VARCHAR(255),
  merchant_name       VARCHAR(100),
  payment_method      VARCHAR(20) CHECK (payment_method IN ('card', 'cash', 'online', 'other')),
  transaction_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url         TEXT,
  notes               TEXT,
  is_recurring        BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency VARCHAR(20) CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  tags                JSONB NOT NULL DEFAULT '[]',
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user      ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date      ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category  ON transactions(user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_month     ON transactions(user_id, EXTRACT(YEAR FROM transaction_date), EXTRACT(MONTH FROM transaction_date));

-- ============================================================
-- 5. BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  period      VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (period IN ('monthly', 'weekly', 'yearly')),
  month       DATE,           -- NULL = overall budget; DATE truncated to 1st of month
  is_overall  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user     ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_month    ON budgets(user_id, month);

-- ============================================================
-- 6. GOALS
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id   UUID REFERENCES categories(id) ON DELETE SET NULL,
  title         VARCHAR(150) NOT NULL,
  description   TEXT,
  type          VARCHAR(30) NOT NULL DEFAULT 'savings' CHECK (type IN ('savings', 'spending_reduction', 'debt_payoff', 'emergency_fund')),
  target_amount NUMERIC(12, 2) NOT NULL,
  current_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  target_date   DATE,
  status        VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'cancelled')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_goals_user ON goals(user_id);

-- ============================================================
-- 7. SUBSCRIPTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS subscriptions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES categories(id) ON DELETE SET NULL,
  name             VARCHAR(100) NOT NULL,
  amount           NUMERIC(12, 2) NOT NULL,
  frequency        VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  next_billing_date DATE,
  last_billing_date DATE,
  status           VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'paused')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user ON subscriptions(user_id);

-- ============================================================
-- 8. GROUP EXPENSES
-- ============================================================
CREATE TABLE IF NOT EXISTS group_expenses (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       VARCHAR(150) NOT NULL,
  description TEXT,
  total_amount NUMERIC(12, 2) NOT NULL,
  category_id  UUID REFERENCES categories(id) ON DELETE SET NULL,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status      VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'settled', 'cancelled')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_expenses_creator ON group_expenses(created_by);

-- ============================================================
-- 9. GROUP EXPENSE MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS group_expense_members (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  user_id          UUID REFERENCES users(id) ON DELETE SET NULL,
  name             VARCHAR(100) NOT NULL,  -- external person name if no user_id
  email            VARCHAR(255),
  amount_owed      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  amount_paid      NUMERIC(12, 2) NOT NULL DEFAULT 0,
  is_settled       BOOLEAN NOT NULL DEFAULT false,
  settled_at       TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_members_expense ON group_expense_members(group_expense_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user    ON group_expense_members(user_id);

-- ============================================================
-- 10. GROUP EXPENSE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS group_expense_items (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_expense_id UUID NOT NULL REFERENCES group_expenses(id) ON DELETE CASCADE,
  description      VARCHAR(255) NOT NULL,
  amount           NUMERIC(12, 2) NOT NULL,
  paid_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_group_items_expense ON group_expense_items(group_expense_id);

-- ============================================================
-- 11. SHARED BUDGETS
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_budgets (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        VARCHAR(150) NOT NULL,
  description TEXT,
  total_amount NUMERIC(12, 2) NOT NULL,
  period      VARCHAR(20) NOT NULL DEFAULT 'monthly',
  status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 12. SHARED BUDGET MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_budget_members (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_budget_id UUID NOT NULL REFERENCES shared_budgets(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role             VARCHAR(20) NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(shared_budget_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_shared_members_budget ON shared_budget_members(shared_budget_id);
CREATE INDEX IF NOT EXISTS idx_shared_members_user   ON shared_budget_members(user_id);

-- ============================================================
-- 13. SHARED BUDGET TRANSACTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS shared_budget_transactions (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shared_budget_id UUID NOT NULL REFERENCES shared_budgets(id) ON DELETE CASCADE,
  transaction_id   UUID REFERENCES transactions(id) ON DELETE SET NULL,
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount           NUMERIC(12, 2) NOT NULL,
  description      VARCHAR(255),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sbt_budget ON shared_budget_transactions(shared_budget_id);

-- ============================================================
-- 14. INSIGHTS
-- ============================================================
CREATE TABLE IF NOT EXISTS insights (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  type        VARCHAR(50) NOT NULL,  -- 'budget_exceeded', 'spending_spike', 'savings_tip', etc.
  title       VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,
  data        JSONB NOT NULL DEFAULT '{}',
  is_read     BOOLEAN NOT NULL DEFAULT false,
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insights_user   ON insights(user_id, is_read, created_at DESC);

-- ============================================================
-- 15. EXPORT REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS export_requests (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  format      VARCHAR(10) NOT NULL CHECK (format IN ('csv', 'pdf', 'excel')),
  status      VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  file_url    TEXT,
  filters     JSONB NOT NULL DEFAULT '{}',
  expires_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exports_user ON export_requests(user_id, created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','transactions','budgets','goals','subscriptions','group_expenses','shared_budgets','export_requests']
  LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS trg_updated_at ON %I;
      CREATE TRIGGER trg_updated_at BEFORE UPDATE ON %I
      FOR EACH ROW EXECUTE FUNCTION update_updated_at();
    ', t, t);
  END LOOP;
END $$;

-- ============================================================
-- MATERIALIZED VIEWS
-- ============================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS monthly_spending_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', transaction_date)::DATE AS month,
  category_id,
  SUM(amount) AS total_spent,
  COUNT(*) AS transaction_count
FROM transactions
WHERE type = 'expense'
GROUP BY user_id, DATE_TRUNC('month', transaction_date), category_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mss_unique
  ON monthly_spending_summary(user_id, month, category_id);

CREATE MATERIALIZED VIEW IF NOT EXISTS budget_status AS
SELECT
  b.id AS budget_id,
  b.user_id,
  b.category_id,
  b.amount AS budget_amount,
  b.month,
  COALESCE(SUM(t.amount), 0) AS spent,
  b.amount - COALESCE(SUM(t.amount), 0) AS remaining,
  ROUND(COALESCE(SUM(t.amount), 0) / b.amount * 100, 1) AS percentage_used
FROM budgets b
LEFT JOIN transactions t
  ON t.user_id = b.user_id
  AND (b.category_id IS NULL OR t.category_id = b.category_id)
  AND t.type = 'expense'
  AND (b.month IS NULL OR DATE_TRUNC('month', t.transaction_date) = b.month)
GROUP BY b.id, b.user_id, b.category_id, b.amount, b.month;

CREATE UNIQUE INDEX IF NOT EXISTS idx_bs_unique ON budget_status(budget_id);
