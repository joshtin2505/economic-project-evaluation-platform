


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."create_tenant_and_profile"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  t_id uuid;
  display text := coalesce(new.user_metadata->> 'full_name', split_part(new.email, '@', 1));
  tenant_slug text := lower(regexp_replace(split_part(new.email, '@', 2), '[^a-z0-9]+', '-', 'g'));
begin
  -- Create a tenant for the new user
  insert into public.tenants (name, slug)
    values (display, tenant_slug)
    returning id into t_id;

  -- Create a user_profiles row linked to the created tenant
  insert into public.user_profiles (id, display_name, company, role, tenant_id)
    values (new.id, display, '', '', t_id)
    on conflict (id) do nothing;

  return new;
end;
$$;


ALTER FUNCTION "public"."create_tenant_and_profile"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION "public"."set_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_has_tenant_access"("p_tenant_id" "uuid") RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1 from public.user_profiles up
    where up.id = auth.uid() and up.tenant_id = p_tenant_id
  );
$$;


ALTER FUNCTION "public"."user_has_tenant_access"("p_tenant_id" "uuid") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."cash_flows" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "project_id" "uuid" NOT NULL,
    "period" integer NOT NULL,
    "inflow" numeric DEFAULT 0 NOT NULL,
    "outflow" numeric DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "source" "text" DEFAULT 'manual'::"text" NOT NULL,
    CONSTRAINT "cash_flows_source_check" CHECK (("source" = ANY (ARRAY['manual'::"text", 'from_accounting'::"text"])))
);


ALTER TABLE "public"."cash_flows" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."projects" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text" DEFAULT ''::"text",
    "initial_investment" numeric DEFAULT 0 NOT NULL,
    "periods" integer DEFAULT 1 NOT NULL,
    "discount_rate" numeric DEFAULT 0 NOT NULL,
    "inflation" numeric DEFAULT 0 NOT NULL,
    "risk_premium" numeric DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "results" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tmar_method" "text" DEFAULT 'simple'::"text" NOT NULL,
    "funding_sources" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "use_tmar_as_discount_rate" boolean DEFAULT false,
    "salvage_value" numeric DEFAULT '0'::numeric,
    "tenant_id" "uuid" DEFAULT '53f2fcec-2fa7-4678-a9b8-7f9cf1c38e6e'::"uuid",
    CONSTRAINT "projects_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'analyzing'::"text", 'completed'::"text"]))),
    CONSTRAINT "projects_tmar_method_check" CHECK (("tmar_method" = ANY (ARRAY['simple'::"text", 'mixta'::"text"])))
);


ALTER TABLE "public"."projects" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tenants" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "settings" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."tenants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "display_name" "text" DEFAULT ''::"text",
    "company" "text" DEFAULT ''::"text",
    "role" "text" DEFAULT ''::"text",
    "default_discount_rate" numeric DEFAULT 12 NOT NULL,
    "default_periods" integer DEFAULT 10 NOT NULL,
    "default_risk_free_rate" numeric DEFAULT 4 NOT NULL,
    "default_inflation" numeric DEFAULT 3 NOT NULL,
    "default_risk_premium" numeric DEFAULT 5 NOT NULL,
    "irr_method" "text" DEFAULT 'newton'::"text" NOT NULL,
    "currency" "text" DEFAULT 'usd'::"text" NOT NULL,
    "number_format" "text" DEFAULT 'en-us'::"text" NOT NULL,
    "preferred_locale" "text" DEFAULT 'es'::"text" NOT NULL,
    "email_notifications" boolean DEFAULT false NOT NULL,
    "project_updates_notifications" boolean DEFAULT true NOT NULL,
    "weekly_summary_notifications" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "tenant_id" "uuid",
    "business_type" "text" DEFAULT 'freelancer'::"text" NOT NULL,
    "annual_revenue" numeric DEFAULT 0 NOT NULL,
    "tax_jurisdiction" "text" DEFAULT ''::"text",
    "accounting_method" "text" DEFAULT 'cash'::"text" NOT NULL,
    CONSTRAINT "user_profiles_accounting_method_check" CHECK (("accounting_method" = ANY (ARRAY['cash'::"text", 'accrual'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "user_profiles_business_type_check" CHECK (("business_type" = ANY (ARRAY['freelancer'::"text", 'small_business'::"text", 'agency'::"text", 'startup'::"text"]))),
    CONSTRAINT "user_profiles_irr_method_check" CHECK (("irr_method" = ANY (ARRAY['newton'::"text", 'bisection'::"text", 'secant'::"text"])))
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";


ALTER TABLE ONLY "public"."cash_flows"
    ADD CONSTRAINT "cash_flows_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tenants"
    ADD CONSTRAINT "tenants_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");



CREATE INDEX "cash_flows_project_id_idx" ON "public"."cash_flows" USING "btree" ("project_id");



CREATE INDEX "projects_user_id_idx" ON "public"."projects" USING "btree" ("user_id");



CREATE INDEX "tenants_slug_idx" ON "public"."tenants" USING "btree" ("slug");



CREATE INDEX "user_profiles_tenant_idx" ON "public"."user_profiles" USING "btree" ("tenant_id");



CREATE OR REPLACE TRIGGER "projects_set_updated_at" BEFORE UPDATE ON "public"."projects" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



CREATE OR REPLACE TRIGGER "user_profiles_set_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();



ALTER TABLE ONLY "public"."cash_flows"
    ADD CONSTRAINT "cash_flows_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



ALTER TABLE ONLY "public"."projects"
    ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id");



CREATE POLICY "Users can create own projects" ON "public"."projects" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete own cash flows" ON "public"."cash_flows" FOR DELETE USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "cash_flows"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can delete own projects" ON "public"."projects" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert own cash flows" ON "public"."cash_flows" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "cash_flows"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can insert own profile" ON "public"."user_profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own cash flows" ON "public"."cash_flows" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "cash_flows"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can read own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can read own projects" ON "public"."projects" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own cash flows" ON "public"."cash_flows" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "cash_flows"."project_id") AND ("p"."user_id" = "auth"."uid"()))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."projects" "p"
  WHERE (("p"."id" = "cash_flows"."project_id") AND ("p"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Users can update own projects" ON "public"."projects" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."cash_flows" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."create_tenant_and_profile"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_tenant_and_profile"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_tenant_and_profile"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_has_tenant_access"("p_tenant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."user_has_tenant_access"("p_tenant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_has_tenant_access"("p_tenant_id" "uuid") TO "service_role";


















GRANT ALL ON TABLE "public"."cash_flows" TO "anon";
GRANT ALL ON TABLE "public"."cash_flows" TO "authenticated";
GRANT ALL ON TABLE "public"."cash_flows" TO "service_role";



GRANT ALL ON TABLE "public"."projects" TO "anon";
GRANT ALL ON TABLE "public"."projects" TO "authenticated";
GRANT ALL ON TABLE "public"."projects" TO "service_role";



GRANT ALL ON TABLE "public"."tenants" TO "anon";
GRANT ALL ON TABLE "public"."tenants" TO "authenticated";
GRANT ALL ON TABLE "public"."tenants" TO "service_role";



GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER create_tenant_and_profile_trigger AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.create_tenant_and_profile();


