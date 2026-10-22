import { useId } from "react";

type Props = {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Appended to the shown value, e.g. " px". Ignored when `format` is given. */
  unit?: string;
  format?: (value: number) => string;
  onChange: (value: number) => void;
};

/** A labelled range input that shows its current value, as on the canvas's Size slider. */
export function Slider({ label, value, min, max, step = 1, unit = "", format, onChange }: Props) {
  const id = useId();
  const shown = format?.(value) ?? `${value}${unit}`;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <label htmlFor={id} className="text-[13px] font-semibold text-zinc-900">
          {label}
        </label>
        <span aria-hidden="true" className="text-[13px] text-zinc-700 tabular-nums">
          {shown}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={shown}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
        className="min-h-11 w-full cursor-pointer accent-[#2563EB] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]"
      />
    </div>
  );
}
