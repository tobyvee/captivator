"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import type { UnsplashPhoto } from "@/app/api/unsplash/route";
import { useStore } from "@/lib/store";
import { withPhoto } from "./BackgroundPanel";

const DEBOUNCE_MS = 400;
const UNAVAILABLE = "Photo search isn't available right now. Upload your own instead.";
const RATE_LIMITED = "Too many searches, try again shortly";
const NOT_USABLE = "That photo can't be used. Try another.";

type Outcome = { status: "done"; photos: UnsplashPhoto[] } | { status: "failed"; message: string };
type View = { status: "idle" } | { status: "loading" } | Outcome;

// Results per normalised query for the life of the page, so a repeat search costs no request.
const cache = new Map<string, UnsplashPhoto[]>();

/** The query as the route normalises it, so "Cat  Dog" and "cat dog" share one cache entry. */
const normalise = (query: string) => query.trim().replace(/\s+/g, " ").toLowerCase();

async function searchPhotos(q: string): Promise<Outcome> {
  try {
    const res = await fetch(`/api/unsplash?q=${encodeURIComponent(q)}`);
    if (res.ok) {
      const body: unknown = await res.json();
      const results = typeof body === "object" && body !== null && "results" in body ? body.results : null;
      // Anything but a list is a broken reply: fall back, and cache nothing.
      if (Array.isArray(results)) {
        // Safe: the route builds each result through its own Zod schema before sending it.
        const photos = results as UnsplashPhoto[];
        cache.set(q, photos);
        return { status: "done", photos };
      }
    }
    // A 429 says to wait, in the route's words. Every other failure (503 not set up, 502 Unsplash
    // failed) reads the same to the customer.
    if (res.status === 429) return { status: "failed", message: await errorText(res, RATE_LIMITED) };
  } catch {
    // A network error or an unreadable body: the same fallback.
  }
  return { status: "failed", message: UNAVAILABLE };
}

async function errorText(res: Response, fallback: string): Promise<string> {
  const body: unknown = await res.json().catch(() => null);
  return typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
    ? body.error
    : fallback;
}

/** `href` with each param set (replacing any already there), or null if it doesn't parse. */
function withParams(href: string, params: Record<string, string>): string | null {
  try {
    const url = new URL(href);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
    return url.href;
  } catch {
    return null;
  }
}

/** The background `src` for a result: Unsplash's regular size, resized for a full-screen photo. */
const backgroundSrc = (photo: UnsplashPhoto) => withParams(photo.urls.regular, { w: "1600", q: "70" });

/** "Find a photo": Unsplash search in the Background panel's Photo tab. */
export function UnsplashSearch() {
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [settled, setSettled] = useState<{ q: string; outcome: Outcome } | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const currentSrc = useStore((s) => (s.design.background.type === "image" ? s.design.background.src : null));
  const updateBackground = useStore((s) => s.updateBackground);

  const q = normalise(query);
  const cached = cache.get(q);
  const view: View =
    q === ""
      ? { status: "idle" }
      : cached
        ? { status: "done", photos: cached }
        : settled?.q === q
          ? settled.outcome
          : { status: "loading" };

  // Search once typing pauses. The cleanup cancels a pending search and drops a slow reply for an
  // older query, so results never arrive out of order.
  useEffect(() => {
    if (q === "" || cache.has(q)) return;
    let current = true;
    const timer = window.setTimeout(() => {
      void searchPhotos(q).then((outcome) => {
        if (current) setSettled({ q, outcome });
      });
    }, DEBOUNCE_MS);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [q]);

  function pick(photo: UnsplashPhoto) {
    const src = backgroundSrc(photo);
    if (src !== null && src === currentSrc) return; // already the background: no second download ping
    const profileUrl = withParams(photo.user.links.html, { utm_source: "captivator", utm_medium: "referral" });
    const downloadLocation = photo.links.download_location;
    // Read the background now, not at render, and let withPhoto keep a photo's settings.
    // The store's schema check is the trust boundary: an off-allowlist URL is refused here.
    const ok =
      src !== null &&
      profileUrl !== null &&
      updateBackground(
        withPhoto(useStore.getState().design.background, src, { name: photo.user.name, profileUrl, downloadLocation }),
      );
    if (!ok) {
      setPickError(NOT_USABLE);
      return;
    }
    setPickError(null);
    // Unsplash counts a download when a photo is chosen. Fire and forget: the photo is already set.
    void fetch("/api/unsplash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ downloadLocation }),
    }).catch(() => {});
  }

  const found = view.status === "done" ? view.photos.length : 0;
  const status =
    view.status === "loading"
      ? "Searching…"
      : view.status === "failed"
        ? view.message
        : view.status === "done"
          ? found === 0
            ? "No photos found"
            : // Names the query, so a cached result with the same count as the last one is still announced.
              `${found} ${found === 1 ? "photo" : "photos"} found for “${q}”`
          : null;

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-[13px] font-semibold">
        Find a photo
      </label>
      <div
        className={[
          "flex min-h-11 items-center gap-2 rounded-lg border border-zinc-300 px-2.5",
          "focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-blue-600",
        ].join(" ")}
      >
        <Search size={16} strokeWidth={2} aria-hidden="true" className="shrink-0 text-zinc-600" />
        <input
          id={inputId}
          type="search"
          enterKeyHint="search"
          maxLength={100}
          value={query}
          onChange={(e) => {
            const value = e.currentTarget.value;
            setQuery(value);
            // Forget an outcome once its query is left, so coming back retries instead of showing it.
            setSettled((s) => (s !== null && s.q !== normalise(value) ? null : s));
            setPickError(null);
          }}
          className="min-h-11 min-w-0 flex-1 bg-transparent text-[15px] text-zinc-900 outline-none"
        />
      </div>

      {view.status === "done" && view.photos.length > 0 && (
        <ul aria-label="Photos from Unsplash" className="grid grid-cols-2 gap-2">
          {view.photos.map((photo) => {
            const name = photo.user.name.trim();
            const selected = currentSrc !== null && backgroundSrc(photo) === currentSrc;
            return (
              <li key={photo.id}>
                <button
                  type="button"
                  aria-current={selected || undefined}
                  onClick={() => pick(photo)}
                  className={[
                    "block h-24 w-full overflow-hidden rounded-md bg-[#0B1F2E] p-0",
                    "outline-offset-2 outline-blue-600 focus-visible:outline-3 focus-visible:outline-offset-4",
                    selected ? "outline-3" : "",
                  ].join(" ")}
                >
                  <img
                    src={photo.urls.small}
                    alt={name ? `Photo by ${name}` : "Photo from Unsplash"}
                    loading="lazy"
                    className="block size-full object-cover"
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* Both live regions stay mounted so screen readers announce text when it arrives. The count
          is for screen readers only: sighted users see the grid. */}
      <p role="status" className={found > 0 ? "sr-only" : "text-xs leading-snug text-zinc-600 empty:-mt-2"}>
        {status}
      </p>
      <p role="alert" className="text-xs leading-snug text-red-700 empty:-mt-2">
        {pickError}
      </p>
    </div>
  );
}
