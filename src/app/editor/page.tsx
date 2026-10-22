"use client";

import type { ReactNode } from "react";
import { BlockList } from "@/editor/BlockList";
import { Inspector } from "@/editor/Inspector";
import { PreviewStage } from "@/editor/PreviewStage";
import { TopBar } from "@/editor/TopBar";
import { useHydrated } from "@/lib/store";

// The page owns the three columns' sizes and surfaces, so the skeleton and the editor share
// one layout and each column's component only fills its slot (T-008-page-owns-column-layout).
// Below md every column takes the full width, so the stack reads as one column.
const SIDE = "flex flex-col bg-white border-zinc-200 max-md:max-w-none max-md:border-b";
const BLOCKS_COLUMN = `${SIDE} flex-[1_1_272px] max-w-[300px] md:border-r`;
const STAGE_COLUMN = "flex flex-col flex-[1_1_480px] min-w-0";
const INSPECTOR_COLUMN = `${SIDE} flex-[1_1_300px] max-w-[340px] md:border-l`;

type Slots = Record<"top" | "blocks" | "stage" | "inspector", ReactNode>;

function Layout({ top, blocks, stage, inspector }: Slots) {
  return (
    <div className="flex min-h-screen flex-col">
      {top}
      <main className="flex grow flex-wrap items-stretch">
        <div className={BLOCKS_COLUMN}>{blocks}</div>
        <div className={STAGE_COLUMN}>{stage}</div>
        <div className={INSPECTOR_COLUMN}>{inspector}</div>
      </main>
    </div>
  );
}

function Bar({ className }: { className: string }) {
  return <div className={`rounded-md bg-zinc-200 ${className}`} />;
}

// Neutral grey blocks in the editor's layout. The server render and the first client render
// both show this (the store hasn't read localStorage yet), so hydration matches and the
// template never flashes before a saved design.
function Skeleton() {
  return (
    <div aria-busy="true" className="motion-safe:animate-pulse">
      <p role="status" className="sr-only">
        Loading your design…
      </p>
      <Layout
        top={
          <div className="flex items-center gap-4 border-b border-zinc-200 bg-white px-5 py-2.5">
            <Bar className="h-11 w-72 max-w-full" />
            <Bar className="mx-auto h-11 w-48 max-md:hidden" />
            <Bar className="h-11 w-40 max-md:hidden" />
          </div>
        }
        blocks={
          <div className="flex flex-col gap-1.5 p-4">
            <Bar className="h-12" />
            <Bar className="h-12" />
            <Bar className="h-12" />
            <Bar className="h-12" />
          </div>
        }
        stage={<Bar className="mx-auto my-5 h-[560px] w-[300px] max-w-[calc(100%-2rem)] rounded-[40px]" />}
        inspector={
          <div className="flex flex-col gap-[18px] px-[18px] py-4">
            <Bar className="h-10 w-1/2" />
            <Bar className="h-24" />
            <Bar className="h-24" />
          </div>
        }
      />
    </div>
  );
}

export default function EditorPage() {
  // Restores the saved design after mount (T-008-hydration-guard-in-step-2).
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton />;
  return <Layout top={<TopBar />} blocks={<BlockList />} stage={<PreviewStage />} inspector={<Inspector />} />;
}
