import { createClient as createSupabaseClient } from "@/lib/supabase/client";

export interface UserProfile {
  id: string;
  display_name: string;
  company: string;
  role: string;
  default_discount_rate: number;
  default_periods: number;
  default_risk_free_rate: number;
  default_inflation: number;
  default_risk_premium: number;
  irr_method: "newton" | "bisection" | "secant";
  currency: string;
  number_format: string;
  preferred_locale: string;
  email_notifications: boolean;
  project_updates_notifications: boolean;
  weekly_summary_notifications: boolean;
}

export const DEFAULT_USER_PROFILE: Omit<UserProfile, "id"> = {
  display_name: "",
  company: "",
  role: "",
  default_discount_rate: 12,
  default_periods: 10,
  default_risk_free_rate: 4,
  default_inflation: 3,
  default_risk_premium: 5,
  irr_method: "newton",
  currency: "usd",
  number_format: "en-us",
  preferred_locale: "es",
  email_notifications: false,
  project_updates_notifications: true,
  weekly_summary_notifications: false,
};

export async function fetchUserProfile(): Promise<UserProfile | null> {
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return data as UserProfile;
}

export async function upsertUserProfile(
  profile: Partial<Omit<UserProfile, "id">>,
): Promise<UserProfile> {
  const supabase = createSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Session expired. Please log in again.");

  const { data, error } = await supabase
    .from("user_profiles")
    .upsert({ id: user.id, ...profile }, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw error;
  return data as UserProfile;
}
