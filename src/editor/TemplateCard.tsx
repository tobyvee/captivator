import { BLANK, type Template } from "@/lib/design-schema";
import { profileHref, UNSPLASH_HOME } from "@/splash/Background";
import { SplashPage } from "@/splash/SplashPage";

// No "use client": a presentational card that takes a callback and uses no hooks; it only runs
// inside the picker's client tree (T-008-use-client-on-stateful-modules).

type Props = {
  template: Template;
  credit?: { name: string; profileUrl: string };
  primaryLabel: string;
  onUse: () => void;
};

// The page is laid out at the phone frame's 375×740 and scaled to the mini-frame's inner width:
// 170px less the 7px border on each side.
const PAGE_WIDTH = 375;
const PAGE_HEIGHT = 740;
const SCALE = 156 / PAGE_WIDTH;

const LINK =
  "text-blue-700 underline hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600";

/** A picker card: a live thumbnail of the template's guest page, its details and a Use button. */
export function TemplateCard({ template, credit, primaryLabel, onUse }: Props) {
  const blank = template.id === BLANK.id;
  // The renderer's own credit rule: Unsplash profiles only, with the referral parameters
  // (T-016-credit-href-shared-with-splash).
  const profile = credit && profileHref(credit.profileUrl);

  return (
    <article
      className={`flex flex-col gap-3.5 rounded-[14px] p-[18px] ${
        blank ? "border-[1.5px] border-dashed border-zinc-400 bg-zinc-50" : "border border-zinc-200 bg-white"
      }`}
    >
      {/* The real renderer in preview mode, so the thumbnail never drifts from the output.
          Decorative: hidden from assistive tech, and inert so its inputs and buttons can't take
          focus or clicks. */}
      <div
        aria-hidden="true"
        inert
        className={`pointer-events-none h-[320px] w-[170px] self-center overflow-hidden rounded-[28px] border-[7px] ${
          blank ? "border-zinc-300" : "border-[#18181B]"
        }`}
      >
        <div
          style={{
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
            transform: `scale(${SCALE})`,
            transformOrigin: "top left",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SplashPage design={template.design} screen="landing" mode="preview" inFrame />
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-1">
        <h2 className="text-base font-bold break-words">{template.name}</h2>
        <p className="text-[13px] leading-[1.45] break-words text-zinc-700">{template.description}</p>
        {credit && (
          <p className="text-[11px] text-zinc-600">
            Photo:{" "}
            {profile ? (
              <a href={profile} target="_blank" rel="noopener noreferrer" className={LINK}>
                {credit.name}
              </a>
            ) : (
              credit.name
            )}{" "}
            /{" "}
            <a href={UNSPLASH_HOME} target="_blank" rel="noopener noreferrer" className={LINK}>
              Unsplash
            </a>
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onUse}
        className={`mt-auto min-h-11 rounded-lg text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
          blank
            ? "border border-zinc-900 bg-white text-zinc-900 hover:bg-zinc-100"
            : "bg-zinc-900 text-white hover:bg-zinc-700"
        }`}
      >
        {primaryLabel}
      </button>
    </article>
  );
}
