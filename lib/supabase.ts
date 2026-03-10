import { createClient } from "@supabase/supabase-js"

// Single Supabase client instance for the entire app.
// Always import from here — never call createClient() directly in page files.
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default supabase
