-- ============================================================
-- Migration: Lifecycle Foundations
-- Adds phase tracking, project groups (alternatives), and
-- evaluation snapshots to support the full investment lifecycle.
-- ============================================================

-- 1. Extend projects table with lifecycle columns
-- ------------------------------------------------
ALTER TABLE "public"."projects"
    ADD COLUMN IF NOT EXISTS "phase" TEXT DEFAULT 'preinversion' NOT NULL;

ALTER TABLE "public"."projects"
    ADD COLUMN IF NOT EXISTS "lifecycle_status" TEXT DEFAULT 'projected' NOT NULL;

-- Constraints for new columns
ALTER TABLE "public"."projects"
    ADD CONSTRAINT "projects_phase_check"
    CHECK ("phase" IN ('preinversion', 'inversion', 'operacion', 'liquidacion'));

ALTER TABLE "public"."projects"
    ADD CONSTRAINT "projects_lifecycle_status_check"
    CHECK ("lifecycle_status" IN ('projected', 'evaluated', 'in_execution', 'operating', 'closed'));


-- 2. Project Groups (mutually exclusive alternatives)
-- ----------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_groups" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "tenant_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT DEFAULT '',
    "comparison_rate" NUMERIC,                  -- Common discount rate for fair comparison
    "selected_project_id" UUID,                 -- The "winning" alternative (nullable)
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "project_groups_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."project_groups" OWNER TO "postgres";

-- Foreign keys for project_groups
ALTER TABLE ONLY "public"."project_groups"
    ADD CONSTRAINT "project_groups_tenant_id_fkey"
    FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");

ALTER TABLE ONLY "public"."project_groups"
    ADD CONSTRAINT "project_groups_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Index
CREATE INDEX "project_groups_user_id_idx" ON "public"."project_groups" USING "btree" ("user_id");

-- Auto-update trigger
CREATE OR REPLACE TRIGGER "project_groups_set_updated_at"
    BEFORE UPDATE ON "public"."project_groups"
    FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();


-- 3. Project Group Members (links projects to groups with ranking)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_group_members" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "group_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "rank" INTEGER,                             -- User-defined ranking within the group
    "notes" TEXT DEFAULT '',
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT "project_group_members_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "project_group_members_unique" UNIQUE ("group_id", "project_id")
);

ALTER TABLE "public"."project_group_members" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."project_group_members"
    ADD CONSTRAINT "pgm_group_id_fkey"
    FOREIGN KEY ("group_id") REFERENCES "public"."project_groups"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."project_group_members"
    ADD CONSTRAINT "pgm_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

-- Indexes
CREATE INDEX "pgm_group_id_idx" ON "public"."project_group_members" USING "btree" ("group_id");
CREATE INDEX "pgm_project_id_idx" ON "public"."project_group_members" USING "btree" ("project_id");


-- 4. Project Snapshots (immutable evaluation history)
-- ---------------------------------------------------
CREATE TABLE IF NOT EXISTS "public"."project_snapshots" (
    "id" UUID DEFAULT gen_random_uuid() NOT NULL,
    "project_id" UUID NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'snapshot',   -- e.g. 'pre-feasibility', 'final-evaluation', 'v2'
    "snapshot_data" JSONB NOT NULL,             -- Full project state at time of snapshot
    "results" JSONB,                            -- Calculated results at snapshot time
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "created_by" UUID NOT NULL,
    CONSTRAINT "project_snapshots_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "public"."project_snapshots" OWNER TO "postgres";

-- Foreign keys
ALTER TABLE ONLY "public"."project_snapshots"
    ADD CONSTRAINT "project_snapshots_project_id_fkey"
    FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;

ALTER TABLE ONLY "public"."project_snapshots"
    ADD CONSTRAINT "project_snapshots_created_by_fkey"
    FOREIGN KEY ("created_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;

-- Index
CREATE INDEX "project_snapshots_project_id_idx" ON "public"."project_snapshots" USING "btree" ("project_id");


-- 5. Enable RLS on all new tables
-- ---------------------------------
ALTER TABLE "public"."project_groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_snapshots" ENABLE ROW LEVEL SECURITY;


-- 6. RLS Policies — project_groups (owner-based)
-- ------------------------------------------------
CREATE POLICY "Users can read own groups"
    ON "public"."project_groups" FOR SELECT
    USING ("auth"."uid"() = "user_id");

CREATE POLICY "Users can create own groups"
    ON "public"."project_groups" FOR INSERT
    WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Users can update own groups"
    ON "public"."project_groups" FOR UPDATE
    USING ("auth"."uid"() = "user_id")
    WITH CHECK ("auth"."uid"() = "user_id");

CREATE POLICY "Users can delete own groups"
    ON "public"."project_groups" FOR DELETE
    USING ("auth"."uid"() = "user_id");


-- 7. RLS Policies — project_group_members (cascade through group → user)
-- -----------------------------------------------------------------------
CREATE POLICY "Users can read own group members"
    ON "public"."project_group_members" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."project_groups" g
        WHERE g."id" = "project_group_members"."group_id"
        AND g."user_id" = "auth"."uid"()
    ));

CREATE POLICY "Users can insert own group members"
    ON "public"."project_group_members" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."project_groups" g
        WHERE g."id" = "project_group_members"."group_id"
        AND g."user_id" = "auth"."uid"()
    ));

CREATE POLICY "Users can update own group members"
    ON "public"."project_group_members" FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM "public"."project_groups" g
        WHERE g."id" = "project_group_members"."group_id"
        AND g."user_id" = "auth"."uid"()
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."project_groups" g
        WHERE g."id" = "project_group_members"."group_id"
        AND g."user_id" = "auth"."uid"()
    ));

CREATE POLICY "Users can delete own group members"
    ON "public"."project_group_members" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."project_groups" g
        WHERE g."id" = "project_group_members"."group_id"
        AND g."user_id" = "auth"."uid"()
    ));


-- 8. RLS Policies — project_snapshots (cascade through project → user)
-- ---------------------------------------------------------------------
CREATE POLICY "Users can read own snapshots"
    ON "public"."project_snapshots" FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p
        WHERE p."id" = "project_snapshots"."project_id"
        AND p."user_id" = "auth"."uid"()
    ));

CREATE POLICY "Users can create own snapshots"
    ON "public"."project_snapshots" FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM "public"."projects" p
        WHERE p."id" = "project_snapshots"."project_id"
        AND p."user_id" = "auth"."uid"()
    ));

CREATE POLICY "Users can delete own snapshots"
    ON "public"."project_snapshots" FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM "public"."projects" p
        WHERE p."id" = "project_snapshots"."project_id"
        AND p."user_id" = "auth"."uid"()
    ));


-- 9. Grants (matching existing pattern)
-- ----------------------------------------
GRANT ALL ON TABLE "public"."project_groups" TO "anon";
GRANT ALL ON TABLE "public"."project_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."project_groups" TO "service_role";

GRANT ALL ON TABLE "public"."project_group_members" TO "anon";
GRANT ALL ON TABLE "public"."project_group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."project_group_members" TO "service_role";

GRANT ALL ON TABLE "public"."project_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."project_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."project_snapshots" TO "service_role";


-- 10. Migrate existing data — set sensible defaults
-- ---------------------------------------------------
UPDATE "public"."projects"
SET
    "phase" = 'preinversion',
    "lifecycle_status" = CASE
        WHEN "status" = 'completed' THEN 'evaluated'
        WHEN "status" = 'analyzing' THEN 'evaluated'
        ELSE 'projected'
    END
WHERE "phase" IS NULL OR "phase" = 'preinversion';
