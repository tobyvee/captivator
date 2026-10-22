"use client";

import { Trash } from "lucide-react";
import { type RefObject, useRef } from "react";
import { flushSync } from "react-dom";
import { useShallow } from "zustand/react/shallow";
import type { Design } from "@/lib/design-schema";
import { useStore } from "@/lib/store";
import type { Selection, TextBlockSpec } from "@/lib/types";
import { TermsSwitch } from "./controls/TermsSwitch";
import { BackgroundPanel } from "./panels/BackgroundPanel";
import { ButtonPanel } from "./panels/ButtonPanel";
import { FieldsPanel } from "./panels/FieldsPanel";
import { ImagePanel } from "./panels/ImagePanel";
import { TermsPanel } from "./panels/TermsPanel";
import { TextPanel } from "./panels/TextPanel";

// What the inspector shows, reduced to primitives so a shallow compare skips re-renders on
// design changes that don't affect the header (each panel subscribes to its own data).
type View =
  | { kind: "background" }
  | { kind: "text"; id: string; role: TextBlockSpec["role"] }
  | { kind: "image"; id: string }
  | { kind: "fields" }
  | { kind: "terms" }
  | { kind: "button" };

const TEXT_TITLES: Record<TextBlockSpec["role"], string> = {
  heading: "Heading",
  subheading: "Subheading",
  body: "Text",
};

function viewFor(selection: Selection, blocks: Design["blocks"]): View {
  switch (selection.kind) {
    case "block": {
      // A block that no longer exists (deleted, or a stale id) falls back to the background.
      const block = blocks.find((b) => b.id === selection.id);
      if (!block) return { kind: "background" };
      return block.kind === "text"
        ? { kind: "text", id: block.id, role: block.role }
        : { kind: "image", id: block.id };
    }
    case "background":
    case "fields":
    case "terms":
    case "button":
      return { kind: selection.kind };
    default: {
      const unreachable: never = selection.kind;
      return unreachable;
    }
  }
}

function headerFor(view: View): { title: string; subtitle?: string } {
  switch (view.kind) {
    case "background":
      return { title: "Background", subtitle: "Fills the whole screen behind your content" };
    case "text":
      return { title: TEXT_TITLES[view.role], subtitle: "Text block" };
    case "image":
      return { title: "Image", subtitle: "Image block" };
    case "fields":
      return { title: "Fields", subtitle: "Up to two" };
    case "terms":
      return { title: "Terms", subtitle: "Checkbox above the Connect button" };
    case "button":
      return { title: "Connect button" };
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}

function Panel({ view }: { view: View }) {
  switch (view.kind) {
    case "background":
      return <BackgroundPanel />;
    // Keyed by id so a panel's local state (drafts, open popovers) resets between blocks.
    case "text":
      return <TextPanel key={view.id} id={view.id} />;
    case "image":
      return <ImagePanel key={view.id} id={view.id} />;
    case "fields":
      return <FieldsPanel />;
    case "terms":
      return <TermsPanel />;
    case "button":
      return <ButtonPanel />;
    default: {
      const unreachable: never = view;
      return unreachable;
    }
  }
}

function DeleteBlock({ id, headingRef }: { id: string; headingRef: RefObject<HTMLHeadingElement | null> }) {
  const removeBlock = useStore((s) => s.removeBlock);
  return (
    <button
      type="button"
      aria-label="Delete block"
      onClick={() => {
        // Deleting unmounts this button, which would drop focus to <body>. flushSync renders the
        // Background view first, so focus lands on its heading.
        flushSync(() => removeBlock(id));
        headingRef.current?.focus();
      }}
      className="flex size-11 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <Trash size={16} aria-hidden="true" />
    </button>
  );
}

/** The right-hand column: a header for the selection, then that selection's panel. */
export function Inspector() {
  const view = useStore(useShallow((s) => viewFor(s.selection, s.design.blocks)));
  const { title, subtitle } = headerFor(view);
  const headingRef = useRef<HTMLHeadingElement>(null);

  return (
    <aside aria-label={`${title} settings`} className="flex flex-1 flex-col gap-[18px] px-[18px] py-4">
      <div className="flex items-center gap-2.5">
        <div className="flex min-w-0 grow flex-col">
          <h2
            ref={headingRef}
            tabIndex={-1}
            className="text-[15px] font-bold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {title}
          </h2>
          {subtitle && <p className="text-xs text-zinc-600">{subtitle}</p>}
        </div>
        {(view.kind === "text" || view.kind === "image") && <DeleteBlock id={view.id} headingRef={headingRef} />}
        {view.kind === "terms" && <TermsSwitch />}
      </div>
      <Panel view={view} />
    </aside>
  );
}
