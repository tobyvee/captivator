import type { ReactNode } from "react";

export type SegmentedOption<T extends string> = { value: T; label: string; icon?: ReactNode };

type Props<T extends string> = {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Shows only each option's icon; the label becomes its accessible name and tooltip. */
  iconOnly?: boolean;
};

/** A row of toggle buttons where exactly one is pressed. Fills its container's width when it can. */
export function Segmented<T extends string>({ label, options, value, onChange, iconOnly }: Props<T>) {
  return (
    <div role="group" aria-label={label} className="flex gap-0.5 rounded-lg bg-zinc-200 p-[3px]">
      {options.map((option) => {
        const pressed = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={pressed}
            aria-label={iconOnly ? option.label : undefined}
            title={iconOnly ? option.label : undefined}
            onClick={() => onChange(option.value)}
            className={[
              "flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-md px-3.5 text-[13px]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600",
              pressed
                ? "bg-white font-semibold text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.12)]"
                : "font-medium text-zinc-600 hover:text-zinc-900",
            ].join(" ")}
          >
            {option.icon}
            {!iconOnly && option.label}
          </button>
        );
      })}
    </div>
  );
}
