-- ══════════════════════════════════════════════════
-- 015: CRM Pipeline statuses + Profiles (RBAC)
--
-- Pipeline: new → in_progress → price_approved →
--   jurist_approved → director_approved →
--   deal_progress → paid | rejected
-- ══════════════════════════════════════════════════

-- ── 1. User role enum ──

CREATE TYPE user_role AS ENUM (
  'admin',
  'manager',
  'jurist',
  'director',
  'cashier'
);

-- ── 2. Profiles table (linked to Supabase Auth) ──

CREATE TABLE profiles (
  id        uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role      user_role NOT NULL DEFAULT 'manager',
  full_name text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ── 3. Replace lead_status enum with pipeline statuses ──

-- Create new enum
CREATE TYPE lead_status_v2 AS ENUM (
  'new',
  'in_progress',
  'price_approved',
  'jurist_approved',
  'director_approved',
  'deal_progress',
  'paid',
  'rejected'
);

-- Migrate leads.status column
ALTER TABLE leads
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE leads
  ALTER COLUMN status TYPE lead_status_v2
  USING (
    CASE status::text
      WHEN 'new'         THEN 'new'::lead_status_v2
      WHEN 'contacted'   THEN 'in_progress'::lead_status_v2
      WHEN 'in_progress' THEN 'in_progress'::lead_status_v2
      WHEN 'closed_won'  THEN 'paid'::lead_status_v2
      WHEN 'closed_lost' THEN 'rejected'::lead_status_v2
      WHEN 'pending_review' THEN 'new'::lead_status_v2
      ELSE 'new'::lead_status_v2
    END
  );

ALTER TABLE leads
  ALTER COLUMN status SET DEFAULT 'new'::lead_status_v2;

-- Drop old enum, rename new one
DROP TYPE lead_status;
ALTER TYPE lead_status_v2 RENAME TO lead_status;

-- ── 4. Add assigned_to column to leads ──

ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads (assigned_to);

-- ── 5. RLS policies for profiles ──

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all profiles (needed for assignment dropdowns)
CREATE POLICY profiles_select ON profiles
  FOR SELECT USING (true);

-- Users can update only their own profile
CREATE POLICY profiles_update_own ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Admins can update any profile
CREATE POLICY profiles_update_admin ON profiles
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Only the trigger inserts profiles (on signup)
CREATE POLICY profiles_insert ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
