// @vitest-environment jsdom
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import TemplatePickerPage from "@/app/page";
import { BLANK } from "@/lib/design-schema";
import { STORAGE_KEY, useStore } from "@/lib/store";
import { PHOTO_HERO, SPONSOR, TEMPLATE_CREDITS, TEMPLATES } from "@/lib/templates";
import { TemplateCard } from "./TemplateCard";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

// A customer's uploaded logo: a raster data URL that no template uses.
const UPLOADED_LOGO = "data:image/webp;base64,UklGRg==";

beforeEach(() => {
  push.mockReset();
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage(); // drop the write the reset scheduled
});

afterEach(() => {
  vi.restoreAllMocks();
});

function save(name: string) {
  const design = structuredClone(SPONSOR.design);
  const logo = design.blocks[0];
  if (logo.kind !== "image") throw new Error("Sponsor starts with its logo");
  logo.src = UPLOADED_LOGO;
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { design, name }, version: 2 }));
}

const cards = () => screen.getAllByRole("article");
const cardNamed = (name: string) => {
  const card = cards().find((c) => within(c).queryByRole("heading", { name }));
  if (!card) throw new Error(`No card named ${name}`);
  return card;
};

describe("TemplateCard", () => {
  it("shows the template's name, description and Use button", async () => {
    const onUse = vi.fn();
    render(<TemplateCard template={SPONSOR} primaryLabel="Use Sponsor" onUse={onUse} />);

    expect(screen.getByRole("heading", { level: 2, name: "Sponsor" })).toBeInTheDocument();
    expect(screen.getByText(SPONSOR.description)).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Use Sponsor" }));
    expect(onUse).toHaveBeenCalledOnce();
  });

  it("renders the real splash page as a hidden, inert, scaled thumbnail", () => {
    const { container } = render(<TemplateCard template={SPONSOR} primaryLabel="Use" onUse={() => {}} />);

    const frame = container.querySelector('[aria-hidden="true"]');
    expect(frame).toHaveAttribute("inert");
    expect(frame).toHaveClass("pointer-events-none", "h-[320px]", "w-[170px]");
    expect(frame?.firstElementChild).toHaveStyle({
      width: "375px",
      height: "740px",
      transform: `scale(${156 / 375})`,
    });
    // SplashPage's own output: the heading and the Connect button, out of the accessibility tree.
    expect(within(frame as HTMLElement).getByText("FREE WIFI")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "CONNECT" })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("links the photo credit to the photographer and Unsplash in a new tab", () => {
    const credit = TEMPLATE_CREDITS.sponsor;
    render(<TemplateCard template={SPONSOR} credit={credit} primaryLabel="Use" onUse={() => {}} />);

    const photographer = screen.getByRole("link", { name: "Marcel Strauß" });
    const unsplash = screen.getByRole("link", { name: "Unsplash" });
    expect(photographer.getAttribute("href")).toMatch(/^https:\/\/unsplash\.com\/@martzzl\?/);
    expect(unsplash).toHaveAttribute("href", "https://unsplash.com/?utm_source=captivator&utm_medium=referral");
    for (const link of [photographer, unsplash]) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  });

  it("shows a non-Unsplash credit as plain text", () => {
    const credit = { name: "Someone", profileUrl: "https://example.com/someone" };
    render(<TemplateCard template={SPONSOR} credit={credit} primaryLabel="Use" onUse={() => {}} />);

    expect(screen.getByText(/Someone/)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Someone" })).not.toBeInTheDocument();
  });

  it("shows no credit line without a credit", () => {
    render(<TemplateCard template={BLANK} primaryLabel="Start blank" onUse={() => {}} />);
    expect(screen.queryByText(/Photo:/)).not.toBeInTheDocument();
  });

  it("gives every button a 44px tap target and the outline variant an outline button", () => {
    render(
      <>
        <TemplateCard template={SPONSOR} primaryLabel="Use Sponsor" onUse={() => {}} />
        <TemplateCard template={BLANK} primaryLabel="Start blank" variant="outline" onUse={() => {}} />
      </>,
    );
    const use = screen.getByRole("button", { name: "Use Sponsor" });
    const blank = screen.getByRole("button", { name: "Start blank" });
    expect(use).toHaveClass("min-h-11", "bg-zinc-900");
    expect(blank).toHaveClass("min-h-11", "border", "bg-white");
  });
});

describe("TemplatePickerPage", () => {
  it("renders a placeholder on the server and hydrates without a mismatch", () => {
    const html = renderToString(<TemplatePickerPage />);
    expect(html).toContain("Start your WiFi login page");
    expect(html).toContain("Loading templates");
    expect(html).not.toContain("Use Sponsor");

    // React 19 reports a hydration mismatch through onRecoverableError, not console.error.
    const mismatch = vi.fn();
    const errors = vi.spyOn(console, "error");
    const container = document.createElement("div");
    container.innerHTML = html;
    document.body.appendChild(container); // append() is retyped by the Workers globals
    let root: ReturnType<typeof hydrateRoot> | undefined;
    try {
      act(() => {
        root = hydrateRoot(container, <TemplatePickerPage />, { onRecoverableError: mismatch });
      });

      expect(mismatch).not.toHaveBeenCalled();
      expect(errors).not.toHaveBeenCalled();
      expect(within(container).getByRole("button", { name: "Use Sponsor" })).toBeInTheDocument();
      expect(within(container).queryByText("Loading templates…")).not.toBeInTheDocument();
    } finally {
      act(() => root?.unmount());
      container.remove();
    }
  });

  it("shows the four templates in order, with credits on the photo templates", () => {
    render(<TemplatePickerPage />);

    expect(screen.getByRole("heading", { level: 1, name: "Start your WiFi login page" })).toBeInTheDocument();
    expect(cards().map((c) => within(c).getByRole("heading", { level: 2 }).textContent)).toEqual(
      TEMPLATES.map((t) => t.name),
    );
    expect(screen.getAllByRole("button").map((b) => b.textContent)).toEqual([
      "Use Sponsor",
      "Use Photo hero",
      "Use Minimal",
      "Start blank",
    ]);
    expect(within(cardNamed("Minimal")).getByRole("link", { name: "Woliul Hasan" })).toBeInTheDocument();
    expect(within(cardNamed("Blank")).queryByRole("link")).not.toBeInTheDocument();
    // Only Blank gets the canvas's outline button.
    expect(within(cardNamed("Blank")).getByRole("button")).toHaveClass("bg-white");
    expect(within(cardNamed("Minimal")).getByRole("button")).toHaveClass("bg-zinc-900");
  });

  it.each(TEMPLATES.map((t) => [t.name, t] as const))(
    "with no saved design, Use %s loads it without asking and opens the editor",
    async (_name, template) => {
      const confirm = vi.spyOn(window, "confirm");
      render(<TemplatePickerPage />);

      expect(screen.queryByRole("heading", { name: "Continue your design" })).not.toBeInTheDocument();
      const label = template.id === BLANK.id ? "Start blank" : `Use ${template.name}`;
      await userEvent.setup().click(screen.getByRole("button", { name: label }));

      expect(confirm).not.toHaveBeenCalled();
      expect(useStore.getState().design).toEqual(template.design);
      expect(push).toHaveBeenCalledExactlyOnceWith("/editor");
    },
  );

  it("with a saved design, shows Continue your design first and opens it unchanged", async () => {
    save("Harbourside Summit");
    render(<TemplatePickerPage />);

    const first = cards()[0];
    expect(within(first).getByRole("heading", { name: "Continue your design" })).toBeInTheDocument();
    expect(within(first).getByText("Harbourside Summit")).toBeInTheDocument();
    // Its thumbnail renders the saved design, uploaded logo included.
    expect(first.querySelector(`img[src="${UPLOADED_LOGO}"]`)).not.toBeNull();

    const saved = useStore.getState().design;
    await userEvent.setup().click(within(first).getByRole("button", { name: "Continue" }));
    expect(push).toHaveBeenCalledExactlyOnceWith("/editor");
    expect(useStore.getState().design).toBe(saved);
  });

  it("names an unnamed saved design", () => {
    save("");
    render(<TemplatePickerPage />);
    expect(within(cards()[0]).getByText("Untitled design")).toBeInTheDocument();
  });

  it("with a saved design, asks before switching and does nothing when cancelled", async () => {
    save("Harbourside Summit");
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    render(<TemplatePickerPage />);
    const saved = useStore.getState().design;

    await userEvent.setup().click(screen.getByRole("button", { name: "Use Minimal" }));

    expect(confirm).toHaveBeenCalledExactlyOnceWith(
      "Switch to Minimal? Your text and uploaded images are kept; colours and layout change.",
    );
    expect(useStore.getState().design).toBe(saved);
    expect(push).not.toHaveBeenCalled();
  });

  it("with a saved design, switches on confirm and keeps the uploaded logo", async () => {
    save("Harbourside Summit");
    vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<TemplatePickerPage />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Use Photo hero" }));

    const { design } = useStore.getState();
    expect(design.form).toEqual(PHOTO_HERO.design.form);
    expect(design.blocks[0]).toMatchObject({ kind: "image", src: UPLOADED_LOGO });
    expect(push).toHaveBeenCalledExactlyOnceWith("/editor");
  });

  it("treats a design edited in this session as saved, without a reload", async () => {
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    const { unmount } = render(<TemplatePickerPage />);
    expect(screen.queryByRole("heading", { name: "Continue your design" })).not.toBeInTheDocument();
    unmount();

    // As the editor would: pick a template, then edit it.
    act(() => {
      useStore.getState().loadTemplate(SPONSOR);
      useStore.getState().setName("Harbourside Summit");
    });
    render(<TemplatePickerPage />);

    expect(within(cards()[0]).getByRole("heading", { name: "Continue your design" })).toBeInTheDocument();
    expect(within(cards()[0]).getByText("Harbourside Summit")).toBeInTheDocument();
    await userEvent.setup().click(screen.getByRole("button", { name: "Use Minimal" }));
    expect(confirm).toHaveBeenCalledOnce();
    expect(push).not.toHaveBeenCalled();
  });
});
