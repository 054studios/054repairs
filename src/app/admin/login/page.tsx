import { panelClass } from "@/components/ui/styles";
import { Wordmark } from "@/components/ui/wordmark";
import { LoginForm } from "./login-form";

export const metadata = {
  title: "Admin inloggen | 054repairs",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="night-sky flex min-h-dvh items-center justify-center px-4 py-12">
      <div className={`${panelClass} settle w-full max-w-sm p-6 sm:p-8`}>
        <span className="text-steel-300">
          <Wordmark />
        </span>
        <h1 className="mt-8 font-display text-[1.75rem] font-semibold leading-tight tracking-[-0.025em] text-steel-50">
          Inloggen
        </h1>
        <p className="mt-1.5 text-[0.95rem] leading-relaxed text-steel-400">
          Log in om afspraken, prijzen en planning te beheren.
        </p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
