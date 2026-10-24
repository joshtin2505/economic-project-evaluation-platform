-- ============================================================
-- Migration: Actual Flows and Scenarios (Sprint 3)
-- Extends cash_flows for actuals tracking and adds tables for
-- scenario modeling and sensitivity analysis.
-- ============================================================

-- 1. Extend cash_flows table
ALTER TABLE "public"."cash_flows"
    ADD COLUMN IF NOT EXISTS "flow_type" TEXT DEFAULT 'projected' NOT NULL,
    ADD COLUMN IF NOT EXISTS "account_code" TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "notes" TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS "recorded_at" TIMESTAMPTZ DEFAULT now();

-- Constraint for flow_type
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'cash_flows_flow_type_check'
    ) THEN
        ALTER TABLE "public"."cash_flows"
            ADD CONSTRAINT "cash_flows_flow_type_check"
            CHECK ("flow_type" IN ('projected', 'actual'));
    END IF;
END $$;

-- Index on flow_type
CREATE INDEX IF NOT EXISTS "idx_cash_flows_flow_type" ON "public"."cash_flows"("project_id", "flow_type");

-- 2. Scenarios table
CREATE TABLE IF NOT EXISTS "public"."scenarios" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "name" TEXT NOT NULL,
    "type" TEXT DEFAULT 'custom' NOT NULL
        CHECK ("type" IN ('base', 'optimistic', 'pessimistic', 'expected', 'custom')),
    "description" TEXT DEFAULT '',
    "probability" NUMERIC DEFAULT 0 NOT NULL
        CHECK ("probability" >= 0 AND "probability" <= 100),
    "parameters" JSONB DEFAULT '{}'::jsonb NOT NULL,
    "results" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "public"."scenarios" OWNER TO "postgres";

-- Unique index for standard scenarios (allows multiple custom scenarios)
CREATE UNIQUE INDEX IF NOT EXISTS "idx_unique_project_standard_scenario" 
    ON "public"."scenarios"("project_id", "type") 
    WHERE "type" != 'custom';

CREATE INDEX IF NOT EXISTS "idx_scenarios_project_id" ON "public"."scenarios"("project_id");

-- Auto-update trigger for updated_at
CREATE OR REPLACE TRIGGER "scenarios_set_updated_at"
    BEFORE UPDATE ON "public"."scenarios"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();

-- 3. Scenario Cash Flows table
CREATE TABLE IF NOT EXISTS "public"."scenario_cash_flows" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "scenario_id" UUID NOT NULL REFERENCES "public"."scenarios"("id") ON DELETE CASCADE,
    "period" INTEGER NOT NULL,
    "inflow" NUMERIC DEFAULT 0 NOT NULL,
    "outflow" NUMERIC DEFAULT 0 NOT NULL,
    "variance_pct" NUMERIC DEFAULT 0 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "scenario_cash_flows_scenario_period_key" UNIQUE ("scenario_id", "period")
);

ALTER TABLE "public"."scenario_cash_flows" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "idx_scenario_cash_flows_scenario_id" ON "public"."scenario_cash_flows"("scenario_id");

-- 4. Sensitivity Variables table
CREATE TABLE IF NOT EXISTS "public"."sensitivity_variables" (
    "id" UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    "project_id" UUID NOT NULL REFERENCES "public"."projects"("id") ON DELETE CASCADE,
    "variable_name" TEXT NOT NULL,
    "base_value" NUMERIC NOT NULL,
    "min_value" NUMERIC NOT NULL,
    "max_value" NUMERIC NOT NULL,
    "step_size" NUMERIC DEFAULT 1 NOT NULL,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

ALTER TABLE "public"."sensitivity_variables" OWNER TO "postgres";

CREATE INDEX IF NOT EXISTS "idx_sensitivity_variables_project_id" ON "public"."sensitivity_variables"("project_id");

-- 5. Row Level Security (RLS)
ALTER TABLE "public"."scenarios" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."scenario_cash_flows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sensitivity_variables" ENABLE ROW LEVEL SECURITY;

-- Scenarios RLS
CREATE POLICY "Users can read own scenarios"
    ON "public"."scenarios" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "scenarios"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can insert own scenarios"
    ON "public"."scenarios" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "scenarios"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can update own scenarios"
    ON "public"."scenarios" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "scenarios"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "scenarios"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can delete own scenarios"
    ON "public"."scenarios" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "scenarios"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

-- Scenario Cash Flows RLS (cascade through scenario -> project)
CREATE POLICY "Users can read own scenario cash flows"
    ON "public"."scenario_cash_flows" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."scenarios" s
        JOIN "public"."projects" p ON p."id" = s."project_id"
        WHERE s."id" = "scenario_cash_flows"."scenario_id"
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can insert own scenario cash flows"
    ON "public"."scenario_cash_flows" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."scenarios" s
        JOIN "public"."projects" p ON p."id" = s."project_id"
        WHERE s."id" = "scenario_cash_flows"."scenario_id"
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can update own scenario cash flows"
    ON "public"."scenario_cash_flows" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."scenarios" s
        JOIN "public"."projects" p ON p."id" = s."project_id"
        WHERE s."id" = "scenario_cash_flows"."scenario_id"
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."scenarios" s
        JOIN "public"."projects" p ON p."id" = s."project_id"
        WHERE s."id" = "scenario_cash_flows"."scenario_id"
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can delete own scenario cash flows"
    ON "public"."scenario_cash_flows" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."scenarios" s
        JOIN "public"."projects" p ON p."id" = s."project_id"
        WHERE s."id" = "scenario_cash_flows"."scenario_id"
        AND p."user_id" = (SELECT auth.uid())
    ));

-- Sensitivity Variables RLS
CREATE POLICY "Users can read own sensitivity variables"
    ON "public"."sensitivity_variables" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "sensitivity_variables"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can insert own sensitivity variables"
    ON "public"."sensitivity_variables" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "sensitivity_variables"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can update own sensitivity variables"
    ON "public"."sensitivity_variables" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "sensitivity_variables"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "sensitivity_variables"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

CREATE POLICY "Users can delete own sensitivity variables"
    ON "public"."sensitivity_variables" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p 
        WHERE p."id" = "sensitivity_variables"."project_id" 
        AND p."user_id" = (SELECT auth.uid())
    ));

-- Grants
GRANT ALL ON TABLE "public"."scenarios" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."scenario_cash_flows" TO "anon", "authenticated", "service_role";
GRANT ALL ON TABLE "public"."sensitivity_variables" TO "anon", "authenticated", "service_role";
