import { test } from "node:test";
import assert from "node:assert/strict";
import { authorizedCron } from "../src/lib/cron-auth";
import { indexingEnabled, pageMetadata } from "../src/components/site/seo";
import { siteUrl } from "../src/components/site/site-url";
import { whatsappHref } from "../src/components/site/whatsapp";
import { bookingPayloadSchema } from "../src/lib/booking/schema";
test("staging and previews stay noindex; production requires an explicit launch setting", () => {
  const original = { ...process.env };
  try {
    delete process.env.SITE_INDEXING_ENABLED;
    delete process.env.VERCEL_ENV;
    assert.equal(indexingEnabled(), false);
    process.env.SITE_INDEXING_ENABLED = "true";
    process.env.VERCEL_ENV = "preview";
    assert.equal(indexingEnabled(), false);
    process.env.VERCEL_ENV = "production";
    assert.equal(indexingEnabled(), true);
    assert.equal(
      pageMetadata("Prijzen", "Beschrijving", "/prijzen").alternates?.canonical,
      "/prijzen",
    );
  } finally {
    for (const key of ["SITE_INDEXING_ENABLED", "VERCEL_ENV"]) {
      if (original[key] === undefined) delete process.env[key];
      else process.env[key] = original[key];
    }
  }
});
test("public URLs do not pick a request host; WhatsApp is opt-in and validated", () => {
  const names = [
    "NEXT_PUBLIC_SITE_URL",
    "VERCEL_PROJECT_PRODUCTION_URL",
    "WHATSAPP_NUMBER",
  ] as const;
  const old = names.map((k) => process.env[k]);
  try {
    process.env.NEXT_PUBLIC_SITE_URL = "https://repairs.example/path";
    assert.equal(siteUrl(), "https://repairs.example");
    process.env.NEXT_PUBLIC_SITE_URL = "invalid";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "repairs.vercel.app";
    assert.equal(siteUrl(), "https://repairs.vercel.app");
    delete process.env.WHATSAPP_NUMBER;
    assert.equal(whatsappHref(), null);
    process.env.WHATSAPP_NUMBER = "+31 (6) 1234 5678";
    assert.equal(whatsappHref(), "https://wa.me/31612345678");
    process.env.WHATSAPP_NUMBER = "javascript:alert(1)";
    assert.equal(whatsappHref(), null);
  } finally {
    names.forEach((k, i) => {
      if (old[i] === undefined) delete process.env[k];
      else process.env[k] = old[i];
    });
  }
});
test("reminder endpoint cannot authenticate without a configured strong secret", () => {
  const secret = "a".repeat(32);
  assert.equal(authorizedCron(null, secret), false);
  assert.equal(authorizedCron("Bearer anything", undefined), false);
  assert.equal(authorizedCron("Bearer short", "short"), false);
  assert.equal(authorizedCron("Bearer " + secret + "x", secret), false);
  assert.equal(authorizedCron("Bearer " + "b".repeat(32), secret), false);
  assert.equal(authorizedCron("Bearer " + secret, secret), true);
});
test("booking accepts normal customers and rejects a filled spam trap", () => {
  const id = "00000000-0000-4000-a000-000000000001";
  const payload = {
    modelId: id,
    items: [{ repairTypeId: id, qualityId: id }],
    address: {
      street: "Teststraat",
      houseNumber: "10",
      postcode: "1012 ab",
      city: "Amsterdam",
      lat: 52.37,
      lng: 4.9,
    },
    startsAt: "2026-12-01T10:00:00Z",
    customer: {
      name: "Test klant",
      phone: "0612345678",
      email: "test@example.test",
      note: "",
    },
    paymentChoice: "deposit",
  };
  assert.equal(bookingPayloadSchema.safeParse(payload).success, true);
  const normal = bookingPayloadSchema.parse({ ...payload, website: "" });
  assert.equal(normal.address.postcode, "1012AB");
  assert.equal(
    bookingPayloadSchema.safeParse({ ...payload, website: "spam.example" })
      .success,
    false,
  );
  assert.equal(
    bookingPayloadSchema.safeParse({
      ...payload,
      customer: { ...payload.customer, phone: "1".repeat(500) },
    }).success,
    false,
  );
});
