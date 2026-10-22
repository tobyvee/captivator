"use client";

import Link from "next/link";
import { Monitor, Smartphone, Wifi } from "lucide-react";
import { useStore } from "@/lib/store";
import type { Device } from "@/lib/types";
import { Segmented, type SegmentedOption } from "./controls/Segmented";
import { ExportButton } from "./ExportButton";
import { UndoRedo } from "./UndoRedo";

const DEVICES: SegmentedOption<Device>[] = [
  { value: "mobile", label: "Mobile", icon: <Smartphone size={16} aria-hidden="true" /> },
  { value: "desktop", label: "Desktop", icon: <Monitor size={16} aria-hidden="true" /> },
];

export function TopBar() {
  const name = useStore((s) => s.name);
  const setName = useStore((s) => s.setName);
  const device = useStore((s) => s.device);
  const setDevice = useStore((s) => s.setDevice);

  return (
    <header className="flex flex-wrap items-center gap-4 border-b border-zinc-200 bg-white px-5 py-2.5">
      <div className="flex min-w-0 items-center gap-2.5">
        <Wifi size={22} strokeWidth={2} aria-hidden="true" className="shrink-0" />
        <h1 className="text-[15px] font-bold">Captivator</h1>
        <span aria-hidden="true" className="text-zinc-500">
          /
        </span>
        <input
          type="text"
          aria-label="Design name"
          placeholder="Design name"
          maxLength={60}
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-h-11 w-[250px] min-w-0 rounded-md border border-zinc-200 bg-white px-2 text-sm font-medium text-zinc-900 placeholder:text-zinc-500 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600"
        />
      </div>

      <div className="mx-auto">
        <Segmented label="Preview device" options={DEVICES} value={device} onChange={setDevice} />
      </div>

      <div className="flex items-center gap-2">
        <UndoRedo />
        <Link
          href="/"
          className="flex min-h-11 items-center rounded-lg border border-zinc-200 bg-white px-3.5 text-[13px] font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        >
          Templates
        </Link>
        <ExportButton />
      </div>
    </header>
  );
}
