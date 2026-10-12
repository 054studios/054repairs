"use client";

import { useActionState } from "react";
import { CircleNotchIcon, WarningCircleIcon } from "@phosphor-icons/react";
import { buttonClass, inputClass, labelClass } from "@/components/ui/styles";
import { signIn, type LoginState } from "../actions";

const initialState: LoginState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className={labelClass}>
          E-mailadres
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={inputClass}
        />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="password" className={labelClass}>
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? "login-error" : undefined}
          className={inputClass}
        />
      </div>

      {state.error && (
        <p
          id="login-error"
          role="alert"
          className="flex items-start gap-1.5 text-sm font-medium leading-snug text-bad transition-[opacity,translate] duration-200 ease-out-strong starting:translate-y-1 starting:opacity-0"
        >
          <WarningCircleIcon aria-hidden="true" className="size-[1.125rem] shrink-0" />
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} aria-busy={pending} className={`${buttonClass("primary", "lg")} mt-2 w-full`}>
        {pending && <CircleNotchIcon aria-hidden="true" className="size-5 animate-spin" />}
        Inloggen
      </button>
    </form>
  );
}
