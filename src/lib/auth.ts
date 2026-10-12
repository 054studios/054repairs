import "server-only";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Call at the top of every admin page and every admin data function.
// The layout check is for display only: a page can be reached through
// client-side navigation without the layout re-running.
export async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  const { data: isAdmin } = await supabase.rpc("is_admin");

  // 404 instead of 403, so the admin area does not reveal that it exists.
  if (!isAdmin) {
    notFound();
  }

  return { supabase, user };
}
