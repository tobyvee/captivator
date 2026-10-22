"use client";

import { Wifi } from "lucide-react";
import { useRouter } from "next/navigation";
import { BLANK, type Template } from "@/lib/design-schema";
import { useHydrated, useStore } from "@/lib/store";
import { TEMPLATE_CREDITS, TEMPLATES } from "@/lib/templates";
import { TemplateCard } from "@/editor/TemplateCard";

const GRID = "grid grid-cols-[repeat(auto-fill,minmax(230px,1fr))] gap-5";

// Neutral card shapes in the grid's layout. The server render and the first client render both
// show this (the store hasn't read localStorage yet), so hydration matches and the "Continue your
// design" card never pops in above the templates after they've painted.
function Placeholder() {
  return (
    <div aria-busy="true" className={`${GRID} motion-safe:animate-pulse`}>
      <p role="status" className="sr-only">
        Loading templates…
      </p>
      {TEMPLATES.map((t) => (
        <div key={t.id} className="h-[476px] rounded-[14px] border border-zinc-200 bg-white p-[18px]">
          <div className="mx-auto h-[320px] w-[170px] rounded-[28px] bg-zinc-200" />
        </div>
      ))}
    </div>
  );
}

function Picker() {
  const router = useRouter();
  const hasSaved = useStore((s) => s.hasSaved);
  const design = useStore((s) => s.design);
  const name = useStore((s) => s.name);
  const loadTemplate = useStore((s) => s.loadTemplate);

  // Switching keeps the customer's text and uploaded images but changes the rest, so a saved
  // design asks first (T-019-confirm-on-use-not-templates, T-004-template-switch-carry-rule).
  function switchTo(template: Template) {
    const message = `Switch to ${template.name}? Your text and uploaded images are kept; colours and layout change.`;
    if (hasSaved && !window.confirm(message)) return;
    loadTemplate(template);
    router.push("/editor");
  }

  return (
    <div className={GRID}>
      {hasSaved && (
        <TemplateCard
          template={{ id: "saved", name: "Continue your design", description: name || "Untitled design", design }}
          primaryLabel="Continue"
          onUse={() => router.push("/editor")}
        />
      )}
      {TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          credit={TEMPLATE_CREDITS[template.id]}
          primaryLabel={template.id === BLANK.id ? "Start blank" : `Use ${template.name}`}
          variant={template.id === BLANK.id ? "outline" : "solid"}
          onUse={() => switchTo(template)}
        />
      ))}
    </div>
  );
}

export default function TemplatePickerPage() {
  // Restores the saved design after mount; "Continue your design" depends on it
  // (T-008-hydration-guard-in-step-2).
  const hydrated = useHydrated();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-2.5 border-b border-zinc-200 bg-white px-5 py-3.5">
        <Wifi size={22} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        <span className="text-[15px] font-bold">Captivator</span>
      </header>

      <main className="mx-auto flex w-full max-w-[1120px] flex-col gap-8 px-6 py-12">
        <div className="flex flex-col gap-2">
          <h1 className="text-[28px] font-bold">Start your WiFi login page</h1>
          <p className="text-[15px] text-zinc-700">
            Pick a starting point. You can change every colour, image and word afterwards, and switch
            templates without losing your content.
          </p>
        </div>
        {hydrated ? <Picker /> : <Placeholder />}
      </main>
    </div>
  );
}
