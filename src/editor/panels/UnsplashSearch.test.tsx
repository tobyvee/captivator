// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UnsplashPhoto } from "@/app/api/unsplash/route";
import { useStore } from "@/lib/store";
import type { BackgroundSpec, ImageBackground } from "@/lib/types";
import { BackgroundPanel } from "./BackgroundPanel";
import { UnsplashSearch } from "./UnsplashSearch";

// The component keeps a module-level cache for the page's life, so each test searches its own words.

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("fetch", fetchMock);
  // The download ping's reply; each test queues its search replies with mockResolvedValueOnce.
  fetchMock.mockImplementation(async () => new Response(null, { status: 204 }));
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

function photo(id: string, patch: Partial<{ name: string; html: string; regular: string }> = {}): UnsplashPhoto {
  return {
    id,
    urls: {
      small: `https://images.unsplash.com/photo-${id}?w=400`,
      regular: patch.regular ?? `https://images.unsplash.com/photo-${id}?ixid=abc&q=80&w=1080`,
    },
    user: { name: patch.name ?? "Jo Doe", links: { html: patch.html ?? "https://unsplash.com/@jo" } },
    links: { download_location: `https://api.unsplash.com/photos/${id}/download?ixid=abc` },
  };
}

const found = (photos: UnsplashPhoto[]) => Response.json({ results: photos });

const PHOTO_BG: ImageBackground = {
  type: "image",
  src: "data:image/webp;base64,OLD",
  fit: "fit",
  zoom: 1.5,
  focus: { x: 20, y: 80 },
  backdrop: "#223344",
  overlay: { from: "#000000", to: "#111111", opacity: 0.6 },
};

const setBackground = (bg: BackgroundSpec) => act(() => void useStore.getState().updateBackground(bg));
const background = () => useStore.getState().design.background;
const input = () => screen.getByRole("searchbox", { name: "Find a photo" });
const type = (value: string) => fireEvent.change(input(), { target: { value } });
const status = () => screen.getByRole("status");
const searches = () => fetchMock.mock.calls.filter(([, init]) => init?.method !== "POST");
const pings = () => fetchMock.mock.calls.filter(([, init]) => init?.method === "POST");

/** Runs the debounce and lets the reply settle. */
const settle = () => act(() => vi.advanceTimersByTimeAsync(400));

async function searchFor(query: string, reply: Response) {
  fetchMock.mockResolvedValueOnce(reply);
  type(query);
  await settle();
}

describe("UnsplashSearch", () => {
  it("searches only after a 400ms pause in typing", async () => {
    fetchMock.mockResolvedValue(found([photo("a1")]));
    render(<UnsplashSearch />);

    type("har");
    await act(() => vi.advanceTimersByTimeAsync(300));
    type("harbour");
    await act(() => vi.advanceTimersByTimeAsync(399));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent("Searching…");

    await act(() => vi.advanceTimersByTimeAsync(1));

    expect(searches().map(([url]) => url)).toEqual(["/api/unsplash?q=harbour"]);
    expect(screen.getByRole("button", { name: "Photo by Jo Doe" })).toBeInTheDocument();
  });

  it("shows results as buttons in a list, each with the small image", async () => {
    render(<UnsplashSearch />);
    await searchFor("forest", found([photo("f1"), photo("f2", { name: "Sam Lee" })]));

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Photo by Sam Lee" })).toHaveAttribute(
      "src",
      "https://images.unsplash.com/photo-f2?w=400",
    );
  });

  it("answers a repeat query from the cache, however it is spaced or cased", async () => {
    render(<UnsplashSearch />);
    await searchFor("mountain lake", found([photo("m1")]));
    await searchFor("desert", found([photo("d1")]));

    type("  Mountain   LAKE ");
    await settle();

    expect(searches()).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Photo by Jo Doe" })).toHaveAttribute(
      "src",
      "https://images.unsplash.com/photo-m1?w=400",
    );
  });

  it("doesn't search a blank query", async () => {
    render(<UnsplashSearch />);
    type("   ");
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(status()).toBeEmptyDOMElement();
  });

  it("drops a slow reply for a query that has since changed, even when the newer search failed", async () => {
    let answerFirst: (res: Response) => void = () => {};
    fetchMock.mockImplementationOnce(() => new Promise((resolve) => (answerFirst = resolve)));
    render(<UnsplashSearch />);
    type("snow");
    await settle();

    await searchFor("snowy peaks", Response.json({ error: "Photo search is not set up" }, { status: 503 }));
    await act(async () => answerFirst(found([photo("s1", { name: "First" })])));

    expect(status()).toHaveTextContent("Photo search isn't available right now. Upload your own instead.");
    expect(screen.queryByRole("img", { name: "Photo by First" })).not.toBeInTheDocument();
  });

  it("retries a failed query when it is typed again, without showing the old failure", async () => {
    render(<UnsplashSearch />);
    await searchFor("river", Response.json({ error: "Photo search failed" }, { status: 502 }));
    type("rivers");
    fetchMock.mockResolvedValueOnce(found([photo("r1")]));
    type("river");

    expect(status()).toHaveTextContent("Searching…");
    await settle();
    expect(searches().map(([url]) => url)).toEqual(["/api/unsplash?q=river", "/api/unsplash?q=river"]);
    expect(screen.getByRole("button", { name: "Photo by Jo Doe" })).toBeInTheDocument();
  });

  it("announces how many photos were found, for screen readers only", async () => {
    render(<UnsplashSearch />);
    await searchFor("tide pools", found([photo("t1"), photo("t2")]));
    expect(status()).toHaveTextContent("2 photos found for “tide pools”");
    expect(status()).toHaveClass("sr-only");

    await searchFor("rock pool", found([photo("t3")]));
    expect(status()).toHaveTextContent("1 photo found for “rock pool”");
  });

  it("announces a cached repeat query too", async () => {
    render(<UnsplashSearch />);
    await searchFor("palm", found([photo("p1")]));
    await searchFor("pine", found([photo("p2")]));
    const before = status().textContent;

    type("Palm");

    expect(status().textContent).not.toBe(before);
    expect(status()).toHaveTextContent("1 photo found for “palm”");
  });

  it("says when nothing was found", async () => {
    render(<UnsplashSearch />);
    await searchFor("zzqqxx", found([]));

    expect(status()).toHaveTextContent("No photos found");
    expect(status()).not.toHaveClass("sr-only");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it.each([
    ["503 (not set up)", () => fetchMock.mockResolvedValueOnce(Response.json({ error: "Photo search is not set up" }, { status: 503 }))],
    ["502 (Unsplash failed)", () => fetchMock.mockResolvedValueOnce(Response.json({ error: "Photo search failed" }, { status: 502 }))],
    ["a network error", () => fetchMock.mockRejectedValueOnce(new TypeError("offline"))],
    ["an unreadable reply", () => fetchMock.mockResolvedValueOnce(new Response("<html>", { status: 200 }))],
    ["a 200 without a results list", () => fetchMock.mockResolvedValueOnce(Response.json({ results: { id: "x" } }))],
  ])("falls back to upload on %s", async (label, arrange) => {
    arrange();
    render(<UnsplashSearch />);
    type(`city ${label}`);
    await settle();

    expect(status()).toHaveTextContent("Photo search isn't available right now. Upload your own instead.");
  });

  it("shows the route's own message for a 429", async () => {
    render(<UnsplashSearch />);
    await searchFor("busy", Response.json({ error: "Too many searches, try again shortly" }, { status: 429 }));

    expect(status()).toHaveTextContent("Too many searches, try again shortly");
  });

  it("sets a photo with its credit, keeping the current photo's settings, then pings the download", async () => {
    setBackground(PHOTO_BG);
    render(<UnsplashSearch />);
    await searchFor("harbour night", found([photo("h1")]));

    fireEvent.click(screen.getByRole("button", { name: "Photo by Jo Doe" }));

    expect(background()).toEqual({
      ...PHOTO_BG,
      src: "https://images.unsplash.com/photo-h1?ixid=abc&q=70&w=1600",
      credit: {
        name: "Jo Doe",
        profileUrl: "https://unsplash.com/@jo?utm_source=captivator&utm_medium=referral",
        downloadLocation: "https://api.unsplash.com/photos/h1/download?ixid=abc",
      },
    });
    expect(screen.getByRole("button", { name: "Photo by Jo Doe" })).toHaveAttribute("aria-pressed", "true");
    expect(pings()).toHaveLength(1);
    const [url, init] = pings()[0] ?? [];
    expect(url).toBe("/api/unsplash");
    expect(new Headers(init?.headers).get("Content-Type")).toBe("application/json");
    expect(JSON.parse(String(init?.body))).toEqual({
      downloadLocation: "https://api.unsplash.com/photos/h1/download?ixid=abc",
    });
  });

  it("turns a colour background into a photo with the new-photo defaults", async () => {
    setBackground({ type: "colour", colour: "#123456" });
    render(<UnsplashSearch />);
    await searchFor("meadow", found([photo("g1")]));

    fireEvent.click(screen.getByRole("button", { name: "Photo by Jo Doe" }));

    expect(background()).toMatchObject({
      type: "image",
      fit: "fill",
      zoom: 1,
      focus: { x: 50, y: 50 },
      backdrop: "#123456",
      overlay: { from: "#000000", to: "#000000", opacity: 0.4 },
    });
  });

  it("doesn't ping again when the chosen photo is picked a second time", async () => {
    render(<UnsplashSearch />);
    await searchFor("lighthouse", found([photo("l1")]));
    const result = screen.getByRole("button", { name: "Photo by Jo Doe" });

    fireEvent.click(result);
    fireEvent.click(result);

    expect(pings()).toHaveLength(1);
  });

  it("leaves the design unchanged, says so and pings nothing when a result fails the allowlist", async () => {
    setBackground(PHOTO_BG);
    render(<UnsplashSearch />);
    await searchFor(
      "bad links",
      found([
        photo("x1", { name: "Off host", html: "https://evil.example/@jo" }),
        photo("x2", { name: "Plain http", regular: "http://images.unsplash.com/photo-x2?w=1080" }),
      ]),
    );

    for (const name of ["Photo by Off host", "Photo by Plain http"]) {
      fireEvent.click(screen.getByRole("button", { name }));
      expect(background()).toEqual(PHOTO_BG);
      expect(screen.getByRole("alert")).toHaveTextContent("That photo can't be used. Try another.");
    }
    expect(pings()).toHaveLength(0);
  });

  it("renders a photographer's name as text, never markup", async () => {
    const name = '<img src=x onerror="alert(1)">';
    render(<UnsplashSearch />);
    await searchFor("markup", found([photo("k1", { name })]));

    expect(screen.getAllByRole("img")).toHaveLength(1);
    expect(screen.getByRole("img")).toHaveAttribute("alt", `Photo by ${name}`);
  });

  it("cancels a pending search when the panel closes", async () => {
    const { unmount } = render(<UnsplashSearch />);
    type("closing");
    unmount();
    await settle();

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("shows the picked photo's credit in the Background panel", async () => {
    setBackground(PHOTO_BG);
    render(<BackgroundPanel />);
    await searchFor("credit line", found([photo("c1", { name: "Ana <b>Bold</b>" })]));

    fireEvent.click(screen.getByRole("button", { name: "Photo by Ana <b>Bold</b>" }));

    const credit = screen.getByRole("link", { name: "Ana <b>Bold</b>" });
    expect(credit).toHaveAttribute("href", "https://unsplash.com/@jo?utm_source=captivator&utm_medium=referral");
    expect(credit.closest("p")).toHaveTextContent("Photo by Ana <b>Bold</b> on Unsplash");
  });
});
