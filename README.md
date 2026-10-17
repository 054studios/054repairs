# 054repairs

Website voor telefoonreparaties aan huis: online boeken, voorrijkosten, betalen (aanbetaling of volledig vooraf) en een admin-dashboard.

- **Publieke site**: home, prijzen, hoe het werkt, veelgestelde vragen, contact, voorwaarden, privacy
- **Boeken**: `/boeken`. Toestel, reparatie, adres (voorrijkosten), tijdslot, gegevens, betalen
- **Statuslink**: `/boeking/{referentie}?t=...`. De klant volgt de afspraak en kan annuleren
- **Admin**: `/admin`. Overzicht, afspraken, catalogus, voorrijkosten, planning, betalingen, instellingen

Stack: Next.js 16 (App Router) · TypeScript · Tailwind CSS · Supabase (database, login, RLS) · Mollie (betalingen) · Resend (e-mail)

---

## 1. Status: wat werkt nu, zonder extra sleutels

| Onderdeel | Status |
|---|---|
| Publieke pagina's, prijzen uit de database | Werkt |
| Boeken: toestel, reparatie, tijdslot, gegevens | Werkt |
| Adres zoeken (PDOK) | Werkt, als de server PDOK kan bereiken |
| Voorrijkosten | Werkt met een **schatting** (rechte lijn × 1,3) |
| Dubbele boekingen voorkomen | Werkt (in de database) |
| Statuslink en annuleren | Werkt |
| Admin: afspraken, catalogus, planning, voorrijkosten, betalingen | Werkt (niet met live login getest, zie stap 4) |
| Betalen via Mollie | **Niet actief**. Boekingen worden vastgelegd zonder betaling (testmodus) |
| Mollie-key opslaan | **Niet actief**. Heeft `SUPABASE_SERVICE_ROLE_KEY` en `APP_ENCRYPTION_KEY` nodig |
| Bevestigingsmails | **Niet actief**. Heeft `RESEND_API_KEY` nodig |
| Exacte rijafstand | **Niet actief**. Zonder service role key gebruikt de site de schatting |

**Let op**: zolang Mollie niet actief is, is boeken gratis. Zet de site pas live met echte betalingen als Mollie werkt.

---

## 2. Vóór je test: vul deze dingen in (5 minuten, in de admin)

Log in op `/admin` en doe dit in deze volgorde:

1. **Voorrijkosten → Startadres**: vul het adres in waar je vertrekt. Zonder dit weigert het boeken met "Het startpunt is nog niet ingesteld".
2. **Instellingen → Bedrijfsgegevens**: naam, telefoonnummer en e-mail. Die staan op de site.
3. **Catalogus → Prijzen per model**: de prijzen staan er als **voorbeeld**. Controleer ze en pas ze aan. De voorbeelden zijn gebaseerd op Apple-prijzen en liggen lager. Dat is niet geverifieerd bij concurrenten.
4. **Planning → Openingstijden**: controleer je werkdagen en -tijden.
5. **Planning → Boekingsregels**: startinterval, vooruitboektijd, maximum afspraken per dag, reistijd tussen afspraken.
6. **Betalingen**: aanbetaling (vast bedrag of percentage) en annuleringsregels.

Teksten die je moet controleren:
- `src/app/(site)/voorwaarden/page.tsx` en `privacy/page.tsx`: vul de tekst tussen **[haakjes]** in en laat die nakijken door een jurist.
- Garantie-tekst op de FAQ-pagina.

---

## 3. Lokaal testen

```bash
npm install
cp .env.example .env.local     # vul NEXT_PUBLIC_SUPABASE_URL en de publishable key in
npm run dev
```

Open http://localhost:3000. Testflow:
1. `/boeken` → kies iPhone → model → reparatie en kwaliteit → adres → tijdslot → gegevens → bevestigen
2. Je komt op de statuspagina met een referentie zoals `054-1A2B3C4D`
3. Probeer een tweede boeking op hetzelfde tijdslot: die moet geweigerd worden
4. Annuleer op de statuspagina: het tijdslot komt weer vrij

---

## 4. Online zetten (Vercel)

Dit kan ik niet voor je doen. Je hebt een Vercel-account nodig.

1. Ga naar https://vercel.com/new en log in met GitHub.
2. Kies de repository **054studios/054repairs**.
3. Bij **Branch**: kies `claude/fase-1-basis`, of zet die branch later om naar `main` als je die gebruikt.
4. Vul bij **Environment Variables** in. Kies bij **Type** voor **Config** (niet Secret) voor alle `NEXT_PUBLIC_`-variabelen. Die zijn publiek en worden in de browser gebruikt. Vercel geeft anders een waarschuwing over het voorvoegsel.
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://zggntvxvbboqehpeakme.supabase.co` (type: Config)
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` = de publishable key uit `.env.example` (type: Config)
   - `NEXT_PUBLIC_SITE_URL` = het adres dat Vercel je geeft, bijvoorbeeld `https://054repairs.vercel.app` (type: Config; zet dit na de eerste deploy en deploy opnieuw)
   - Later, zonder `NEXT_PUBLIC_`-voorvoegsel en als **Secret**: `SUPABASE_SERVICE_ROLE_KEY`, `APP_ENCRYPTION_KEY`, `RESEND_API_KEY`
5. Klik op **Deploy**. Je krijgt een link zoals `https://054repairs-xxxx.vercel.app`. Dat is de testlink.

**Admin-account aanmaken** (eenmalig, zie ook hieronder):
1. Supabase → Authentication → Users → **Add user** (je e-mail en een wachtwoord, en vink **Auto Confirm User** aan)
2. Supabase → Authentication → Sign In / Providers → Email: zet **Allow new users to sign up** uit
3. Supabase → Authentication → Attack protection / Password security: zet **Leaked password protection** aan
4. Log in op `https://jouw-link/admin`

Er staat al één rij in de tabel `admins`. Controleer of dat jouw account is (SQL-editor: `select u.email from public.admins a join auth.users u on u.id = a.user_id;`). Als inloggen niet lukt, voeg je account toe met de SQL uit stap 3 van de vorige uitleg.

---

## 5. Wat je later nog moet invullen

Deze onderdelen werken pas met de extra gegevens. Het volgende staat op de site en is klaar voor gebruik.

| Wat | Waarom | Waar | Hoe |
|---|---|---|---|
| **SUPABASE_SERVICE_ROLE_KEY** | Exacte rijafstand, Mollie-key opslaan, afspraken schrijven vanaf de server | Vercel + `.env.local` | Supabase → Project Settings → API Keys → Secret keys (`sb_secret_...`). Plak hem nooit in de chat of in code |
| **APP_ENCRYPTION_KEY** | Versleutelt de Mollie-key in de database | Vercel + `.env.local` | Maak aan met `openssl rand -base64 32` (32+ tekens). Wijzig hem nooit later, anders moet je de Mollie-key opnieuw invoeren |
| **Mollie API-key** | Betalen | Admin → Instellingen → Mollie | Begin met een test-key (`test_...`). Live-key pas na de testfase |
| **RESEND_API_KEY** en **MAIL_FROM** | Bevestigingsmails | Vercel | Maak een account bij Resend. `MAIL_FROM` is een afzender op een domein dat je bij Resend hebt geverifieerd |
| **Exacte routeservice** | Echte rijafstand | `src/lib/booking/distance.ts` | Nu: OSRM (openbaar, zonder sleutel, alleen voor testen). Voor productie: een betaalde of gratis-met-sleutel dienst zoals OpenRouteService |
| **Eigen domein** | Professionele link | Vercel → Domains | Koppel je domein en zet `NEXT_PUBLIC_SITE_URL` op het nieuwe adres. Mollie-terugkeerlinks gebruiken dit adres |
| **Juridische teksten** | Verplicht voor de wet | `voorwaarden` en `privacy` | Laat je tekst nakijken door een jurist |
| **Logo en foto's** | Herkenbaarheid | `public/` | Vervang de placeholders |

### Mollie activeren (stap voor stap)
1. Vul `SUPABASE_SERVICE_ROLE_KEY` en `APP_ENCRYPTION_KEY` in op Vercel, en deploy opnieuw.
2. Admin → Instellingen → Mollie: plak een `test_`-key en klik **Key opslaan**. Daarna **Verbinding testen**.
3. Test een boeking. Je moet doorgestuurd worden naar de Mollie-betaalpagina.
4. De webhook moet bereikbaar zijn op `{NEXT_PUBLIC_SITE_URL}/api/mollie/webhook`. Mollie roept die zelf aan.
5. Pas daarna een `live_`-key invoeren.

Let op: de Mollie-koppeling, de webhook en de e-mails zijn gebouwd maar **nog niet getest met echte gegevens**.

---

## 6. Bekende beperkingen

- **Rijafstand zonder service role key**: de site schat de afstand (rechte lijn × 1,3). Dat is niet exact. Een klant kan via de API ook een andere afstand opgeven, maar de database controleert dat die niet kleiner is dan de rechte lijn.
- **Boeken zonder betaling**: zolang Mollie niet actief is, worden boekingen vastgelegd zonder betaling. Dat is bedoeld om te testen.
- **Geen beveiliging tegen spam**: er is geen limiet op het aantal boekingen per adres of per telefoonnummer. Dat komt later.
- **Terugbetalingen**: die doe je handmatig. De site stuurt niets automatisch terug.
- **Afspraken na verlopen betaling**: als een betaling binnenkomt nadat de reservering is verlopen, wordt die wel geregistreerd, maar de status blijft verlopen. Controleer dat in de admin.

---

## 7. Technische notities

- Database-migraties staan in `supabase/migrations/`. Die zijn al op het project toegepast. De volgorde staat in de bestandsnamen.
- Alle boekingsberekeningen gebeuren in de database: prijzen, duur, voorrijkosten, aanbetaling en beschikbaarheid. De browser stuurt die niet mee.
- Alle tijden zijn Nederlandse tijd (`Europe/Amsterdam`), ook in de database.
- De admin-pagina's controleren zelf of je admin bent (`requireAdmin()`), niet alleen de layout.
- Designrichtlijnen staan in `.claude/skills/` (Impeccable, Taste, Emil Kowalski, Frontend Design).

## Omgevingsvariabelen

| Naam | Verplicht | Doel |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ja | Supabase-project |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | ja | Publieke sleutel, veilig in de browser |
| `NEXT_PUBLIC_SITE_URL` | aanbevolen | Publiek adres van de site, voor Mollie en e-mails |
| `SUPABASE_SERVICE_ROLE_KEY` | later | Server-only, omzeilt RLS. Nooit met `NEXT_PUBLIC_` beginnen |
| `APP_ENCRYPTION_KEY` | later | Versleutelt de Mollie-key. 32+ tekens |
| `RESEND_API_KEY` | later | Bevestigingsmails |
| `MAIL_FROM` | later | Afzender van de mails |

## SEO en boekingsupgrades (17 oktober 2026)

Zie [activering en lancering](docs/launch-upgrades.md) voor de nieuwe pagina’s, indexering, database-migratie, metingen en herinneringsmails. Nieuwe integraties staan standaard uit totdat ze zijn ingesteld.
