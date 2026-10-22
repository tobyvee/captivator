export type FocusPoint = { x: number; y: number };

type Props = {
  /** The focus point in percent, 0–100 on each axis. */
  value: FocusPoint;
  onChange: (value: FocusPoint) => void;
  /** The photo drawn behind the grid, so each square shows the part of the photo it picks. */
  src?: string;
  /** The id of the help text that describes the grid. */
  describedBy?: string;
};

const STOPS = [0, 50, 100] as const;
const ROWS = ["top", "middle", "bottom"] as const;
const COLUMNS = ["left", "centre", "right"] as const;

// "Focus top left" … "Focus bottom right"; the middle square is "Focus centre", not "middle centre".
function presetLabel(row: number, column: number): string {
  if (row === 1 && column === 1) return "Focus centre";
  return `Focus ${ROWS[row]} ${COLUMNS[column]}`;
}

/** The preset (0, 50 or 100) nearest a focus coordinate. */
const nearest = (v: number) => Math.min(100, Math.max(0, Math.round(v / 50) * 50));

/**
 * A 3×3 grid of presets over the photo. Each square sets the focus to 0, 50 or 100% on each axis,
 * and the square nearest the current focus is pressed. T-033 adds a drag dot on top.
 */
export function FocusGrid({ value, onChange, src, describedBy }: Props) {
  const pressedX = nearest(value.x);
  const pressedY = nearest(value.y);

  return (
    <div className="relative h-[150px] overflow-hidden rounded-lg bg-[#0B1F2E]">
      {/* The same photo as the preview, so screen readers skip it. */}
      {src && <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover" />}
      <div
        role="group"
        aria-label="Focus point"
        aria-describedby={describedBy}
        className="absolute inset-0 grid grid-cols-3 grid-rows-3"
      >
        {STOPS.map((y, row) =>
          STOPS.map((x, column) => {
            const pressed = x === pressedX && y === pressedY;
            return (
              <button
                key={`${x}-${y}`}
                type="button"
                aria-label={presetLabel(row, column)}
                aria-pressed={pressed}
                onClick={() => onChange({ x, y })}
                className={[
                  "flex min-h-11 items-center justify-center border-white/35 bg-transparent hover:bg-white/15",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-white",
                  column < 2 ? "border-r" : "",
                  row < 2 ? "border-b" : "",
                ].join(" ")}
              >
                {pressed && (
                  <span
                    aria-hidden="true"
                    className="size-[18px] rounded-full border-2 border-white bg-[#2563EB] shadow-[0_0_0_3px_rgba(37,99,235,0.35)]"
                  />
                )}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
