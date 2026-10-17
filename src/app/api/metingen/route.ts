import { recordMetric } from "@/lib/metrics";
import { siteUrl } from "@/components/site/site-url";
export async function POST(request: Request): Promise<Response> {
  if (process.env.NEXT_PUBLIC_FUNNEL_ENABLED !== "true")
    return new Response(null, { status: 204 });
  const origin = request.headers.get("origin");
  if (!origin || ![new URL(request.url).origin, siteUrl()].includes(origin))
    return new Response(null, { status: 403 });
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return new Response(null, { status: 415 });
  // Bound the body while streaming, even when Content-Length is omitted.
  const reader = request.body?.getReader();
  if (!reader) return new Response(null, { status: 400 });
  let body = "",
    bytes = 0;
  const decoder = new TextDecoder();
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 128) {
        await reader.cancel();
        return new Response(null, { status: 413 });
      }
      body += decoder.decode(chunk.value, { stream: true });
    }
    body += decoder.decode();
    const payload: unknown = JSON.parse(body);
    if (
      !payload ||
      typeof payload !== "object" ||
      Object.keys(payload).length !== 1 ||
      !("event" in payload) ||
      typeof payload.event !== "string" ||
      !/^step_[1-6]$/.test(payload.event)
    )
      return new Response(null, { status: 400 });
    const saved = await recordMetric(payload.event as "step_1");
    return new Response(null, { status: saved ? 204 : 503 });
  } catch {
    return new Response(null, { status: 400 });
  }
}
