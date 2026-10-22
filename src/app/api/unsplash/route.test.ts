import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST, type UnsplashPhoto } from "./route";

// The Worker env the route reads its rate limiter from. Tests swap the binding per case.
const worker = vi.hoisted(() => ({
  env: {} as Record<string, unknown>,
  limit: vi.fn<(options: { key: string }) => Promise<{ success: boolean }>>(),
}));
vi.mock("cloudflare:workers", () => ({ env: worker.env }));

// A stand-in, never a real key: the repo is public.
const KEY = "test-access-key-not-real";
const DOWNLOAD = "https://api.unsplash.com/photos/abc123/download?ixid=xyz";

const fetchMock = vi.fn<typeof fetch>();
const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("UNSPLASH_ACCESS_KEY", KEY);
  worker.limit.mockResolvedValue({ success: true });
  worker.env.UNSPLASH_RATE_LIMIT = { limit: worker.limit };
});

afterEach(() => {
  fetchMock.mockReset();
  worker.limit.mockReset();
  consoleError.mockClear();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

function upstreamPhoto(id: string) {
  return {
    id,
    slug: `slug-${id}`,
    description: "extra",
    likes: 12,
    urls: {
      raw: `https://images.unsplash.com/photo-${id}?ixid=1`,
      small: `https://images.unsplash.com/photo-${id}?w=400`,
      regular: `https://images.unsplash.com/photo-${id}?w=1080`,
    },
    user: {
      id: "u1",
      username: "jo",
      name: "Jo Doe",
      location: "somewhere",
      links: { self: "https://api.unsplash.com/users/jo", html: "https://unsplash.com/@jo" },
    },
    links: {
      self: `https://api.unsplash.com/photos/${id}`,
      html: `https://unsplash.com/photos/${id}`,
      download_location: `https://api.unsplash.com/photos/${id}/download?ixid=xyz`,
    },
  };
}

function searchReply(results: unknown[]) {
  return Response.json({ total: results.length, total_pages: 1, results });
}

const CLIENT_IP = "203.0.113.7";

function search(query: string, headers: HeadersInit = { "cf-connecting-ip": CLIENT_IP }) {
  return GET(new Request(`https://app.example/api/unsplash?${query}`, { headers }));
}

function ping(body: unknown, ip: string | null = CLIENT_IP) {
  return POST(
    new Request("https://app.example/api/unsplash", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(ip === null ? {} : { "cf-connecting-ip": ip }) },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

function upstreamCall() {
  const call = fetchMock.mock.calls[0];
  if (!call) throw new Error("fetch was not called");
  const [input, init] = call;
  return { url: new URL(String(input)), init, headers: new Headers(init?.headers) };
}

/** Every response body and logged argument, to prove the key never leaks. */
function expectKeyNotLeaked(bodyText: string) {
  expect(bodyText).not.toContain(KEY);
  expect(JSON.stringify(consoleError.mock.calls)).not.toContain(KEY);
}

describe("GET /api/unsplash", () => {
  it("trims each result to the allowed fields", async () => {
    fetchMock.mockResolvedValue(searchReply([upstreamPhoto("a1")]));

    const res = await search("q=beach");

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      results: [
        {
          id: "a1",
          urls: {
            small: "https://images.unsplash.com/photo-a1?w=400",
            regular: "https://images.unsplash.com/photo-a1?w=1080",
          },
          user: { name: "Jo Doe", links: { html: "https://unsplash.com/@jo" } },
          links: { download_location: "https://api.unsplash.com/photos/a1/download?ixid=xyz" },
        },
      ],
    });
  });

  it("calls the search endpoint with the key header and an hour in vinext's data cache", async () => {
    fetchMock.mockResolvedValue(searchReply([]));

    const res = await search("q=beach");

    const { url, init, headers } = upstreamCall();
    expect(url.origin + url.pathname).toBe("https://api.unsplash.com/search/photos");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      query: "beach",
      orientation: "portrait",
      per_page: "12",
    });
    expect(headers.get("Authorization")).toBe(`Client-ID ${KEY}`);
    expect(headers.get("Accept-Version")).toBe("v1");
    expect(init?.next).toEqual({ revalidate: 3600 });
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=3600");
  });

  it("drops results whose URLs are off Unsplash's hosts or missing", async () => {
    const bad = (id: string, patch: (photo: ReturnType<typeof upstreamPhoto>) => void) => {
      const photo = upstreamPhoto(id);
      patch(photo);
      return photo;
    };
    fetchMock.mockResolvedValue(
      searchReply([
        bad("http", (p) => (p.urls.small = "http://images.unsplash.com/photo-x")),
        bad("host", (p) => (p.urls.regular = "https://images.unsplash.com.evil.example/x")),
        bad("js", (p) => (p.urls.regular = "javascript:alert(1)")),
        bad("profile", (p) => (p.user.links.html = "https://evil.example/@jo")),
        bad("userinfo", (p) => (p.user.links.html = "https://unsplash.com@evil.example/")),
        bad("port", (p) => (p.links.download_location = "https://api.unsplash.com:8443/photos/x/download")),
        bad("path", (p) => (p.links.download_location = "https://api.unsplash.com/me")),
        bad("missing", (p) => Reflect.deleteProperty(p.links, "download_location")),
        upstreamPhoto("good"),
      ]),
    );

    // Safe: the route's 200 body is { results: UnsplashPhoto[] }; the ids are what's asserted.
    const body = (await (await search("q=beach")).json()) as { results: UnsplashPhoto[] };

    expect(body.results.map((photo) => photo.id)).toEqual(["good"]);
  });

  it.each([
    ["no q", ""],
    ["an empty q", "q="],
    ["a blank q", "q=%20%20%09"],
  ])("refuses %s with 400 and no upstream call", async (_label, query) => {
    const res = await search(query);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("trims q, caps it at 100 characters and URL-encodes it", async () => {
    fetchMock.mockResolvedValue(searchReply([]));
    const long = `a&b=c#d ${"x".repeat(200)}`;

    await search(`q=${encodeURIComponent(`  ${long}  `)}`);

    const sent = String(fetchMock.mock.calls[0]?.[0]);
    expect(sent).toContain("query=a%26b%3Dc%23d%20xxx");
    expect(upstreamCall().url.searchParams.get("query")).toBe(long.slice(0, 100));
  });

  it("caps q by characters, so a cut through an emoji never breaks the request", async () => {
    fetchMock.mockResolvedValue(searchReply([]));

    const res = await search(`q=${encodeURIComponent("📷".repeat(150))}`);

    expect(res.status).toBe(200);
    expect(upstreamCall().url.searchParams.get("query")).toBe("📷".repeat(100));
  });

  it("drops a space left at the end of the 100-character cut", async () => {
    fetchMock.mockResolvedValue(searchReply([]));

    await search(`q=${"x".repeat(99)}%20yz`);

    expect(upstreamCall().url.searchParams.get("query")).toBe("x".repeat(99));
  });

  it("lower-cases q and collapses its whitespace, so equivalent searches share a cache entry", async () => {
    fetchMock.mockResolvedValue(searchReply([]));

    await search("q=Cat%20%20Dog");

    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("query=cat%20dog&");
  });

  it("ignores caller page and per_page parameters", async () => {
    fetchMock.mockResolvedValue(searchReply([]));

    await search("q=beach&page=999&per_page=30");

    const { searchParams } = upstreamCall().url;
    expect(searchParams.get("per_page")).toBe("12");
    expect(searchParams.has("page")).toBe(false);
  });

  it.each([
    ["unset", undefined],
    ["empty", ""],
    ["blank", "   "],
  ])("returns 503 without fetching when the key is %s", async (_label, value) => {
    vi.stubEnv("UNSPLASH_ACCESS_KEY", value);

    const res = await search("q=beach");

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Photo search is not set up" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["a 401", () => Response.json({ errors: [`OAuth error: ${KEY} is invalid`] }, { status: 401 })],
    ["a 429", () => new Response("Rate Limit Exceeded", { status: 429 })],
    ["a 500", () => new Response("upstream stack trace", { status: 500 })],
    ["invalid JSON", () => new Response("<html>", { status: 200 })],
    ["an unexpected shape", () => Response.json({ errors: ["nope"] })],
  ])("returns a bare 502 for %s from upstream", async (_label, reply) => {
    fetchMock.mockResolvedValue(reply());

    const res = await search("q=beach");
    const text = await res.text();

    expect(res.status).toBe(502);
    expect(JSON.parse(text)).toEqual({ error: "Photo search failed" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expectKeyNotLeaked(text);
  });

  it("returns a bare 502 when the upstream request throws", async () => {
    fetchMock.mockRejectedValue(new TypeError(`network down for Client-ID ${KEY}`));

    const res = await search("q=beach");
    const text = await res.text();

    expect(res.status).toBe(502);
    expect(JSON.parse(text)).toEqual({ error: "Photo search failed" });
    expectKeyNotLeaked(text);
  });

  it("never puts the key in a successful response", async () => {
    fetchMock.mockResolvedValue(searchReply([upstreamPhoto("a1")]));

    expectKeyNotLeaked(await (await search("q=beach")).text());
  });
});

describe("POST /api/unsplash", () => {
  it("pings the download location with the key and no redirect following, then returns 204", async () => {
    fetchMock.mockResolvedValue(Response.json({ url: "https://images.unsplash.com/x" }));

    const res = await ping({ downloadLocation: DOWNLOAD });

    expect(res.status).toBe(204);
    const { url, init, headers } = upstreamCall();
    expect(url.href).toBe(DOWNLOAD);
    expect(headers.get("Authorization")).toBe(`Client-ID ${KEY}`);
    expect(init?.redirect).toBe("manual");
  });

  it.each([
    "https://api.unsplash.com.evil.example/",
    "https://evil.example/?u=https://api.unsplash.com/",
    "https://api.unsplash.com@evil.example/",
    "http://api.unsplash.com/photos/x/download",
    "https://api.unsplash.com:8443/",
    // The same tricks with a real download path, so the host checks alone must refuse them.
    "https://api.unsplash.com.evil.example/photos/x/download",
    "https://api.unsplash.com@evil.example/photos/x/download",
    "https://user@api.unsplash.com/photos/x/download",
    "https://:pass@api.unsplash.com/photos/x/download",
    "https://api.unsplash.com:8443/photos/x/download",
    "https://evil.example/photos/x/download?api.unsplash.com",
    // On the host, but not the download endpoint.
    "https://api.unsplash.com/me",
    "https://api.unsplash.com/photos/x/download/../../me",
    "javascript:alert(1)",
    "not a url",
  ])("refuses a ping to %s with no outbound fetch", async (downloadLocation) => {
    const res = await ping({ downloadLocation });

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["invalid JSON", "{"],
    ["a missing field", {}],
    ["a non-string", { downloadLocation: 42 }],
    ["an oversized URL", { downloadLocation: `${DOWNLOAD}${"x".repeat(3000)}` }],
  ])("refuses %s with 400 and no outbound fetch", async (_label, body) => {
    const res = await ping(body);

    expect(res.status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 503 without fetching when the key is missing", async () => {
    vi.stubEnv("UNSPLASH_ACCESS_KEY", undefined);

    const res = await ping({ downloadLocation: DOWNLOAD });

    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "Photo search is not set up" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["an upstream error", () => fetchMock.mockResolvedValue(new Response(KEY, { status: 401 }))],
    ["a redirect", () => fetchMock.mockResolvedValue(new Response(null, { status: 302, headers: { Location: "https://evil.example/" } }))],
    ["a thrown request", () => fetchMock.mockRejectedValue(new TypeError(`failed for ${KEY}`))],
  ])("returns a bare 502 for %s", async (_label, arrange) => {
    arrange();

    const res = await ping({ downloadLocation: DOWNLOAD });
    const text = await res.text();

    expect(res.status).toBe(502);
    expect(JSON.parse(text)).toEqual({ error: "Photo search failed" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expectKeyNotLeaked(text);
  });
});

describe("rate limiting", () => {
  it("refuses a search over the client's limit with 429, no-store and no upstream call", async () => {
    worker.limit.mockResolvedValue({ success: false });

    const res = await search("q=cat");

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Too many searches, try again shortly" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a ping over the client's limit with 429, no-store and no outbound fetch", async () => {
    worker.limit.mockResolvedValue({ success: false });

    const res = await ping({ downloadLocation: DOWNLOAD });

    expect(res.status).toBe(429);
    expect(await res.json()).toEqual({ error: "Too many requests, try again shortly" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("keys search and ping by the client's Cloudflare IP, in separate buckets", async () => {
    fetchMock.mockImplementation(async () => searchReply([]));

    await search("q=cat");
    await ping({ downloadLocation: DOWNLOAD });

    expect(worker.limit.mock.calls).toEqual([
      [{ key: `search:${CLIENT_IP}` }],
      [{ key: `ping:${CLIENT_IP}` }],
    ]);
  });

  it("ignores a spoofable X-Forwarded-For and puts requests with no client IP in one shared bucket", async () => {
    fetchMock.mockImplementation(async () => searchReply([]));

    await search("q=cat", { "x-forwarded-for": "198.51.100.1" });
    await ping({ downloadLocation: DOWNLOAD }, null);

    expect(worker.limit.mock.calls).toEqual([[{ key: "search:unknown" }], [{ key: "ping:unknown" }]]);
  });

  it("fails closed with 503 and no upstream call when the limiter isn't bound", async () => {
    delete worker.env.UNSPLASH_RATE_LIMIT;

    const searched = await search("q=cat");
    const pinged = await ping({ downloadLocation: DOWNLOAD });

    for (const res of [searched, pinged]) {
      expect(res.status).toBe(503);
      expect(await res.json()).toEqual({ error: "Photo search is not set up" });
      expect(res.headers.get("Cache-Control")).toBe("no-store");
    }
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("cross-site requests", () => {
  function post(headers: Record<string, string>) {
    return POST(
      new Request("https://app.example/api/unsplash", {
        method: "POST",
        headers: { "cf-connecting-ip": CLIENT_IP, ...headers },
        body: JSON.stringify({ downloadLocation: DOWNLOAD }),
      }),
    );
  }

  it("refuses a text/plain ping with 415 and no outbound fetch", async () => {
    const res = await post({ "Content-Type": "text/plain" });

    expect(res.status).toBe(415);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a ping with no content type with 415 and no outbound fetch", async () => {
    // A string body would make Fetch add text/plain, so send bytes, which get no content type.
    const req = new Request("https://app.example/api/unsplash", {
      method: "POST",
      headers: { "cf-connecting-ip": CLIENT_IP },
      body: new TextEncoder().encode(JSON.stringify({ downloadLocation: DOWNLOAD })),
    });
    expect(req.headers.get("Content-Type")).toBeNull();

    const res = await POST(req);

    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["a form content type", { "Content-Type": "application/x-www-form-urlencoded" }],
    ["a JSON-like suffix", { "Content-Type": "application/json-patch+json" }],
  ])("refuses a ping with %s with 415", async (_label, headers) => {
    const res = await post(headers);

    expect(res.status).toBe(415);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a JSON content type with parameters and any casing", async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 200 }));

    const res = await post({ "Content-Type": "Application/JSON; charset=utf-8" });

    expect(res.status).toBe(204);
  });

  it("refuses a cross-site search with 403 and no upstream call", async () => {
    const res = await search("q=beach", { "cf-connecting-ip": CLIENT_IP, "Sec-Fetch-Site": "cross-site" });

    expect(res.status).toBe(403);
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("refuses a cross-site JSON ping with 403 and no outbound fetch", async () => {
    const res = await post({ "Content-Type": "application/json", "Sec-Fetch-Site": "cross-site" });

    expect(res.status).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each(["same-origin", "same-site", "none"])("still serves a search sent with Sec-Fetch-Site: %s", async (site) => {
    fetchMock.mockResolvedValue(searchReply([upstreamPhoto("a1")]));

    const res = await search("q=beach", { "cf-connecting-ip": CLIENT_IP, "Sec-Fetch-Site": site });

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
