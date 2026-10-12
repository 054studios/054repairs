---
version: 1
slug: "src-app-site-page-tsx"
primary_target: "src/app/(site)/page.tsx"
related_targets: ["src/app/(site)/boeken/page.tsx","src/app/admin/(dashboard)/layout.tsx"]
---

# Surface brief: public site, booking flow, status page, admin

Scope: all customer-facing routes in src/app/(site) (home, prijzen, hoe-het-werkt, faq, contact, voorwaarden, privacy, boeken, boeking) and the admin in src/app/admin. Visitor mode: Persuade for marketing pages, Operate for booking, status and admin, Read for legal pages.

Audience and action: an iPhone owner with a broken phone, usually on mobile, decides in one minute whether to book. Action: check the price, then book with a deposit. Proof on hand: live prices, live travel-fee rules, real opening slots. No reviews, photos or warranty claims exist; none are invented.

## Direction contract

THESIS: The repair drives to you and the price is known before you book. The first screen is a working price check, not a split hero with a phone photo and a row of three feature cards.

OWN-WORLD: Night drive. A deep navy ground (#060C18) with raised ink panels (#0A1324, #0F1B31), quiet steel text (#A3B4CC), and one cyan light (#3EC5FF): the glow of a repaired screen and the route on a navigation display. Bricolage Grotesque headlines, Inter Tight text, tabular figures for every price and km. Radii scale with hierarchy (10, 18, 28). Tinted, offset shadows; no neon halos, no glass.

STORY: The visitor sees the exact price for their model and repair, learns that the technician drives to them and repairs on the spot in the van, understands the travel fee and deposit, and books.

FIRST VIEWPORT: Left/top: headline in Bricolage at about 5rem on desktop, one sentence below. Right/below: the price-check panel at 28px radius with model select, repair choice, quality toggle, the price in large tabular figures and the primary button "Boek deze reparatie". On mobile the panel sits directly under a shorter headline and is fully visible above the fold on a 390x844 screen.

FORM: Signature move is the route line: one continuous cyan SVG line that runs from the hero down through the four stops of the service (boeken, wij rijden, reparatie in de bus, terug bij jou) and draws itself as the visitor scrolls (CSS scroll-driven animation, static fallback). The same line becomes the booking progress bar, the status timeline and the active marker in the admin nav. seed: none (unavailable)

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance

## Unresolved

- Warranty term is not decided. No warranty claim anywhere.
- Logo does not exist; a wordmark is used until the owner supplies one.
