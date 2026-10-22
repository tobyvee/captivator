import { env } from "cloudflare:workers";
import { z } from "zod";

// The app's only server code. It holds the Unsplash key, so it trims what it
// returns, never echoes upstream details, and pings only Unsplash's own API.

const SEARCH_URL = "https://api.unsplash.com/search/photos";
const MAX_QUERY_LENGTH = 100;
const CACHE_SECONDS = 3600;
const NOT_SET_UP = "Photo search is not set up";
const FAILED = "Photo search failed";

/**
 * The URL's canonical href when it is plain `https:` on exactly `hostname`, with
 * no userinfo and the default port; otherwise null. Parsed, never prefix-matched,
 * so `api.unsplash.com.evil.example` and `api.unsplash.com@evil.example` fail.
 */
function httpsHref(value: string, hostname: string): string | null {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }
  const ok =
    url.protocol === "https:" &&
    url.hostname === hostname &&
    url.username === "" &&
    url.password === "" &&
    url.port === "";
  return ok ? url.href : null;
}

// Unsplash's download endpoint is /photos/:id/download; nothing else on the API is pinged.
const DOWNLOAD_PATH = /^\/photos\/[\w-]+\/download$/;

function downloadHref(value: string): string | null {
  const href = httpsHref(value, "api.unsplash.com");
  return href !== null && DOWNLOAD_PATH.test(new URL(href).pathname) ? href : null;
}

// Keeps a URL (canonicalised) only when `check` allows it; anything else drops the photo.
const AllowedUrl = (check: (value: string) => string | null) =>
  z.string().transform((value, ctx) => {
    const href = check(value);
    if (href === null) ctx.issues.push({ code: "custom", message: "Disallowed URL", input: value });
    return href ?? z.NEVER;
  });
const ImageUrl = AllowedUrl((value) => httpsHref(value, "images.unsplash.com"));

// z.object strips every upstream field not named here, which is the trimming.
const Photo = z.object({
  id: z.string().min(1),
  urls: z.object({ small: ImageUrl, regular: ImageUrl }),
  user: z.object({
    name: z.string(),
    links: z.object({ html: AllowedUrl((value) => httpsHref(value, "unsplash.com")) }),
  }),
  links: z.object({ download_location: AllowedUrl(downloadHref) }),
});

/** One search result, exactly as `GET /api/unsplash` returns it. */
export type UnsplashPhoto = z.infer<typeof Photo>;

const SearchResponse = z.object({ results: z.array(z.unknown()) });

const PingBody = z.object({ downloadLocation: z.string().max(2048) });

function json(body: unknown, status: number, cacheControl = "no-store"): Response {
  return Response.json(body, { status, headers: { "Cache-Control": cacheControl } });
}

function accessKey(): string | null {
  const key = process.env.UNSPLASH_ACCESS_KEY?.trim();
  return key ? key : null;
}

function authHeaders(key: string): HeadersInit {
  return { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" };
}

/**
 * A 429 when this client is over its per-minute limit for `bucket`, a 503 when the
 * limiter isn't bound (fail closed: an unthrottled route can spend the whole hourly
 * quota), or null to go ahead. Keyed by Cloudflare's `cf-connecting-ip`, never a
 * client-set header; requests without it share one bucket.
 */
async function throttle(request: Request, bucket: "search" | "ping"): Promise<Response | null> {
  const limiter: RateLimit | undefined = env.UNSPLASH_RATE_LIMIT;
  if (!limiter) {
    console.error("Unsplash rate limiter is not bound");
    return json({ error: NOT_SET_UP }, 503);
  }
  const ip = request.headers.get("cf-connecting-ip") ?? "unknown";
  const { success } = await limiter.limit({ key: `${bucket}:${ip}` });
  if (success) return null;
  const error = bucket === "search" ? "Too many searches, try again shortly" : "Too many requests, try again shortly";
  return json({ error }, 429);
}

/** `GET /api/unsplash?q=` → `{ results: UnsplashPhoto[] }`. */
export async function GET(request: Request): Promise<Response> {
  const throttled = await throttle(request, "search");
  if (throttled) return throttled;

  const raw = new URL(request.url).searchParams.get("q") ?? "";
  // Lower-cased with whitespace collapsed, so "Cat  Dog" and "cat dog" share one cached upstream call.
  const normalised = raw.trim().replace(/\s+/g, " ").toLowerCase();
  // Cap by code points, so a cut never leaves a lone surrogate for encodeURIComponent to throw on.
  const q = Array.from(normalised).slice(0, MAX_QUERY_LENGTH).join("");
  if (q === "") return json({ error: "Enter something to search for" }, 400);

  const key = accessKey();
  if (key === null) return json({ error: NOT_SET_UP }, 503);

  const url = `${SEARCH_URL}?query=${encodeURIComponent(q)}&orientation=portrait&per_page=12`;
  let results: unknown[];
  try {
    // vinext's data cache (KV in production) keeps this for an hour across isolates.
    // Its key is a SHA-256 hash of the URL and headers, so the key never sits in KV in the clear.
    const upstream = await fetch(url, {
      headers: authHeaders(key),
      next: { revalidate: CACHE_SECONDS },
    });
    if (!upstream.ok) {
      console.error("Unsplash search failed with status", upstream.status);
      return json({ error: FAILED }, 502);
    }
    const parsed = SearchResponse.safeParse(await upstream.json());
    if (!parsed.success) {
      console.error("Unsplash search returned an unexpected shape");
      return json({ error: FAILED }, 502);
    }
    results = parsed.data.results;
  } catch {
    console.error("Unsplash search request failed");
    return json({ error: FAILED }, 502);
  }

  const photos = results.flatMap((item) => {
    const photo = Photo.safeParse(item);
    return photo.success ? [photo.data] : [];
  });
  return json({ results: photos }, 200, `public, max-age=${CACHE_SECONDS}`);
}

/** `POST /api/unsplash` with `{ downloadLocation }` → 204 once Unsplash has counted the download. */
export async function POST(request: Request): Promise<Response> {
  const throttled = await throttle(request, "ping");
  if (throttled) return throttled;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid download location" }, 400);
  }
  const parsed = PingBody.safeParse(body);
  const href = parsed.success ? downloadHref(parsed.data.downloadLocation) : null;
  if (href === null) return json({ error: "Invalid download location" }, 400);

  const key = accessKey();
  if (key === null) return json({ error: NOT_SET_UP }, 503);

  try {
    // redirect: "manual", so a redirect can't carry the key's request to another host.
    const upstream = await fetch(href, { headers: authHeaders(key), redirect: "manual" });
    await upstream.body?.cancel();
    if (!upstream.ok) {
      console.error("Unsplash download ping failed with status", upstream.status);
      return json({ error: FAILED }, 502);
    }
  } catch {
    console.error("Unsplash download ping request failed");
    return json({ error: FAILED }, 502);
  }
  return new Response(null, { status: 204, headers: { "Cache-Control": "no-store" } });
}
