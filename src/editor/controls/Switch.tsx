type Props = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
};

/** An on/off switch: drawn 44×26, inside a 44px-tall hit area. */
export function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
    >
      <span
        aria-hidden="true"
        className={[
          "relative h-[26px] w-11 rounded-full transition-colors",
          checked ? "bg-blue-600" : "bg-zinc-500",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-[3px] size-5 rounded-full bg-white shadow-sm transition-[left]",
            checked ? "left-[21px]" : "left-[3px]",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
