import type { ReactNode } from "react";
import { FOLD_HEIGHT } from "@/lib/fit";

type Props = { children: ReactNode; showFold?: boolean };

/**
 * A 375×740 phone viewport. The shell doesn't scroll and is the containing block for fixed
 * descendants (`contain: layout`), so the terms sheet covers the phone's screen rather than the
 * editor window and stays put while the page scrolls (T-021-fixed-sheet-in-every-mode). The
 * viewport inside it scrolls, because the splash root grows with its content
 * (general-splash-root-grows-in-frame).
 */
export function PhoneFrame({ children, showFold = false }: Props) {
  return (
    <div
      style={{ contain: "layout" }}
      className="relative box-content h-[740px] w-[375px] shrink-0 overflow-hidden rounded-[46px] border-[10px] border-[#18181B] bg-white shadow-[0_18px_40px_rgba(24,24,27,0.18)]"
    >
      <div className="relative h-full overflow-x-hidden overflow-y-auto overscroll-contain">
        {children}
        {/* Inside the scroller, so it marks the same point of the page as the page scrolls. */}
        {showFold && (
          <div
            aria-hidden="true"
            style={{ top: FOLD_HEIGHT }}
            className="pointer-events-none absolute inset-x-0 z-[2] border-t-2 border-dashed border-[#FBBF24]"
          >
            <span className="absolute -top-[22px] right-2 rounded bg-[#FBBF24] px-1.5 py-0.5 text-[11px] font-semibold text-[#451A03]">
              Small-phone fold
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
