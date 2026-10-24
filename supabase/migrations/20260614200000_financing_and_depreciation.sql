-- ============================================================
-- Migration: Financing, Depreciation and Chart of Accounts (Sprint 4)
-- Adds loan management, amortization tables, depreciable assets,
-- depreciation schedules, and chart of accounts (PUC).
-- ============================================================

-- 1. Project Loans
CREATE TABLE IF NOT EXISTS "public"."project_loans" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "lender_name" TEXT NOT NULL,
    "principal" NUMERIC NOT NULL,
    "annual_rate" NUMERIC NOT NULL,        -- Tasa nominal o efectiva anual (%)
    "term_periods" INTEGER NOT NULL,       -- Plazo en períodos
    "payment_type" TEXT DEFAULT 'french' NOT NULL
        CHECK ("payment_type" IN ('french', 'german', 'american', 'custom')),
    "grace_periods" INTEGER DEFAULT 0 NOT NULL,
    "start_period" INTEGER DEFAULT 0 NOT NULL,
    "disbursement_schedule" JSONB DEFAULT '[]'::jsonb,
    "account_code" TEXT DEFAULT '',         -- Futuro PUC: ej. '2105'
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "public"."project_loans" OWNER TO "postgres";
CREATE INDEX IF NOT EXISTS "idx_project_loans_project_id" ON "public"."project_loans"("project_id");

-- Trigger updated_at
CREATE OR REPLACE TRIGGER "project_loans_set_updated_at"
    BEFORE UPDATE ON "public"."project_loans"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 2. Loan Amortization Table
CREATE TABLE IF NOT EXISTS "public"."loan_amortization" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "loan_id" UUID NOT NULL REFERENCES "public"."project_loans"("id") ON DELETE CASCADE,
    "period" INTEGER NOT NULL,
    "beginning_balance" NUMERIC NOT NULL,
    "payment" NUMERIC NOT NULL,
    "principal_payment" NUMERIC NOT NULL,
    "interest_payment" NUMERIC NOT NULL,
    "ending_balance" NUMERIC NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "loan_amortization_loan_period_key" UNIQUE ("loan_id", "period")
);

ALTER TABLE "public"."loan_amortization" OWNER TO "postgres";
CREATE INDEX IF NOT EXISTS "idx_loan_amortization_loan_id" ON "public"."loan_amortization"("loan_id");

-- 3. Project Depreciable Assets
CREATE TABLE IF NOT EXISTS "public"."project_assets" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "category" TEXT DEFAULT 'equipment' NOT NULL
        CHECK ("category" IN ('land', 'building', 'equipment', 'vehicle', 'furniture', 'intangible', 'other')),
    "acquisition_cost" NUMERIC NOT NULL,
    "salvage_value" NUMERIC DEFAULT 0 NOT NULL,
    "useful_life_periods" INTEGER NOT NULL,
    "depreciation_method" TEXT DEFAULT 'straight_line' NOT NULL
        CHECK ("depreciation_method" IN ('straight_line', 'declining_balance', 'sum_of_years', 'units_of_production')),
    "acquisition_period" INTEGER DEFAULT 0 NOT NULL,
    "account_code_asset" TEXT DEFAULT '',        -- PUC: '1520' Maquinaria
    "account_code_depreciation" TEXT DEFAULT '', -- PUC: '5260' Depreciación
    "account_code_accumulated" TEXT DEFAULT '',  -- PUC: '1592' Depreciación acumulada
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "public"."project_assets" OWNER TO "postgres";
CREATE INDEX IF NOT EXISTS "idx_project_assets_project_id" ON "public"."project_assets"("project_id");

-- Trigger updated_at
CREATE OR REPLACE TRIGGER "project_assets_set_updated_at"
    BEFORE UPDATE ON "public"."project_assets"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 4. Asset Depreciation Schedules
CREATE TABLE IF NOT EXISTS "public"."asset_depreciation" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "asset_id" UUID NOT NULL REFERENCES "public"."project_assets"("id") ON DELETE CASCADE,
    "period" INTEGER NOT NULL,
    "depreciation_expense" NUMERIC NOT NULL,
    "accumulated_depreciation" NUMERIC NOT NULL,
    "book_value" NUMERIC NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "asset_depreciation_asset_period_key" UNIQUE ("asset_id", "period")
);

ALTER TABLE "public"."asset_depreciation" OWNER TO "postgres";
CREATE INDEX IF NOT EXISTS "idx_asset_depreciation_asset_id" ON "public"."asset_depreciation"("asset_id");

-- 5. Chart of Accounts (PUC foundation)
CREATE TABLE IF NOT EXISTS "public"."chart_of_accounts" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "tenant_id" UUID NOT NULL REFERENCES "public"."tenants"("id") ON DELETE CASCADE,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL CHECK ("type" IN ('asset', 'liability', 'equity', 'revenue', 'expense')),
    "parent_code" TEXT,
    "is_active" BOOLEAN DEFAULT true NOT NULL,
    "metadata" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "chart_of_accounts_tenant_code_key" UNIQUE ("tenant_id", "code")
);

ALTER TABLE "public"."chart_of_accounts" OWNER TO "postgres";
CREATE INDEX IF NOT EXISTS "idx_chart_of_accounts_tenant_id" ON "public"."chart_of_accounts"("tenant_id");

-- 6. Row Level Security (RLS)
ALTER TABLE "public"."project_loans" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."loan_amortization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_assets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."asset_depreciation" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."chart_of_accounts" ENABLE ROW LEVEL SECURITY;

-- project_loans RLS
CREATE POLICY "Users can manage own project loans"
    ON "public"."project_loans" FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "project_loans"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "project_loans"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

-- loan_amortization RLS
CREATE POLICY "Users can manage own loan amortization"
    ON "public"."loan_amortization" FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "public"."project_loans" l
        JOIN "public"."projects" p ON p."id" = l."project_id"
        WHERE l."id" = "loan_amortization"."loan_id"
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."project_loans" l
        JOIN "public"."projects" p ON p."id" = l."project_id"
        WHERE l."id" = "loan_amortization"."loan_id"
        AND p."user_id" = (SELECT auth.uid())
    ));

-- project_assets RLS
CREATE POLICY "Users can manage own project assets"
    ON "public"."project_assets" FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "project_assets"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "project_assets"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

-- asset_depreciation RLS
CREATE POLICY "Users can manage own asset depreciation"
    ON "public"."asset_depreciation" FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "public"."project_assets" a
        JOIN "public"."projects" p ON p."id" = a."project_id"
        WHERE a."id" = "asset_depreciation"."asset_id"
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."project_assets" a
        JOIN "public"."projects" p ON p."id" = a."project_id"
        WHERE a."id" = "asset_depreciation"."asset_id"
        AND p."user_id" = (SELECT auth.uid())
    ));

-- chart_of_accounts RLS (via user_profiles tenant)
CREATE POLICY "Users can manage tenant chart of accounts"
    ON "public"."chart_of_accounts" FOR ALL
    USING (EXISTS (
        SELECT 1 FROM "public"."user_profiles" u
        WHERE u."tenant_id" = "chart_of_accounts"."tenant_id"
        AND u."id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."user_profiles" u
        WHERE u."tenant_id" = "chart_of_accounts"."tenant_id"
        AND u."id" = (SELECT auth.uid())
    ));

-- Grants
GRANT ALL ON TABLE "public"."project_loans" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."loan_amortization" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."project_assets" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."asset_depreciation" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."chart_of_accounts" TO "anon", "authenticated", "service_role";
