import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

// Admin pages depend on the signed-in user, so they render per request.
export const instant = false;

const navItems = [
  { href: "/admin", label: "Overzicht" },
  { href: "/admin/instellingen", label: "Instellingen" },
];

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Only accounts listed in the admins table pass this check (enforced by RLS too).
  const { data: isAdmin } = await supabase.rpc("is_admin");

  if (!isAdmin) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-navy-50 px-4">
        <div className="max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-navy-100">
          <h1 className="text-xl font-semibold text-navy-950">Geen toegang</h1>
          <p className="mt-2 text-sm text-navy-600">Dit account heeft geen admin-rechten.</p>
          <form action={signOut} className="mt-6">
            <button type="submit" className="text-sm font-medium text-navy-800 underline">
              Uitloggen
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-navy-50 md:grid md:grid-cols-[14rem_1fr]">
      <aside className="border-b border-navy-100 bg-white md:border-b-0 md:border-r">
        <div className="flex items-center justify-between px-4 py-4 md:block md:px-6">
          <span className="font-semibold tracking-tight text-navy-950">054repairs admin</span>
          <form action={signOut} className="md:mt-4">
            <button type="submit" className="text-sm text-navy-600 hover:text-navy-950">
              Uitloggen
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto px-4 pb-3 md:flex-col md:px-3 md:pb-0">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-navy-700 transition hover:bg-navy-50 hover:text-navy-950"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}
