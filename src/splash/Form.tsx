import type { CSSProperties, FormEvent, JSX, MouseEvent } from "react";
import { FIELD_SPEC, type Design } from "../lib/design-schema";
import type { RenderMode, Screen, Selection } from "../lib/types";

export type FormProps = {
  design: Design;
  mode: RenderMode;
  screen: Screen; // "error" is drawn by T-022
  onSelect?: (s: Selection) => void;
  onScreenChange?: (s: Screen) => void;
};

// The only two form actions an export can carry. Never built from design data: guest details go
// to the portal service first; only a click-through form posts straight to the router.
const PORTAL_SUBMIT_URL = "[PORTAL_SUBMIT_URL]";
const ROUTER_FORM_ACTION = "[ROUTER_FORM_ACTION]";

const FORM: CSSProperties = {
  width: "100%",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 12,
  margin: 0,
};

const FIELDS: CSSProperties = { width: "100%", display: "flex", flexDirection: "column", gap: 10 };

const TERMS_ROW: CSSProperties = {
  boxSizing: "border-box",
  width: "100%",
  minHeight: 44,
  display: "flex",
  alignItems: "center",
  gap: 10,
  fontSize: 14,
  textAlign: "left",
  cursor: "pointer",
};

// Vertical padding grows the inline link's tap area to the 44px row without changing the layout
// (T-007-terms-link-tap-padding).
const TERMS_LINK: CSSProperties = {
  color: "inherit",
  font: "inherit",
  fontWeight: 600,
  textDecoration: "underline",
  background: "none",
  border: 0,
  padding: "14px 0",
  cursor: "pointer",
};

const BUTTON_BASE: CSSProperties = {
  width: "66%",
  minHeight: 50,
  borderRadius: 10,
  font: "inherit",
  fontSize: 16,
  fontWeight: 700,
  letterSpacing: "0.06em",
  cursor: "pointer",
};

/** Connect's look, shared with the Terms sheet's CLOSE and the Connected screen's CONTINUE. */
export const connectButtonStyle = (button: Design["form"]["button"]): CSSProperties => ({
  ...BUTTON_BASE,
  color: button.fg,
  ...(button.variant === "outline"
    ? { background: "transparent", border: `2px solid ${button.bg}` }
    : { background: button.bg, border: 0 }),
});

const preventSubmit = (e: FormEvent) => e.preventDefault();

export function Form({ design, mode, onSelect, onScreenChange }: FormProps): JSX.Element {
  const { fields, inputBg, inputText, terms, button } = design.form;
  const exporting = mode === "export";
  const edit = mode === "edit";

  const inputStyle: CSSProperties = {
    boxSizing: "border-box",
    width: "100%",
    height: 48,
    padding: "0 14px",
    border: 0,
    borderRadius: 10,
    background: inputBg,
    color: inputText,
    font: "inherit",
    fontSize: 16,
  };

  // Edit mode: a click anywhere in the terms row, the link included, selects Terms once. The
  // default is cancelled so the label doesn't also toggle the box (and re-dispatch a click). A
  // click on the checkbox itself only toggles it, so a test value can be ticked.
  const selectTerms = (e: MouseEvent<HTMLLabelElement>) => {
    if (e.target === e.currentTarget.control) return;
    e.preventDefault();
    onSelect?.({ kind: "terms" });
  };

  // The form's own empty area (beside Connect, between rows) is page background
  // (T-005-background-select-on-own-target).
  const selectBackground = (e: MouseEvent<HTMLFormElement>) => {
    if (e.target === e.currentTarget) onSelect?.({ kind: "background" });
  };

  const termsLink = exporting ? (
    <a href="#terms" style={TERMS_LINK}>
      {terms.linkText}
    </a>
  ) : (
    <button
      type="button"
      onClick={edit ? undefined : () => onScreenChange?.("terms")}
      style={TERMS_LINK}
    >
      {terms.linkText}
    </button>
  );

  return (
    <form
      {...(exporting
        ? { method: "post", action: fields.length > 0 ? PORTAL_SUBMIT_URL : ROUTER_FORM_ACTION }
        : { onSubmit: preventSubmit, onClick: edit ? selectBackground : undefined })}
      style={FORM}
    >
      {exporting && fields.length === 0 && <input type="hidden" name="command" value="login" />}
      {fields.length > 0 && (
        <div
          onClick={edit ? () => onSelect?.({ kind: "fields" }) : undefined}
          style={edit ? { ...FIELDS, cursor: "pointer" } : FIELDS}
        >
          {fields.map((kind) => {
            const spec = FIELD_SPEC[kind];
            return (
              <input
                key={kind}
                name={kind}
                type={spec.type}
                autoComplete={spec.autoComplete}
                inputMode={spec.inputMode}
                placeholder={spec.placeholder}
                aria-label={spec.placeholder}
                required={exporting}
                style={inputStyle}
              />
            );
          })}
        </div>
      )}
      {terms.mode === "checkbox" && (
        <label
          onClick={edit ? selectTerms : undefined}
          style={{ ...TERMS_ROW, color: terms.textColour }}
        >
          <input
            type="checkbox"
            name="accept_terms"
            value={terms.version}
            required={exporting}
            style={{ width: 20, height: 20, margin: 0, flexShrink: 0, accentColor: button.bg }}
          />
          <span>
            {terms.label} {termsLink}
          </span>
        </label>
      )}
      <button
        type={exporting ? "submit" : "button"}
        onClick={edit ? () => onSelect?.({ kind: "button" }) : undefined}
        style={connectButtonStyle(button)}
      >
        {button.label}
      </button>
    </form>
  );
}
