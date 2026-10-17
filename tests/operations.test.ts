import { before, after, beforeEach, test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { pgcrypto } from "@electric-sql/pglite/contrib/pgcrypto";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";
const db = new PGlite({ extensions: { pgcrypto, btree_gist } });
let model: string,
  repair: string,
  quality: string,
  serial = 0;
before(async () => {
  await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create schema extensions;
 create table auth.users(id uuid primary key);
 create function auth.uid() returns uuid language sql as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth,extensions to anon,authenticated,service_role;
 alter default privileges in schema public grant all on tables to anon,authenticated;
 alter default privileges in schema public grant execute on functions to anon,authenticated;
 create extension pgcrypto with schema extensions;create extension btree_gist;
 `);
  await db.exec(
    readFileSync("supabase/migrations/20261012182427_init_schema.sql", "utf8"),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261012182438_restrict_is_admin_execute.sql",
      "utf8",
    ),
  );
  // pg_cron is Supabase's external scheduler, not part of in-memory Postgres.
  const review = readFileSync(
    "supabase/migrations/20261012190500_review_fixes.sql",
    "utf8",
  );
  await db.exec(
    review.slice(0, review.indexOf("create extension if not exists pg_cron")) +
      review.slice(review.indexOf("-- 3. Inactive")),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261012200000_booking_functions.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync(
      "supabase/migrations/20261017090000_booking_upgrades.sql",
      "utf8",
    ),
  );
  await db.exec(
    readFileSync("supabase/migrations/20261017120000_operations.sql", "utf8"),
  );
  const ids = await db.query<{
    model: string;
    repair: string;
    quality: string;
  }>(
    "select (select id from device_models limit 1) model,(select id from repair_types where name='Scherm vervangen') repair,(select id from repair_qualities where name='Standaard') quality",
  );
  ({ model, repair, quality } = ids.rows[0]);
  await db.query(
    "insert into repair_prices(model_id,repair_type_id,quality_id,price_cents) values($1,$2,$3,10001)",
    [model, repair, quality],
  );
  await db.exec(
    "insert into auth.users values('00000000-0000-0000-0000-000000000001');insert into admins(user_id) select id from auth.users",
  );
});
after(() => db.close());
beforeEach(async () => {
  await db.exec(`reset role;set request.jwt.claim.sub='';
 truncate appointments,stock_items,stock_reservations,appointment_events,repair_reports,invoices,invoice_counters,appointment_reminders,payments cascade;
 update settings set start_lat=52.37,start_lng=4.89,booking_lead_hours=0,max_appointments_per_day=20,travel_buffer_minutes=0;
 update operations_settings set route_planning=false,legal_name='',vat_percent=null;
 delete from work_hours;insert into work_hours(weekday,opens_at,closes_at) select generate_series(0,6),'08:00','20:00';
 `);
});
async function admin() {
  await db.exec(
    "set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001'",
  );
}
async function time(hour = 10, day = 3) {
  return (
    await db.query<{ t: string }>(
      "select ((((now() at time zone 'Europe/Amsterdam')::date+$1::int)+make_time($2,0,0)) at time zone 'Europe/Amsterdam')::text t",
      [day, hour],
    )
  ).rows[0].t;
}
async function book(hour = 10, lat = 52.37, lng = 4.89) {
  serial++;
  const { rows } = await db.query<{ b: { reference: string; token: string } }>(
    "select public.create_booking($1,$2,'Testklant',$3,$4,'','Teststraat',$5,'1012AB','Amsterdam',$6,$7,100,$8,'deposit',false) b",
    [
      model,
      JSON.stringify([{ repairTypeId: repair, qualityId: quality }]),
      "060000" + serial,
      "test" + serial + "@example.test",
      String(serial),
      lat,
      lng,
      await time(hour),
    ],
  );
  return rows[0].b;
}
async function id(b: { reference: string }) {
  return (
    await db.query<{ id: string }>(
      "select id from appointments where reference=$1",
      [b.reference],
    )
  ).rows[0].id;
}
test("stock reservations prevent overselling and release on cancellation and expiration", async () => {
  await admin();
  await db.query("select save_stock($1,$2,$3,1,2)", [model, repair, quality]);
  await db.exec("set request.jwt.claim.sub=''");
  const b = await book();
  await assert.rejects(book(12), /niet op voorraad/);
  await db.query("select cancel_booking($1,$2)", [b.reference, b.token]);
  const second = await book(12);
  assert.equal(
    (await db.query<{ reserved: number }>("select reserved from stock_items"))
      .rows[0].reserved,
    1,
  );
  await db.query(
    "update appointments set status='expired' where reference=$1",
    [second.reference],
  );
  assert.equal(
    (await db.query<{ reserved: number }>("select reserved from stock_items"))
      .rows[0].reserved,
    0,
  );
});
test("consumption is idempotent and consumed parts cannot be silently reused", async () => {
  await admin();
  await db.query("select save_stock($1,$2,$3,2,1)", [model, repair, quality]);
  const b = await book();
  await db.query("update appointments set status='ready' where reference=$1", [
    b.reference,
  ]);
  await db.query(
    "update appointments set status='returned' where reference=$1",
    [b.reference],
  );
  assert.deepEqual(
    (await db.query("select on_hand,reserved from stock_items")).rows,
    [{ on_hand: 1, reserved: 0 }],
  );
  await assert.rejects(
    db.query("update appointments set status='in_repair' where reference=$1", [
      b.reference,
    ]),
    /al verbruikt/,
  );
});
test("initial stock configuration reconciles already booked parts", async () => {
  await book();
  await admin();
  await assert.rejects(
    db.query("select save_stock($1,$2,$3,0,1)", [model, repair, quality]),
    /check constraint/,
  );
  await db.query("select save_stock($1,$2,$3,3,1)", [model, repair, quality]);
  assert.equal(
    (await db.query<{ reserved: number }>("select reserved from stock_items"))
      .rows[0].reserved,
    1,
  );
});
test("private rescheduling preserves all money and rejects invalid tokens", async () => {
  const b = await book();
  const key = await id(b);
  await db.query(
    "update appointments set paid_cents=3000,payment_status='deposit_paid' where id=$1",
    [key],
  );
  await assert.rejects(
    db.query("select reschedule_booking($1,'wrong-token',$2)", [
      b.reference,
      await time(12),
    ]),
    /niet gevonden/,
  );
  await db.query("select reschedule_booking($1,$2,$3)", [
    b.reference,
    b.token,
    await time(12),
  ]);
  const a = (
    await db.query<{
      paid_cents: number;
      total_cents: number;
      travel_fee_cents: number;
      h: number;
    }>(
      "select paid_cents,total_cents,travel_fee_cents,extract(hour from starts_at at time zone 'Europe/Amsterdam')::int h from appointments where id=$1",
      [key],
    )
  ).rows[0];
  assert.deepEqual(a, {
    paid_cents: 3000,
    total_cents: 20001,
    travel_fee_cents: 10000,
    h: 12,
  });
  assert.equal(
    (await db.query("select * from appointment_events where kind='verzet'"))
      .rows.length,
    1,
  );
});
test("rescheduling enforces cutoff, payment holds and overlapping appointments", async () => {
  const a = await book(),
    b = await book(12);
  await assert.rejects(
    db.query("select reschedule_booking($1,$2,$3)", [
      a.reference,
      a.token,
      await time(12),
    ]),
    /Verzetten kan niet/,
  );
  await db.query(
    "update appointments set hold_expires_at=now()+interval '15 minutes' where reference=$1",
    [a.reference],
  );
  assert.equal(
    (
      await db.query("select * from reschedule_slots($1,$2,$3::date)", [
        a.reference,
        a.token,
        (await time(14)).slice(0, 10),
      ])
    ).rows.length,
    0,
  );
  await db.query(
    "update appointments set hold_expires_at=null where reference=$1",
    [a.reference],
  );
  await db.exec("update operations_settings set reschedule_hours=168");
  await assert.rejects(
    db.query("select reschedule_booking($1,$2,$3)", [
      a.reference,
      a.token,
      await time(14),
    ]),
    /Verzetten kan niet/,
  );
  assert.ok(b.reference);
});
test("route estimates remove infeasible adjacent slots and enforce direct inserts", async () => {
  await db.exec(
    "update operations_settings set route_planning=true,average_kmh=35,arrival_margin_minutes=10",
  );
  await book(10);
  await assert.rejects(book(11, 52.5, 5.0), /planning/);
  const possible = await db.query<{ slot_start: string }>(
    "select * from available_route_slots($1::date,45,52.5,5.0)",
    [(await time(12)).slice(0, 10)],
  );
  assert.ok(possible.rows.length > 0);
  const blocked = await time(11);
  assert.ok(
    possible.rows.every(
      (r) => new Date(r.slot_start).getTime() !== new Date(blocked).getTime(),
    ),
  );
});

test("reports and invoices require admin; customer documents require the matching private token", async () => {
  const b = await book(),
    key = await id(b);
  const checks = {
    touchscreen: "pass",
    camera: "not_tested",
    charging: "pass",
    sound: "fail",
  };
  await assert.rejects(
    db.query("select save_repair_report($1,$2,'Scherm vervangen',true)", [
      key,
      JSON.stringify(checks),
    ]),
    /Geen toegang/,
  );
  await admin();
  await db.query("select save_repair_report($1,$2,'Scherm vervangen',false)", [
    key,
    JSON.stringify(checks),
  ]);
  await db.exec("set request.jwt.claim.sub=''");
  let doc = (
    await db.query<{ d: { report: unknown } }>(
      "select booking_documents($1,$2) d",
      [b.reference, b.token],
    )
  ).rows[0].d;
  assert.equal(doc.report, null);
  await admin();
  await db.query("select save_repair_report($1,$2,'Scherm vervangen',true)", [
    key,
    JSON.stringify(checks),
  ]);
  await db.exec("set request.jwt.claim.sub=''");
  doc = (
    await db.query<{ d: { report: unknown } }>(
      "select booking_documents($1,$2) d",
      [b.reference, b.token],
    )
  ).rows[0].d;
  assert.ok(doc.report);
  assert.equal(
    (
      await db.query<{ d: unknown }>(
        "select booking_documents($1,'wrong-token') d",
        [b.reference],
      )
    ).rows[0].d,
    null,
  );
});
test("invoices are sequential immutable snapshots and issuance retries are idempotent", async () => {
  const a = await book(),
    b = await book(12);
  await admin();
  await assert.rejects(
    db.query("select issue_invoice($1)", [await id(a)]),
    /Rond de reparatie/,
  );
  await db.exec("update appointments set status='returned'");
  await assert.rejects(
    db.query("select issue_invoice($1)", [await id(a)]),
    /factuurgegevens/,
  );
  await db.exec(
    "update operations_settings set legal_name='Testbedrijf',business_address='Teststraat 1, 1012AB Amsterdam',kvk_number='12345678',vat_number='NLTEST',vat_percent=21",
  );
  const first = (
    await db.query<{ nr: string }>("select issue_invoice($1) nr", [await id(a)])
  ).rows[0].nr;
  assert.equal(
    (
      await db.query<{ nr: string }>("select issue_invoice($1) nr", [
        await id(a),
      ])
    ).rows[0].nr,
    first,
  );
  const second = (
    await db.query<{ nr: string }>("select issue_invoice($1) nr", [await id(b)])
  ).rows[0].nr;
  assert.ok(first.endsWith("000001"));
  assert.ok(second.endsWith("000002"));
  await db.exec("update operations_settings set legal_name='Anders'");
  const snapshot = (
    await db.query<{
      snapshot: {
        legalName: string;
        netCents: number;
        vatCents: number;
        totalCents: number;
      };
    }>("select snapshot from invoices where number=$1", [first])
  ).rows[0].snapshot;
  assert.equal(snapshot.legalName, "Testbedrijf");
  assert.equal(snapshot.netCents + snapshot.vatCents, snapshot.totalCents);
  assert.equal(snapshot.netCents, 16529);
});
test("anonymous API roles cannot access inventory, invoice tables or the ignore-id planning helper", async () => {
  await db.exec("set role anon");
  try {
    assert.equal((await db.query("select * from stock_items")).rows.length, 0);
    assert.equal((await db.query("select * from invoices")).rows.length, 0);
    await assert.rejects(
      db.query("select * from operations_slots(current_date,45,52.37,4.89)"),
      /permission denied/,
    );
  } finally {
    await db.exec("reset role");
  }
});

test("ordinary signed-in users cannot change stock, reports, invoices or private settings", async () => {
  const b = await book(),
    key = await id(b);
  await db.exec("set role authenticated");
  try {
    assert.equal(
      (await db.query("select * from operations_settings")).rows.length,
      0,
    );
    await assert.rejects(
      db.query("select save_stock($1,$2,$3,3,1)", [model, repair, quality]),
      /Geen toegang/,
    );
    await assert.rejects(
      db.query("select issue_invoice($1)", [key]),
      /Geen toegang/,
    );
    await assert.rejects(
      db.query("select save_repair_report($1,'{}','fake',true)", [key]),
      /Geen toegang/,
    );
    await assert.rejects(
      db.query(
        "insert into invoices(appointment_id,number,snapshot) values($1,'forged','{}')",
        [key],
      ),
      /row-level security/,
    );
  } finally {
    await db.exec("reset role");
  }
});
test("unpublished photos remain private and publication requires consent", async () => {
  await admin();
  await db.exec("set role authenticated");
  try {
    await assert.rejects(
      db.query(
        "insert into site_photos(image_url,alt,published) values('https://example.test/photo.jpg','Een reparatie',true)",
      ),
      /check constraint/,
    );
    await db.exec(
      "insert into site_photos(image_url,alt,published,consent_confirmed) values('https://example.test/photo.jpg','Een reparatie',false,true)",
    );
  } finally {
    await db.exec("reset role;set request.jwt.claim.sub='';set role anon");
  }
  try {
    assert.equal((await db.query("select * from site_photos")).rows.length, 0);
  } finally {
    await db.exec("reset role");
  }
});
test("stock availability hides exhausted combinations without exposing quantities", async () => {
  await admin();
  await db.query("select save_stock($1,$2,$3,0,2)", [model, repair, quality]);
  assert.equal(
    (await db.query("select * from stock_available_options($1)", [model])).rows
      .length,
    0,
  );
  await db.query("select save_stock($1,$2,$3,1,2)", [model, repair, quality]);
  assert.deepEqual(
    (await db.query("select * from stock_available_options($1)", [model])).rows,
    [{ repair_type_id: repair, quality_id: quality }],
  );
});

test("parallel booking attempts cannot sell the last tracked part twice", async () => {
  await admin();
  await db.query("select save_stock($1,$2,$3,1,1)", [model, repair, quality]);
  const result = await Promise.allSettled([book(10), book(12)]);
  assert.equal(result.filter((r) => r.status === "fulfilled").length, 1);
  assert.deepEqual(
    (await db.query("select on_hand,reserved from stock_items")).rows,
    [{ on_hand: 1, reserved: 1 }],
  );
});
