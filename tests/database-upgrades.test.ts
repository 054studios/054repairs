import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const db = new PGlite();
before(async () => {
  // Minimal existing schema; the production migration itself is executed unmodified.
  await db.exec(`
    create role anon; create role authenticated; create role service_role bypassrls;
    grant usage on schema public to anon, authenticated, service_role;
    create function public.is_admin() returns boolean language sql as $$
      select coalesce(current_setting('test.is_admin', true), 'false') = 'true';
    $$;
    create table public.appointments (
      id uuid primary key default gen_random_uuid(), customer_phone text not null,
      customer_email text not null, postcode text not null, house_number text not null,
      created_at timestamptz not null default now(), starts_at timestamptz not null,
      status text not null default 'new', paid_cents integer not null default 0,
      deposit_cents integer not null default 1000, hold_expires_at timestamptz
    );
  `);
  await db.exec(
    readFileSync(
      "supabase/migrations/20261017090000_booking_upgrades.sql",
      "utf8",
    ),
  );
});
after(async () => {
  await db.close();
});
beforeEach(async () => {
  await db.exec(
    "truncate public.appointments, public.appointment_reminders, public.funnel_daily; set test.is_admin = 'false';",
  );
});
async function book(
  phone = "0612345678",
  email = "test@example.test",
  house = "10",
) {
  return db.query(
    `insert into public.appointments(customer_phone, customer_email, postcode, house_number, starts_at, paid_cents)
    values ($1, $2, '1012 AB', $3, now() + interval '12 hours', 1000) returning id`,
    [phone, email, house],
  );
}
test("migration blocks the sixth booking even when phone formatting changes", async () => {
  for (let i = 0; i < 5; i++)
    await book(
      i % 2 ? "06 1234-5678" : "0612345678",
      `customer${i}@example.test`,
      String(i),
    );
  await assert.rejects(
    book("06-12345678", "another@example.test", "100"),
    /veel boekingen/,
  );
});
test("email normalization also catches repeated contact details", async () => {
  for (let i = 0; i < 5; i++)
    await book(
      "069876540" + i,
      i % 2 ? " Person@Example.Test " : "person@example.test",
      String(i),
    );
  await assert.rejects(
    book("0677777777", "PERSON@example.test", "100"),
    /veel boekingen/,
  );
});
test("address limit applies across different contact details and ignores postcode spaces", async () => {
  for (let i = 0; i < 8; i++)
    await book("069876540" + i, `customer${i}@example.test`);
  await assert.rejects(
    db.query(
      "insert into public.appointments(customer_phone,customer_email,postcode,house_number,starts_at) values ('0677777777','new@example.test','1012ab','10',now()+interval '12 hours')",
    ),
    /veel boekingen/,
  );
});
test("old bookings expire from limits; admins can book a group explicitly", async () => {
  for (let i = 0; i < 5; i++) await book();
  await db.exec(
    "update public.appointments set created_at = now() - interval '25 hours'",
  );
  await book();
  await db.exec("set test.is_admin = 'true'");
  for (let i = 0; i < 8; i++) await book();
});
test("analytics RPC is server-only and cannot store arbitrary fields as event labels", async () => {
  await db.query("select public.record_funnel_event('step_1')");
  await db.query("select public.record_funnel_event('step_1')");
  const { rows } = await db.query<{ total: number }>(
    "select total::int from public.funnel_daily where event='step_1'",
  );
  assert.equal(rows[0].total, 2);
  await assert.rejects(
    db.query("select public.record_funnel_event('customer@example.test')"),
    /Ongeldig/,
  );
  await db.exec("set role anon");
  try {
    await assert.rejects(
      db.query("select public.record_funnel_event('step_1')"),
      /permission denied/,
    );
    await assert.rejects(
      db.query("select * from public.appointment_reminders"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});
test("reminders claim only eligible appointments and do not claim twice", async () => {
  await book();
  await book("0677777771", "cancelled@example.test", "11");
  await db.exec(
    "update public.appointments set status='cancelled' where customer_email='cancelled@example.test'",
  );
  await book("0677777772", "unpaid@example.test", "12");
  await db.exec(
    "update public.appointments set paid_cents=0 where customer_email='unpaid@example.test'",
  );
  await book("0677777773", "expired@example.test", "13");
  await db.exec(
    "update public.appointments set hold_expires_at=now()-interval '1 minute' where customer_email='expired@example.test'",
  );
  const first = await db.query(
    "select * from public.claim_appointment_reminders()",
  );
  assert.equal(first.rows.length, 1);
  assert.equal(
    (await db.query("select * from public.claim_appointment_reminders()")).rows
      .length,
    0,
  );
  await db.exec(
    "update public.appointment_reminders set claimed_at=now()-interval '11 minutes'",
  );
  assert.equal(
    (await db.query("select * from public.claim_appointment_reminders()")).rows
      .length,
    1,
  );
  await db.exec(
    "update public.appointment_reminders set sent_at=now(), claimed_at=now()-interval '11 minutes'",
  );
  assert.equal(
    (await db.query("select * from public.claim_appointment_reminders()")).rows
      .length,
    0,
  );
});
test("rescheduling creates a new reminder while unsuccessful delivery retries are bounded", async () => {
  await book();
  await db.query("select * from public.claim_appointment_reminders()");
  await db.exec(
    "update public.appointment_reminders set sent_at=now(); update public.appointments set starts_at=starts_at+interval '1 hour'",
  );
  assert.equal(
    (await db.query("select * from public.claim_appointment_reminders()")).rows
      .length,
    1,
  );
  for (let i = 0; i < 3; i++) {
    await db.exec(
      "update public.appointment_reminders set claimed_at=now()-interval '11 minutes' where sent_at is null",
    );
    await db.query("select * from public.claim_appointment_reminders()");
  }
  const { rows } = await db.query<{ attempts: number }>(
    "select attempts from public.appointment_reminders where sent_at is null",
  );
  assert.equal(rows[0].attempts, 3);
  assert.equal(
    (await db.query("select * from public.claim_appointment_reminders()")).rows
      .length,
    0,
  );
});

test("service role can persist delivery acknowledgements without public write access", async () => {
  await book();
  await db.query("select * from public.claim_appointment_reminders()");
  await db.exec("set role service_role");
  try {
    await db.exec("update public.appointment_reminders set sent_at = now()");
    const { rows } = await db.query("select sent_at from public.appointment_reminders");
    assert.ok(rows[0].sent_at);
  } finally { await db.exec("reset role"); }
});
