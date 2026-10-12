# 054repairs

Website voor telefoonreparaties aan huis: online boeken, voorrijkosten, betalen via Mollie en een admin-dashboard.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (database, login voor de admin, RLS)
- Mollie (betalingen, later)
- Design-skills in `.claude/skills/` (Impeccable, Taste, Emil Kowalski, Frontend Design)

## Lokaal starten

```bash
npm install
cp .env.example .env.local   # vul de waarden in
npm run dev
```

Open http://localhost:3000. Het admin-dashboard staat op http://localhost:3000/admin.

## Omgevingsvariabelen

| Naam | Waar | Doel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | overal | Supabase-project-URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | overal | Publishable key (veilig in de browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | alleen server | Omzeilt RLS. Nooit met `NEXT_PUBLIC_` beginnen |
| `APP_ENCRYPTION_KEY` | alleen server | Versleutelt de Mollie API-key in de database. Maak aan met `openssl rand -base64 32` |

## Database

Migraties staan in `supabase/migrations/`. Het schema is in het Supabase-project al toegepast.

- Alleen accounts in de tabel `admins` hebben toegang tot het dashboard.
- De tabel `payment_secrets` heeft geen policies. Alleen de server (service role) kan erbij.
- Klanten boeken via de server. Prijzen worden daar altijd opnieuw berekend.

## Admin-account aanmaken (eenmalig)

1. Supabase-dashboard → Authentication → Users → **Add user** (e-mail + wachtwoord).
2. Supabase-dashboard → Authentication → Sign In / Providers → Email: zet **Allow new users to sign up** uit.
3. Voeg het account toe aan `admins` (SQL-editor in Supabase):

```sql
insert into public.admins (user_id)
select id from auth.users where email = 'JOUW_EMAIL';
```
