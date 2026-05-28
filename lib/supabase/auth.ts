import { createClient as createSupabaseClient } from "./client"

export async function signIn(email: string, password: string) {
  const supabase = createSupabaseClient()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signUp(email: string, password: string) {
  const supabase = createSupabaseClient()
  return supabase.auth.signUp({ email, password })
}

export async function signOut() {
  const supabase = createSupabaseClient()
  return supabase.auth.signOut()
}

export async function getUser() {
  const supabase = createSupabaseClient()
  const { data } = await supabase.auth.getUser()
  return data.user
}
