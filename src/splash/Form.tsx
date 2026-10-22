import {
  Fragment,
  useState,
  type CSSProperties,
  type FormEvent,
  type JSX,
  type MouseEvent,
  type ReactNode,
} from "react";
import {
  backgroundColours,
  bestErrorColour,
  readableTextColour,
  worstRatio,
} from "../lib/contrast";
import { FIELD_SPEC, type Design } from "../lib/design-schema";
import type { BackgroundSpec, FieldKindSpec, RenderMode, Screen, Selection } from "../lib/types";
import { TERMS_LINK_ID } from "./TermsSheet";
import { ERROR_COPY, EXAMPLE_INVALID, validateGuest, type GuestCheck } from "./validate";

export type FormProps = {
  design: Design;
  mode: RenderMode;
  screen: Screen;
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

// One Error screen on show at a time, like the terms sheet's title id.
const errorId = (part: FieldKindSpec | "terms") => `cv-${part}-error`;

const ERROR_TEXT: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  fontSize: 14,
  fontWeight: 500,
  textAlign: "left",
};

type ErrorColours = { mark: string; text: string };

// The red marks the error (border, outline, icon). Its text must still reach 4.5:1, and on
// mid-tones neither red does, so there the text takes the page's readable colour
// (T-022-error-text-contrast-floor).
function errorColours(bg: BackgroundSpec): ErrorColours {
  const page = backgroundColours(bg);
  const mark = bestErrorColour(page);
  return { mark, text: worstRatio(mark, page) >= 4.5 ? mark : readableTextColour(page) };
}

function ErrorMessage(props: {
  part: FieldKindSpec | "terms";
  colours: ErrorColours;
  alert: boolean;
}): JSX.Element {
  return (
    <span
      id={errorId(props.part)}
      role={props.alert ? "alert" : undefined}
      style={{ ...ERROR_TEXT, color: props.colours.text }}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke={props.colours.mark}
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v4M12 16h.01" />
      </svg>
      {ERROR_COPY[props.part]}
    </span>
  );
}

export function Form({ design, mode, screen, onSelect, onScreenChange }: FormProps): JSX.Element {
  const { fields, inputBg, inputText, terms, button } = design.form;
  const exporting = mode === "export";
  const edit = mode === "edit";
  const termsOn = terms.mode === "checkbox";

  // What the last failed edit-mode Connect found, shown while the Error screen is up
  // (T-022-error-screen-shows-real-failure), and whether it was pressed on the example screen.
  // Dropped during render once the screen moves on.
  const [failure, setFailure] = useState<{ check: GuestCheck; example: boolean } | null>(null);
  if (failure && screen !== "error") setFailure(null);

  // A failure stops applying once the form can no longer show it (its field removed, or terms
  // turned off), so the Error screen never ends up with nothing flagged.
  const live =
    failure &&
    ((failure.check.field !== undefined && fields.includes(failure.check.field)) ||
      (failure.check.terms === true && termsOn))
      ? failure
      : null;

  // The Error screen never reaches the export. Opened from the switcher, it shows the spec's
  // example: the first field with an invalid value and, with terms on, the checkbox.
  const errorScreen = screen === "error" && !exporting;
  const errors: GuestCheck | null = errorScreen
    ? (live?.check ?? { ok: false, field: fields[0], terms: termsOn })
    : null;
  // The example's invalid value stays in the first field, also after Connect is pressed on it.
  // A real failure keeps what was typed.
  const example = errorScreen && (live === null || live.example);
  const colours = errors ? errorColours(design.background) : null;
  // Only the first message shown is announced (field before terms), so one failure is read once
  // (T-022-alert-on-first-error-only).
  const fieldFlagged = errors?.field !== undefined && fields.includes(errors.field);

  // In edit and preview, each field and the terms row sit in a wrapper with room for a message,
  // so showing an error never remounts an input and loses what was typed in it. The export
  // markup has no wrapper.
  const slot = (key: string, gap: number, control: ReactNode, message: ReactNode) =>
    exporting ? (
      <Fragment key={key}>{control}</Fragment>
    ) : (
      <div key={key} style={{ width: "100%", display: "flex", flexDirection: "column", gap }}>
        {control}
        {message}
      </div>
    );

  // Edit-mode Connect selects the button, then checks the preview's own inputs and shows the
  // screen a guest would get (T-022-edit-connect-selects-then-validates).
  const connect = (e: MouseEvent<HTMLButtonElement>) => {
    onSelect?.({ kind: "button" });
    const data = new FormData(e.currentTarget.form ?? undefined);
    const values: Partial<Record<FieldKindSpec, string>> = {};
    for (const kind of fields) values[kind] = String(data.get(kind) ?? "");
    const result = validateGuest(fields, values, termsOn, data.has("accept_terms"));
    setFailure(result.ok ? null : { check: result, example });
    onScreenChange?.(result.ok ? "connected" : "error");
  };

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

  // The export's link carries the id the terms sheet's close links return to
  // (T-021-close-to-terms-link).
  const termsLink = exporting ? (
    <a id={TERMS_LINK_ID} href="#terms" style={TERMS_LINK}>
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
            const invalid = errors?.field === kind;
            return slot(
              kind,
              6,
              <input
                name={kind}
                type={spec.type}
                autoComplete={spec.autoComplete}
                inputMode={spec.inputMode}
                placeholder={spec.placeholder}
                aria-label={spec.placeholder}
                required={exporting}
                defaultValue={example && kind === fields[0] ? EXAMPLE_INVALID[kind] : undefined}
                {...(invalid ? { "aria-invalid": true, "aria-describedby": errorId(kind) } : null)}
                style={
                  invalid && colours
                    ? { ...inputStyle, padding: "0 12px", border: `2px solid ${colours.mark}` }
                    : inputStyle
                }
              />,
              invalid && colours && <ErrorMessage part={kind} colours={colours} alert />,
            );
          })}
        </div>
      )}
      {termsOn &&
        slot(
          "terms",
          2,
          <label
            onClick={edit ? selectTerms : undefined}
            style={{ ...TERMS_ROW, color: terms.textColour }}
          >
            <input
              type="checkbox"
              name="accept_terms"
              value={terms.version}
              required={exporting}
              {...(errors?.terms
                ? { "aria-invalid": true, "aria-describedby": errorId("terms") }
                : null)}
              style={{
                width: 20,
                height: 20,
                margin: 0,
                flexShrink: 0,
                accentColor: button.bg,
                ...(errors?.terms && colours
                  ? { outline: `2px solid ${colours.mark}`, outlineOffset: 2 }
                  : null),
              }}
            />
            <span>
              {terms.label} {termsLink}
            </span>
          </label>,
          errors?.terms && colours && (
            <ErrorMessage part="terms" colours={colours} alert={!fieldFlagged} />
          ),
        )}
      <button
        type={exporting ? "submit" : "button"}
        onClick={edit ? connect : undefined}
        style={connectButtonStyle(button)}
      >
        {button.label}
      </button>
    </form>
  );
}
