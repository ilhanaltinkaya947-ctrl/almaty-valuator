# Supabase Integration

## Purpose
Database, auth, storage, and realtime for Almaty Valuator. This skill covers setup patterns specific to Next.js 14 App Router.

## Client Setup
Three separate clients for different contexts:

### Browser Client (`lib/supabase/client.ts`)
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### Server Client (`lib/supabase/server.ts`)
For Server Components and Route Handlers:
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}
```

### Admin Client (`lib/supabase/admin.ts`)
For server-only operations that bypass RLS (scraper, WhatsApp webhook):
```typescript
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
```
NEVER import admin client in client components or expose service role key.

## Required Packages
```bash
npm install @supabase/supabase-js @supabase/ssr
```

## Migrations
Place SQL files in `supabase/migrations/` with numeric prefix.

### 001_complexes.sql
```sql
CREATE TYPE housing_class AS ENUM (
  'elite', 'business_plus', 'business',
  'comfort_plus', 'comfort', 'standard'
);

CREATE TABLE complexes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  developer TEXT,
  class housing_class NOT NULL DEFAULT 'standard',
  coefficient DECIMAL(3,2) NOT NULL DEFAULT 1.00,
  year_built INTEGER,
  total_floors INTEGER,
  image_url TEXT,
  map_lat DECIMAL(10,7),
  map_lng DECIMAL(10,7),
  liquidity_index DECIMAL(3,2) DEFAULT 0.50,
  avg_price_sqm INTEGER,
  krisha_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_complexes_name ON complexes USING gin(name gin_trgm_ops);
CREATE INDEX idx_complexes_district ON complexes(district);
```

### 002_leads.sql
```sql
CREATE TYPE lead_status AS ENUM (
  'new', 'contacted', 'in_progress', 'closed_won', 'closed_lost'
);
CREATE TYPE lead_source AS ENUM (
  'landing', 'telegram', 'direct', 'manual'
);

CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  name TEXT,
  complex_id UUID REFERENCES complexes(id),
  area_sqm DECIMAL(6,2),
  floor INTEGER,
  estimated_price BIGINT,
  status lead_status DEFAULT 'new',
  source lead_source DEFAULT 'landing',
  broker_id UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  contacted_at TIMESTAMPTZ
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_broker ON leads(broker_id);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
```

### 003_evaluations.sql
```sql
CREATE TABLE evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  complex_id UUID REFERENCES complexes(id),
  params JSONB NOT NULL,
  final_price BIGINT NOT NULL,
  price_per_sqm INTEGER NOT NULL,
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_evaluations_lead ON evaluations(lead_id);
```

### 004_config.sql
```sql
CREATE TABLE config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO config (key, value) VALUES
  ('base_rate', '738300'),
  ('market_growth_pct', '9'),
  ('pdf_broker_name', '"Ваш персональный брокер"'),
  ('pdf_broker_phone', '"+77001234567"');
```

### 005_rls_policies.sql
```sql
-- Complexes: public read
ALTER TABLE complexes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read complexes" ON complexes FOR SELECT USING (true);
CREATE POLICY "Admin write complexes" ON complexes FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');

-- Leads: brokers see own, admin sees all
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Brokers see own leads" ON leads FOR SELECT
  USING (broker_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Anyone can insert leads" ON leads FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Brokers update own leads" ON leads FOR UPDATE
  USING (broker_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin');

-- Evaluations: follow lead access
ALTER TABLE evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read evaluations via lead" ON evaluations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM leads WHERE leads.id = evaluations.lead_id
    AND (leads.broker_id = auth.uid() OR auth.jwt() ->> 'role' = 'admin')
  ));
CREATE POLICY "Anyone can insert evaluations" ON evaluations FOR INSERT
  WITH CHECK (true);

-- Config: public read
ALTER TABLE config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read config" ON config FOR SELECT USING (true);
CREATE POLICY "Admin write config" ON config FOR ALL
  USING (auth.jwt() ->> 'role' = 'admin');
```

## TypeScript Types
Generate from Supabase CLI:
```bash
npx supabase gen types typescript --linked > src/types/database.ts
```
Or maintain manually in `src/types/` matching the schema above.

## Common Patterns

### Fetching complexes with search (Server Component)
```typescript
const supabase = await createClient();
const { data } = await supabase
  .from("complexes")
  .select("*")
  .ilike("name", `%${query}%`)
  .order("coefficient", { ascending: false });
```

### Creating a lead (API Route)
```typescript
const { data, error } = await supabaseAdmin
  .from("leads")
  .insert({ phone, name, complex_id, area_sqm, floor, estimated_price, source: "landing" })
  .select()
  .single();
```

### Reading config
```typescript
const { data } = await supabase
  .from("config")
  .select("value")
  .eq("key", "base_rate")
  .single();
const baseRate = Number(data?.value);
```
