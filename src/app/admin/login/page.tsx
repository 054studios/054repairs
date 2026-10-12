import { LoginForm } from "./login-form";

export const metadata = {
  title: "Admin inloggen | 054repairs",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-navy-50 px-4 py-12">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-navy-100">
        <h1 className="text-2xl font-semibold tracking-tight text-navy-950">Admin</h1>
        <p className="mt-1 text-sm text-navy-600">Log in om het dashboard te openen.</p>
        <div className="mt-6">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
