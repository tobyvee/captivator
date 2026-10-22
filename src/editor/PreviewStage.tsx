"use client";

import { TriangleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { useStore } from "@/lib/store";
import { SplashPage } from "@/splash/SplashPage";
import { ReadabilityCheck } from "./checks/ReadabilityCheck";
import { useFitCheck } from "./checks/useFitCheck";
import { BrowserFrame } from "./frames/BrowserFrame";
import { PhoneFrame } from "./frames/PhoneFrame";
import { ScreenSwitcher } from "./ScreenSwitcher";

const CAPTIONS = {
  mobile: "375 × 740, iPhone login sheet",
  desktop:
    "1280 × 800 laptop browser. The content column stays 420 px wide; the photo fills the window.",
} as const;

function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="flex max-w-[420px] items-start gap-2.5 rounded-lg border border-[#FDE68A] bg-[#FFFBEB] px-3 py-2.5">
      <TriangleAlert size={18} strokeWidth={2.2} aria-hidden="true" className="mt-px shrink-0 text-[#92400E]" />
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[13px] font-semibold text-[#78350F]">{title}</span>
        {children}
      </div>
    </div>
  );
}

/** The live preview: the screen switcher, the device frame around SplashPage, and the notes under it. */
export function PreviewStage() {
  const design = useStore((s) => s.design);
  const name = useStore((s) => s.name);
  const device = useStore((s) => s.device);
  const screen = useStore((s) => s.screen);
  const selection = useStore((s) => s.selection);
  const saveFailed = useStore((s) => s.saveFailed);
  const restoreFailed = useStore((s) => s.restoreFailed);
  const setSelection = useStore((s) => s.setSelection);
  const setScreen = useStore((s) => s.setScreen);
  const dismissRestoreFailed = useStore((s) => s.dismissRestoreFailed);
  const fit = useFitCheck(design);

  const page = (
    <SplashPage
      design={design}
      screen={screen}
      mode="edit"
      inFrame
      selection={selection}
      onSelect={setSelection}
      onScreenChange={setScreen}
    />
  );

  // The fold belongs to the landing page; over the terms sheet it would read as part of the
  // sheet (T-009-fold-on-landing-screens).
  const showFold = fit.tooTall && (screen === "landing" || screen === "error");

  return (
    <section
      aria-label="Preview"
      className="flex min-w-0 flex-1 flex-col items-center justify-center gap-4 px-4 py-5"
    >
      <ScreenSwitcher />

      {device === "mobile" ? (
        <PhoneFrame showFold={showFold}>{page}</PhoneFrame>
      ) : (
        <BrowserFrame title={name}>{page}</BrowserFrame>
      )}

      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2.5 text-center text-xs text-zinc-700">
        <span>{CAPTIONS[device]}</span>
        <ReadabilityCheck design={design} />
      </div>

      {/* One live region that is always mounted, so screen readers announce a notice when it
          appears. When it's empty, its negative margin cancels the stage's gap. */}
      <div role="status" className="flex flex-col items-center gap-4 empty:-mt-4">
        {fit.tooTall && (
          <Notice title="Too tall for small phones">
            <span className="text-xs leading-[1.45] text-[#92400E]">
              On a small phone like an iPhone SE, guests have to scroll to reach Connect. Shorten
              text, remove a block or use smaller images.
            </span>
          </Notice>
        )}

        {saveFailed && <Notice title="Couldn't save locally. Your changes stay in this tab only." />}

        {restoreFailed && (
          <Notice title="Couldn't restore your saved design.">
            <button
              type="button"
              onClick={dismissRestoreFailed}
              className="-ml-2 flex min-h-11 items-center self-start rounded-md px-2 text-xs font-semibold text-[#78350F] underline hover:text-[#451A03] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Dismiss
            </button>
          </Notice>
        )}
      </div>

      {fit.probe}
    </section>
  );
}
