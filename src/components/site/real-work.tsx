import { cacheLife, cacheTag } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { Container } from "./ui";
import { h2Class } from "@/components/ui/styles";
import { safeHttps } from "@/lib/operations";
async function content() {
  "use cache";
  cacheLife({ stale: 60, revalidate: 60, expire: 300 });
  cacheTag("site-content");
  const db = createPublicClient();
  const [photos, review] = await Promise.all([
    db
      .from("site_photos")
      .select("id,image_url,alt,caption")
      .eq("published", true)
      .eq("consent_confirmed", true)
      .order("created_at", { ascending: false })
      .limit(6),
    db.rpc("review_link"),
  ]);
  return {
    photos: photos.data ?? [],
    review:
      typeof review.data === "string" && safeHttps(review.data)
        ? review.data
        : null,
  };
}
export async function RealWork() {
  const c = await content();
  if (!c.photos.length && !c.review) return null;
  return (
    <section className="border-t border-line py-14">
      <Container>
        <h2 className={h2Class}>Een kijkje bij 054repairs</h2>
        {c.photos.length > 0 && (
          <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.photos
              .filter((p) => safeHttps(p.image_url))
              .map((p) => (
                <figure
                  key={p.id}
                  className="overflow-hidden rounded-panel bg-ink-900"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={p.image_url}
                    alt={p.alt}
                    width={800}
                    height={600}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="aspect-[4/3] w-full object-cover"
                  />
                  {p.caption && (
                    <figcaption className="p-4 text-sm text-steel-300">
                      {p.caption}
                    </figcaption>
                  )}
                </figure>
              ))}
          </div>
        )}
        {c.review && (
          <a
            href={c.review}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex min-h-11 items-center text-cyan-300 underline"
          >
            Bekijk of schrijf een echte klantreview
          </a>
        )}
      </Container>
    </section>
  );
}
