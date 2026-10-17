# Upgrades en lancering

De website blijft een testversie: standaard staat SITE_INDEXING_ENABLED=false.
Er zijn geen accounts, reviews, foto's, garantieperiodes of bedrijfsregistraties verzonnen.

## Wat is toegevoegd
- Canonicals en specifieke titels/beschrijvingen voor openbare pagina's.
- Drie reparatiepagina's (scherm, batterij, laadpoort), servergerenderde prijzen en afzonderlijke pagina's per geprijsd iPhone-model.
- Werkgebiedpagina met adrescheck, over-ons-pagina, interne links en broodkruimels.
- Organization-, Service- en BreadcrumbList-gegevens; het particuliere vertrekadres blijft privé.
- Mobiele contactbalk, verborgen tijdens boeken en op persoonlijke statuspagina's.
- Openbare catalogus en instellingen kort gecachet; beheermutaties verversen de tags.
  De boekingsflow en database blijven de actuele prijs, afstand en beschikbaarheid controleren.
- Honeypot en database-limieten: maximaal 5 boekingen per telefoon/e-mail, 8 per adres binnen 24 uur.
  Ook geannuleerde boekingen tellen mee; ingelogde beheerders kunnen groepsboekingen invoeren.
- Optionele dagelijkse totalen per boekingsstap, boeking en betaaluitkomst, te zien op /admin/inzichten.
  Dit zijn geen unieke bezoekers of betrouwbare conversiepercentages. Browsermetingen zijn benaderingen.
- Optionele afspraakherinneringen via Resend. Eén mail per afspraaktijd, claims met een lease,
  maximaal 3 pogingen en een vaste Resend-idempotentiesleutel. Geannuleerde, verlopen en
  onbetaalde reserveringen worden overgeslagen.
- Mislukte bevestigingsmails en betaalacties geven een logmelding zonder klantvelden.

## Activeren in deze volgorde
1. Pas supabase/migrations/20261017090000_booking_upgrades.sql toe op het bedoelde Supabase-project.
   De migratie is lokaal getest; een Git-push past haar niet automatisch toe op Supabase.
2. Controleer de echte prijzen, bedrijfsgegevens, vertrekpunt, openingstijden en onderdeelbeschrijvingen.
3. Stel NEXT_PUBLIC_SITE_URL in op je gekozen hoofddomein (https, geen pad). Koppel dat domein in Vercel.
4. Voor metingen: zet NEXT_PUBLIC_FUNNEL_ENABLED=true, met SUPABASE_SERVICE_ROLE_KEY en APP_ENCRYPTION_KEY
   aanwezig, controleer de privacytekst en deploy opnieuw.
5. Voor herinneringen: configureer RESEND_API_KEY, een geverifieerde MAIL_FROM en een CRON_SECRET
   van ten minste 32 willekeurige tekens. Zet REMINDERS_ENABLED=true.
   vercel.json plant dagelijks om 08:00 UTC een ronde voor afspraken in de volgende 26 uur.
   Dit werkt binnen de dagelijkse Hobby-limiet, maar is geen belofte van een mail exact 24 uur vooraf.
   Cron draait alleen op Vercel-productiedeployments. Voor nauwkeuriger herinneringen is een
   frequentere scheduler nodig. Herhaal bij een 502/503 na minstens 10 minuten met dezelfde beveiligde route;
   inspecteer foutlogs en mislukte pogingen. Er worden maximaal 20 herinneringen per ronde geclaimd.
6. Test Mollie en bevestigingsmails in de testmodus; activeer live betalen pas daarna.
7. Voeg echte foto's, bedrijfsregistratiegegevens en vastgestelde garantievoorwaarden toe.
   Werk voorwaarden en privacy met je feitelijke leveranciers en bewaartermijnen af.
8. Maak of actualiseer je Google Bedrijfsprofiel en verifieer het bij Google. Gebruik het juiste
   servicegebied en toon geen bezoekadres wanneer klanten daar niet terechtkunnen.
9. Verifieer het hoofddomein in Search Console. Zet SITE_INDEXING_ENABLED=true en deploy.
   Vercel preview-deployments blijven noindex. Meld /sitemap.xml aan bij Search Console.

## Optioneel WhatsApp
Zet WHATSAPP_NUMBER op je zakelijke nummer in internationaal formaat, bijvoorbeeld 31612345678.
Zonder deze instelling wordt geen WhatsApp-link getoond.

## Controle
npm test
npm run typecheck
npm run build

De database-tests voeren de nieuwe migratie uit in een tijdelijke lokale Postgres (PGlite) met een
minimale bestaande tabelstructuur. Ze wijzigen geen klantdatabase en versturen geen e-mails.
Controleer daarnaast een echte testboeking en Mollie-webhook met je eigen testaccounts.


## Afhankelijkheden
De controle met npm audit meldde een bestaande braces-waarschuwing via de ontwikkeltool eslint-config-next.
Op het moment van deze wijziging bood de registry geen gerepareerde braces-versie binnen dezelfde major.
Er is geen geforceerde downgrade van Next.js of ESLint uitgevoerd. Controleer nieuwe upstream-updates.
