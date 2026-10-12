# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

People with a broken iPhone who live within 150 km of the repairer's start address (Amsterdam region). They want their phone fixed without travelling to a shop, and they book from their phone, often right after the damage happened.

Second user: the owner, the only admin. He manages bookings, prices, travel fees, opening hours and payments from the admin dashboard, mostly on his phone between jobs.

## Product Purpose

054repairs repairs phones at the customer's location. The customer books online: device, repair, address, time slot, details, then pays a deposit or the full amount. The repairer drives to the customer, repairs the phone on the spot in his car or van, and hands it back when the repair time is over. The rest is paid by PIN or cash at handover.

Success means: a customer completes a booking with a deposit, so the repairer never drives for nothing.

## Positioning

- The repair comes to you. The phone is repaired on the spot, in the repairer's car or van, close to the customer.
- The device is back when the repair time is over. The slot length equals the repair duration.
- Fixed repair price before booking. Travel costs only above the free radius (50 km by default), per km, both configurable.

## Operating Context

- Customers book mostly on mobile, outdoors or at home, sometimes with a cracked screen.
- The owner works alone and checks the admin on his phone between appointments.
- Payments: deposit or full prepayment online (Mollie), rest by PIN or cash at handover.
- Status of a booking is followed through a private status link, no customer accounts.

## Capabilities and Constraints

- iPhone only for now. Brands, models, repairs, qualities (Standaard, Premium) and prices are managed in the admin.
- Travel fee: free up to a configurable radius, then a price per km, one way or round trip, maximum distance 150 km.
- Without a service role key, driving distance is an estimate (straight line × 1.3).
- Mollie payments and e-mail confirmations are built but not active until keys are configured. Until then bookings are recorded without payment (test mode).
- Language: Dutch.
- Undecided: warranty period. Do not state a warranty term anywhere until the owner sets one.

## Brand Commitments

- Name: 054repairs.
- Voice: "wij", business-like, plain Dutch.
- Colour direction chosen by the owner: dark blue (donkerblauw), dark and premium, with an electric blue/cyan accent.
- Typefaces chosen by the owner: Bricolage Grotesque (headings) and Inter Tight (text).

## Evidence on Hand

- No logo, no photos, no customer reviews yet. Do not invent reviews, ratings, customer counts, years of experience or warranty terms.
- Illustrations may be created (SVG) because no photography exists.
- Example prices in the catalogue are placeholders based on Apple's May 2026 prices, set lower. They are not verified competitor prices.

## Product Principles

1. Price and timing are clear before anything is paid.
2. Booking on a phone must feel fast and calm, one question per step.
3. Never promise what the business has not confirmed (warranty, reviews, response times).
4. The owner can change every rule himself in the admin.
5. Speed matters: the site must stay smooth on older phones.

## Accessibility & Inclusion

- Readable on small screens in daylight: strong contrast, large tap targets.
- Respect reduced motion settings.
