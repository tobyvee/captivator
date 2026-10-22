import { useEffect } from "react";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { Design, type Template } from "./design-schema";
import { createDebouncedStorage } from "./persist-storage";
import { SPONSOR, TEMPLATES } from "./templates";
import type {
  BackgroundSpec,
  Device,
  FormSpec,
  ImageBlockSpec,
  Screen,
  Selection,
  TextBlockSpec,
} from "./types";

export const STORAGE_KEY = "captivator:v2";
const STORAGE_VERSION = 2; // moves with Design.version (general-persistence-versioning-and-flush)
const MAX_NAME = 60;

export type NewBlock = Omit<TextBlockSpec, "id"> | Omit<ImageBlockSpec, "id">;
export type BlockPatch =
  | Partial<Omit<TextBlockSpec, "id" | "kind">>
  | Partial<Omit<ImageBlockSpec, "id" | "kind">>;
export type FormPatch = Partial<Omit<FormSpec, "terms" | "button">> & {
  terms?: Partial<FormSpec["terms"]>; // merged one level deep
  button?: Partial<FormSpec["button"]>; // merged one level deep
};

export type EditorState = {
  design: Design; // persisted (+ undo in T-025)
  name: string; // persisted, max 60
  selection: Selection;
  device: Device;
  screen: Screen;
  logoPalette: string[]; // suggestions only, never in Design
  hasHydrated: boolean;
  restored: boolean; // a saved design was restored
  restoreFailed: boolean; // "Couldn't restore your saved design"
  saveFailed: boolean; // "Couldn't save locally"

  loadTemplate(template: Template): void;
  updateBackground(background: BackgroundSpec): boolean;
  addBlock(block: NewBlock): string | null;
  updateBlock(id: string, patch: BlockPatch): boolean;
  removeBlock(id: string): void;
  moveBlock(id: string, dir: -1 | 1): void;
  updateForm(patch: FormPatch): boolean;
  setName(name: string): void;
  setSelection(selection: Selection): void;
  setDevice(device: Device): void;
  setScreen(screen: Screen): void;
  setLogoPalette(colours: string[]): void;
  dismissRestoreFailed(): void;
};

type Persisted = Pick<EditorState, "design" | "name">;

const defaultPersisted = (): Persisted => ({ design: SPONSOR.design, name: "" });

// Selecting Terms shows the Terms sheet; selecting anything else leaves it
// (T-004-terms-selection-switches-screen).
function screenFor(selection: Selection, design: Design, screen: Screen): Screen {
  if (selection.kind === "terms") {
    return design.form.terms.mode === "checkbox" ? "terms" : screen;
  }
  return screen === "terms" ? "landing" : screen;
}

// Carries the customer's own text and images into a new template by position, skipping any
// value that is one of the templates' defaults (T-004-template-switch-carry-rule).
function carryContent(current: Design, target: Template): Design {
  const defaults = new Set<string>();
  for (const { design } of [...TEMPLATES, target]) {
    if (design.background.type === "image") defaults.add(design.background.src);
    for (const b of design.blocks) defaults.add(b.kind === "text" ? b.text : b.src);
  }

  const texts = current.blocks.filter((b) => b.kind === "text");
  const images = current.blocks.filter((b) => b.kind === "image");
  let t = 0;
  let i = 0;
  const blocks = target.design.blocks.map((b) => {
    if (b.kind === "text") {
      const from = texts[t++];
      return from && !defaults.has(from.text) ? { ...b, text: from.text } : b;
    }
    const from = images[i++];
    return from && !defaults.has(from.src) ? { ...b, src: from.src, alt: from.alt } : b;
  });

  const cur = current.background;
  const next = target.design.background;
  const background =
    cur.type === "image" && next.type === "image" && !defaults.has(cur.src)
      ? { ...next, src: cur.src, credit: cur.credit }
      : next;

  return { ...target.design, background, blocks };
}

const debouncedStorage = createDebouncedStorage({
  // Only flip the flag when it changes: setting state schedules another write, and an
  // unconditional set after every failed write would retry forever.
  onError: () => {
    if (!useStore.getState().saveFailed) useStore.setState({ saveFailed: true });
  },
  onSuccess: () => {
    if (useStore.getState().saveFailed) useStore.setState({ saveFailed: false });
  },
});

export const useStore = create<EditorState>()(
  persist(
    (set, get) => {
      // Every design change goes through the schema: an update that would make the design
      // invalid is dropped, so a saved design always restores
      // (T-004-store-rejects-invalid-designs). The candidate is `unknown` because a patch
      // can mix kinds; the parse is what types it.
      const commit = (candidate: unknown, extra?: Partial<EditorState>): Design | null => {
        const parsed = Design.safeParse(candidate);
        if (!parsed.success) return null;
        set({ ...extra, design: parsed.data });
        return parsed.data;
      };

      return {
        ...defaultPersisted(),
        selection: { kind: "background" },
        device: "mobile",
        screen: "landing",
        logoPalette: [],
        hasHydrated: false,
        restored: false,
        restoreFailed: false,
        saveFailed: false,

        loadTemplate: (template) => {
          const extra = { selection: { kind: "background" }, screen: "landing" } as const;
          if (!commit(carryContent(get().design, template), extra)) {
            set({ ...extra, design: template.design });
          }
        },

        updateBackground: (background) => commit({ ...get().design, background }) !== null,

        addBlock: (block) => {
          const { design, screen } = get();
          const id = crypto.randomUUID();
          const selection: Selection = { kind: "block", id };
          const next = { ...design, blocks: [...design.blocks, { ...block, id }] };
          return commit(next, { selection, screen: screenFor(selection, design, screen) })
            ? id
            : null;
        },

        updateBlock: (id, patch) => {
          const { design } = get();
          if (!design.blocks.some((b) => b.id === id)) return false;
          const blocks = design.blocks.map((b) => (b.id === id ? { ...b, ...patch } : b));
          return commit({ ...design, blocks }) !== null;
        },

        removeBlock: (id) => {
          const { design, selection, screen } = get();
          if (!design.blocks.some((b) => b.id === id)) return;
          const blocks = design.blocks.filter((b) => b.id !== id);
          if (selection.kind === "block" && selection.id === id) {
            const background: Selection = { kind: "background" };
            commit(
              { ...design, blocks },
              { selection: background, screen: screenFor(background, design, screen) },
            );
          } else {
            commit({ ...design, blocks });
          }
        },

        moveBlock: (id, dir) => {
          const { design } = get();
          const from = design.blocks.findIndex((b) => b.id === id);
          const to = from + dir;
          if (from < 0 || to < 0 || to >= design.blocks.length) return;
          const blocks = [...design.blocks];
          [blocks[from], blocks[to]] = [blocks[to], blocks[from]];
          commit({ ...design, blocks });
        },

        updateForm: (patch) => {
          const { design, screen } = get();
          const form = {
            ...design.form,
            ...patch,
            terms: { ...design.form.terms, ...patch.terms },
            button: { ...design.form.button, ...patch.button },
          };
          const termsOff = form.terms.mode === "off";
          const nothingCanFail = termsOff && form.fields.length === 0;
          const nextScreen =
            (screen === "terms" && termsOff) || (screen === "error" && nothingCanFail)
              ? "landing"
              : screen;
          return commit({ ...design, form }, { screen: nextScreen }) !== null;
        },

        setName: (name) => set({ name: name.slice(0, MAX_NAME) }),

        setSelection: (selection) => {
          const { design, screen } = get();
          set({ selection, screen: screenFor(selection, design, screen) });
        },

        setDevice: (device) => set({ device }),
        setScreen: (screen) => set({ screen }),
        setLogoPalette: (logoPalette) => set({ logoPalette }),
        dismissRestoreFailed: () => set({ restoreFailed: false }),
      };
    },
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => debouncedStorage),
      partialize: (s): Persisted => ({ design: s.design, name: s.name }),
      // Only called when the stored version differs. There is no older format to upgrade.
      migrate: () => defaultPersisted(),
      // localStorage can be hand-edited, so the stored design must pass the schema to be used.
      merge: (persisted, current) => {
        if (typeof persisted !== "object" || persisted === null) return current;
        const stored: { design?: unknown; name?: unknown } = persisted;
        const name =
          typeof stored.name === "string" && stored.name.length <= MAX_NAME
            ? stored.name
            : current.name;
        const parsed = Design.safeParse(stored.design);
        return parsed.success
          ? { ...current, design: parsed.data, name, restored: true }
          : { ...current, name, restoreFailed: true };
      },
      skipHydration: true,
      // Corrupt JSON throws in getItem and arrives here as `error`, with the default kept.
      onRehydrateStorage: () => (_state, error) => {
        useStore.setState(error ? { hasHydrated: true, restoreFailed: true } : { hasHydrated: true });
      },
    },
  ),
);

/** Restores the saved design once, after mount, and reports when that has happened. */
export function useHydrated(): boolean {
  const hasHydrated = useStore((s) => s.hasHydrated);
  useEffect(() => {
    if (!useStore.getState().hasHydrated) void useStore.persist.rehydrate();
  }, []);
  return hasHydrated;
}
