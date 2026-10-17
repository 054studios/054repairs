# Beheer en klantfuncties

Deze wijziging gebruikt bestaand Supabase Auth en de bestaande admin-allowlist. Nieuwe beheerpaden:

- /admin/werkdag: afspraken op datum, bellen, navigeren en geschatte reistijd.
- /admin/voorraad: fysieke voorraad en minimum per model/reparatie/kwaliteit.
- /admin/bedrijfsvoering: reistijdcontrole, verzettermijn, factuurgegevens en reviewlink.
- /admin/publicatie: eigen foto's als concept of met toestemming publiceren.
- /admin/afspraken/[id]: verzetten, functiecontrole, reparatierapport, factuur en wijzigingshistorie.

## Activering

1. Voer eerst de bestaande migraties uit, inclusief 20261017090000_booking_upgrades.sql, en daarna 20261017120000_operations.sql. Dit moet via een geautoriseerde Supabase-beheerverbinding gebeuren. De applicatie gebruikt geen databasewachtwoord in de browser.
2. Zonder nieuwe migratie blijven bestaande boekingen werken. Nieuwe beheerpagina's tonen een activeringsmelding; de keuzehulp en aangepaste teksten werken al.
3. Vul het vertrekpunt in bij Voorrijkosten. Activeer daarna desgewenst reistijdcontrole in Bedrijfsvoering. Begin conservatief met snelheid en marge en controleer de werkdag.
4. Voeg alleen onderdelen toe waarvan je de fysieke voorraad hebt gecontroleerd. Het aantal is inclusief gereserveerde onderdelen. Bestaande toekomstige afspraken worden bij inrichting meegeteld. Combinaties zonder voorraadregel blijven onbeperkt boekbaar; diagnoses hoeven geen onderdeelregel te hebben.
5. Vul echte factuurgegevens en het toepasselijke btw-percentage in voordat je een factuur uitgeeft. Vul bij 0% ook een toelichting in. Het systeem behandelt bestaande prijzen inclusief btw. De huidige uitvoering gebruikt één btw-percentage per factuur.
6. Voeg eigen foto's en een echte reviewlink toe. Foto's gebruiken een directe https-link op je eigen hosting. Bevestig het publicatierecht en eventuele toestemming. Er zijn geen foto's, beoordelingen of sterren verzonnen.

## Gedrag en grenzen

- Reistijd is hemelsbrede afstand maal 1,3, gedeeld door de ingestelde snelheid, plus aankomstmarge. Het is een schatting zonder verkeersinformatie. Bij ingeschakelde controle worden ook vertrek naar eerste klant en terugkeer vóór sluiting meegenomen. Bestaande afspraken worden niet automatisch verplaatst.
- Tijdslot, daglimiet, reistijd en voorraad worden opnieuw gecontroleerd in PostgreSQL. Een transactieslot en de bestaande uitsluitingsconstraint beschermen de planning; voorraadmutaties gebeuren met rijvergrendeling.
- Een nieuwe boeking reserveert bewaakte onderdelen meteen, inclusief een betaalreservering. Annuleren en verlopen geven ze vrij. Klaar/teruggebracht verbruikt ze één keer. Reeds verbruikte onderdelen worden bij annuleren niet terug op voorraad geboekt.
- Verzetten gaat via de bestaande privélink en kan alleen bij dezelfde reparatie en hetzelfde adres. Betaalde bedragen, totaal en voorrijkosten veranderen niet. Een ander adres vereist overleg en herberekening. Een open betaalreservering, gestarte reparatie of verstreken verzettermijn blokkeert klantverzetten. De nieuwe afspraak verschijnt direct op de statuspagina; er wordt geen afzonderlijke wijzigingsmail verstuurd.
- Reparatiecontroles beginnen als Niet getest. Alleen gepubliceerde rapporten zijn voor de klant zichtbaar. Admins kunnen een concept bekijken.
- Facturen worden na status Teruggebracht definitief vastgelegd met een uniek jaarvolgnummer en een onveranderlijke momentopname. Herhaald uitgeven levert dezelfde factuur op. Correcties en creditnota's moeten apart in je boekhouding worden verwerkt.
- Klanten openen rapport en factuur via hun privélink en gebruiken Afdrukken / opslaan als PDF. Dit is de browserfunctie; er is geen automatische PDF-bijlage per e-mail.
- De document- en statusroutes gebruiken noindex, no-referrer en private/no-store-headers. Andere klanten, anonieme bezoekers en gewone ingelogde gebruikers krijgen geen toegang tot interne tabellen of vreemde documenten.

Factuurvelden zijn gebaseerd op de [factuureisen van de Belastingdienst](https://www.belastingdienst.nl/wps/wcm/connect/bldcontentnl/belastingdienst/zakelijk/btw/administratie_bijhouden/facturen_maken/factuureisen/). De eigenaar kiest zelf de juiste belastingregeling en bedrijfsgegevens.

## Validatie

De PostgreSQL-tests voeren de echte historische schema's en nieuwe migratie uit in lokale PGlite met pgcrypto en btree_gist; alleen de externe pg_cron-scheduler wordt overgeslagen. Tests maken geen echte boekingen, betalingen of e-mails. Ze controleren reservering/vrijgave/verbruik, inrichting bij bestaande afspraken, prijsbehoud bij verzetten, tijdconflicten, documenttokens, adminrechten en onveranderlijke facturen.

GitHub-main bijwerken wijzigt niet automatisch de ingestelde productiebranch in Vercel. Controleer de projectinstelling of publiceer een bewuste deployment vanaf main.
