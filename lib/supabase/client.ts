import { createBrowserClient } from "@supabase/ssr";

let clientInstance: any = null;

export function createClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_PROJECT_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_API_KEY;

  if (
    !supabaseUrl ||
    !supabaseKey ||
    supabaseUrl.includes("your-project-ref") ||
    supabaseUrl.includes("your-project-id")
  ) {
    return null;
  }

  if (typeof window !== "undefined" && clientInstance) {
    return clientInstance;
  }

  const client = createBrowserClient(supabaseUrl, supabaseKey);

  if (typeof window !== "undefined") {
    clientInstance = client;
  }

  return client;
}
