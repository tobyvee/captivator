"use client";

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";

type Props = { children: ReactNode; title: string };

const PAGE_WIDTH = 1280;
const PAGE_HEIGHT = 800;

/**
 * A 1280×800 laptop browser window, scaled down to the stage's width. The scaled shell doesn't
 * scroll, and its `transform` makes it the containing block for fixed descendants, so the terms
 * sheet covers the window's page rather than the editor and stays put while the page scrolls
 * (T-021-fixed-sheet-in-every-mode). The page inside it scrolls, because the splash root grows
 * with its content (general-splash-root-grows-in-frame).
 */
export function BrowserFrame({ children, title }: Props) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  // A layout effect, so the first observation lands before the first paint. ResizeObserver
  // reports the box's size as soon as it starts observing.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  // Until the box is measured (or where it can't be), show the page at full size.
  const scale = width > 0 ? Math.min(1, width / PAGE_WIDTH) : 1;

  return (
    <div className="w-full min-w-0 overflow-hidden rounded-xl border border-zinc-300 bg-white shadow-[0_18px_40px_rgba(24,24,27,0.16)]">
      <div
        aria-hidden="true"
        className="flex h-[34px] items-center gap-2 border-b border-zinc-200 bg-zinc-100 px-3"
      >
        <span className="size-2.5 shrink-0 rounded-full bg-zinc-300" />
        <span className="size-2.5 shrink-0 rounded-full bg-zinc-300" />
        <span className="size-2.5 shrink-0 rounded-full bg-zinc-300" />
        <span className="mx-auto min-w-0 truncate rounded-md bg-white px-10 py-0.5 text-[11px] text-zinc-600 max-sm:px-3">
          Sign in to {title.trim() || "Guest WiFi"}
        </span>
      </div>
      <div ref={boxRef} style={{ height: PAGE_HEIGHT * scale }} className="relative overflow-hidden">
        <div
          style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT, transform: `scale(${scale})` }}
          className="absolute top-0 left-0 origin-top-left"
        >
          <div className="h-full overflow-x-hidden overflow-y-auto overscroll-contain bg-white">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
