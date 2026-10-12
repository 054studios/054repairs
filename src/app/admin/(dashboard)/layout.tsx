import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutIcon } from "@phosphor-icons/react/dist/ssr";
import { AdminRailNav, AdminStripNav } from "@/components/admin/admin-nav";
import { SubmitButton } from "@/components/admin/submit-button";
import { buttonClass, panelClass } from "@/components/ui/styles";
import { Wordmark } from "@/components/ui/wordmark";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../actions";

// Admin pages depend on the signed-in user, so they render per request.
export const instant = false;

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
      <main className="night-sky flex min-h-dvh items-center justify-center px-4 py-12">
        <div className={`${panelClass} w-full max-w-sm p-6 sm:p-8`}>
          <span className="text-steel-300">
            <Wordmark />
          </span>
          <h1 className="mt-8 font-display text-2xl font-semibold tracking-[-0.025em] text-steel-50">Geen toegang</h1>
          <p className="mt-2 leading-relaxed text-steel-400">
            Dit account heeft geen beheerrechten. Log uit en log in met het beheerdersaccount.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <form action={signOut}>
              <SubmitButton
                className={buttonClass("secondary")}
                icon={<SignOutIcon aria-hidden="true" className="size-5" />}
              >
                Uitloggen
              </SubmitButton>
            </form>
            <Link href="/" className={buttonClass("ghost")}>
              Naar de website
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-ink-950 lg:grid lg:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#inhoud"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-3 focus:z-50 focus:rounded-ui focus:bg-cyan-400 focus:px-4 focus:py-2.5 focus:font-semibold focus:text-cyan-ink"
      >
        Direct naar de inhoud
      </a>

      {/* Desktop: the rail. Sticky and solid, so scrolling the page never repaints it. */}
      <aside className="hidden border-r border-line bg-ink-900 lg:sticky lg:top-0 lg:flex lg:h-dvh lg:flex-col">
        <div className="px-5 pb-6 pt-5">
          <Link href="/admin" className="-ml-1 inline-flex min-h-11 items-center rounded-ui px-1 text-steel-300">
            <Wordmark />
          </Link>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto px-3">
          <AdminRailNav />
        </div>
        <div className="border-t border-line p-3">
          <form action={signOut}>
            <SubmitButton
              className="flex h-11 w-full items-center gap-3 rounded-ui px-3 text-[0.95rem] font-medium text-steel-400 transition-colors duration-150 hover:bg-ink-850 hover:text-steel-100 disabled:opacity-60"
              icon={<SignOutIcon aria-hidden="true" className="size-5 shrink-0" />}
            >
              Uitloggen
            </SubmitButton>
          </form>
        </div>
      </aside>

      <div className="min-w-0">
        {/* Mobile: the top bar scrolls away, the nav strip stays. */}
        <header className="flex h-14 items-center justify-between gap-3 px-4 lg:hidden">
          <Link href="/admin" className="-ml-1 inline-flex min-h-11 items-center rounded-ui px-1 text-steel-300">
            <Wordmark />
          </Link>
          <form action={signOut} className="-mr-3">
            <SubmitButton
              className={buttonClass("ghost")}
              icon={<SignOutIcon aria-hidden="true" className="size-5" />}
            >
              Uitloggen
            </SubmitButton>
          </form>
        </header>
        <div className="sticky top-0 z-30 border-y border-line bg-ink-950 lg:hidden">
          <AdminStripNav />
        </div>

        <main id="inhoud" className="mx-auto w-full max-w-[72rem] px-4 pb-20 pt-6 sm:px-6 lg:px-10 lg:pb-16 lg:pt-10">
          {children}
        </main>
      </div>
    </div>
  );
}
