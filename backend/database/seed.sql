-- MoneyFlows Seed Data — Default Categories & Subcategories
-- Run after schema.sql: psql -d finance_tracker -f database/seed.sql

-- Default expense categories (user_id = NULL means system/global)
INSERT INTO categories (id, user_id, name, slug, emoji, color, is_default, is_income, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', NULL, 'Groceries',      'groceries',      '🛒', '#10B981', true, false, 1),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Dining Out',     'dining',         '🍕', '#F59E0B', true, false, 2),
  ('00000000-0000-0000-0000-000000000003', NULL, 'Shopping',       'shopping',       '🛍️', '#8B5CF6', true, false, 3),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Transportation', 'transportation', '🚗', '#3B82F6', true, false, 4),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Entertainment',  'entertainment',  '🎬', '#EC4899', true, false, 5),
  ('00000000-0000-0000-0000-000000000006', NULL, 'Health',         'health',         '💊', '#EF4444', true, false, 6),
  ('00000000-0000-0000-0000-000000000007', NULL, 'Utilities',      'utilities',      '💡', '#FBBF24', true, false, 7),
  ('00000000-0000-0000-0000-000000000008', NULL, 'Other',          'other',          '📌', '#9CA3AF', true, false, 8),
  -- Income categories
  ('00000000-0000-0000-0000-000000000009', NULL, 'Salary',         'salary',         '💼', '#10B981', true, true,  1),
  ('00000000-0000-0000-0000-000000000010', NULL, 'Freelance',      'freelance',      '💻', '#3B82F6', true, true,  2),
  ('00000000-0000-0000-0000-000000000011', NULL, 'Other Income',   'other-income',   '💰', '#9CA3AF', true, true,  3)
ON CONFLICT DO NOTHING;

-- Default subcategories
INSERT INTO subcategories (category_id, user_id, name, emoji, is_default) VALUES
  -- Groceries
  ('00000000-0000-0000-0000-000000000001', NULL, 'Produce',    '🥦', true),
  ('00000000-0000-0000-0000-000000000001', NULL, 'Dairy',      '🥛', true),
  ('00000000-0000-0000-0000-000000000001', NULL, 'Meat',       '🥩', true),
  ('00000000-0000-0000-0000-000000000001', NULL, 'Bakery',     '🍞', true),
  ('00000000-0000-0000-0000-000000000001', NULL, 'Snacks',     '🍿', true),
  -- Dining Out
  ('00000000-0000-0000-0000-000000000002', NULL, 'Restaurant', '🍽️', true),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Fast Food',  '🍔', true),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Coffee',     '☕', true),
  ('00000000-0000-0000-0000-000000000002', NULL, 'Delivery',   '📦', true),
  -- Shopping
  ('00000000-0000-0000-0000-000000000003', NULL, 'Clothing',   '👕', true),
  ('00000000-0000-0000-0000-000000000003', NULL, 'Electronics','📱', true),
  ('00000000-0000-0000-0000-000000000003', NULL, 'Home',       '🏠', true),
  -- Transportation
  ('00000000-0000-0000-0000-000000000004', NULL, 'Gas',        '⛽', true),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Public Transit', '🚇', true),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Rideshare',  '🚕', true),
  ('00000000-0000-0000-0000-000000000004', NULL, 'Parking',    '🅿️', true),
  -- Entertainment
  ('00000000-0000-0000-0000-000000000005', NULL, 'Streaming',  '📺', true),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Games',      '🎮', true),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Movies',     '🎥', true),
  ('00000000-0000-0000-0000-000000000005', NULL, 'Sports',     '⚽', true),
  -- Health
  ('00000000-0000-0000-0000-000000000006', NULL, 'Pharmacy',   '💊', true),
  ('00000000-0000-0000-0000-000000000006', NULL, 'Doctor',     '🏥', true),
  ('00000000-0000-0000-0000-000000000006', NULL, 'Gym',        '🏋️', true),
  -- Utilities
  ('00000000-0000-0000-0000-000000000007', NULL, 'Electricity','⚡', true),
  ('00000000-0000-0000-0000-000000000007', NULL, 'Internet',   '🌐', true),
  ('00000000-0000-0000-0000-000000000007', NULL, 'Water',      '💧', true),
  ('00000000-0000-0000-0000-000000000007', NULL, 'Phone',      '📱', true)
ON CONFLICT DO NOTHING;
