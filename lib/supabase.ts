import { createClient } from "@supabase/supabase-js"

// Log environment variables (redacted for security)
console.log("Supabase URL configured:", !!process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("Supabase Key configured:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Test connection function
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase.from("people").select("id").limit(1)

    if (error) {
      console.error("Supabase connection test failed:", error)
      return false
    }

    console.log("Supabase connection test successful")
    return true
  } catch (error) {
    console.error("Supabase connection test error:", error)
    return false
  }
}

