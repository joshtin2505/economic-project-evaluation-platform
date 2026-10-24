-- ============================================================
-- Migration: Investment Disbursements (Sprint 2)
-- Models multi-period CAPEX disbursement schedule, execution tracking,
-- and links disbursements to investment projects.
-- ============================================================

-- 1. Create investment_disbursements table
CREATE TABLE IF NOT EXISTS "public"."investment_disbursements" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "period" INTEGER NOT NULL,          -- Supports negative periods (-3, -2, -1, 0, 1...)
    "category" TEXT NOT NULL,           -- 'land', 'construction', 'equipment', 'working_capital', 'licenses', 'other'
    "description" TEXT DEFAULT '',
    "planned_amount" NUMERIC DEFAULT 0 NOT NULL,
    "actual_amount" NUMERIC DEFAULT 0,  -- 0 or actual disbursed amount
    "execution_date" DATE,
    "status" TEXT DEFAULT 'pending' NOT NULL 
        CHECK ("status" IN ('pending', 'committed', 'disbursed', 'cancelled')),
    "account_code" TEXT DEFAULT '',     -- Optional PUC code: e.g., '1520'
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "public"."investment_disbursements" OWNER TO "postgres";

-- Constraints
ALTER TABLE "public"."investment_disbursements"
    ADD CONSTRAINT "disbursements_category_check"
    CHECK ("category" IN ('land', 'construction', 'equipment', 'working_capital', 'licenses', 'other'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "idx_disbursements_project" ON "public"."investment_disbursements"("project_id");
CREATE INDEX IF NOT EXISTS "idx_disbursements_period" ON "public"."investment_disbursements"("project_id", "period");

-- Auto-update trigger for updated_at
CREATE OR REPLACE TRIGGER "disbursements_set_updated_at"
    BEFORE UPDATE ON "public"."investment_disbursements"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 2. Row Level Security (RLS)
ALTER TABLE "public"."investment_disbursements" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own investment disbursements"
    ON "public"."investment_disbursements" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "investment_disbursements"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can insert own investment disbursements"
    ON "public"."investment_disbursements" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "investment_disbursements"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can update own investment disbursements"
    ON "public"."investment_disbursements" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "investment_disbursements"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "investment_disbursements"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can delete own investment disbursements"
    ON "public"."investment_disbursements" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "investment_disbursements"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

-- Grants
GRANT ALL ON TABLE "public"."investment_disbursements" TO "anon";
GRANT ALL ON TABLE "public"."investment_disbursements" TO "authenticated";
GRANT ALL ON TABLE "public"."investment_disbursements" TO "service_role";

-- 3. Migration of existing data
-- For every project with initial_investment > 0, insert a disbursement at period 0
INSERT INTO "public"."investment_disbursements" (
    "project_id",
    "period",
    "category",
    "description",
    "planned_amount",
    "actual_amount",
    "status"
)
SELECT 
    p."id",
    0,
    'other',
    'Inversión inicial consolidada (migrada desde MVP)',
    COALESCE(p."initial_investment", 0),
    COALESCE(p."initial_investment", 0),
    'disbursed'
FROM "public"."projects" p
WHERE COALESCE(p."initial_investment", 0) > 0
  AND NOT EXISTS (
      SELECT 1 FROM "public"."investment_disbursements" d
      WHERE d."project_id" = p."id"
  );
