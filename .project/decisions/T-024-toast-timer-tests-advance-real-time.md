---
title: "The Export toast's timer tests keep shouldAdvanceTime fake timers, with a 2-second margin"
type: decision
project: captivator
ticket: T-024
decided_by: nextjs-specialist
supersedes:
updated: 2026-10-23
tags: [project, captivator, decision, editor, export, tests]
---
# The Export toast's timer tests keep shouldAdvanceTime fake timers, with a 2-second margin

## Context
The code review flagged that the auto-hide test checked the toast was still up only 100ms before `TOAST_MS` under `vi.useFakeTimers({ shouldAdvanceTime: true })`, where the fake clock also follows real time, so a slow CI run could hide the toast early. It suggested plain `vi.useFakeTimers()` with `userEvent.setup({ advanceTimers: vi.advanceTimersByTime })`. That stalls: `@testing-library/react`'s `asyncWrapper` (which `userEvent` runs through) awaits a real `setTimeout(0)` and only advances it when it detects Jest's fake timers, not Vitest's.

## Decision
Both timer tests keep `shouldAdvanceTime: true` (a shared `FAKE_TIMERS` constant) with `advanceTimers: vi.advanceTimersByTime`, and the auto-hide test checks the toast is still up at `TOAST_MS - 2000` before advancing the last 2000ms. Real time can only make the toast hide earlier, so only the "still up" check needs the margin. The auto-hide test also resolves the build inside `act`: a first run of the full suite showed that resolving it outside `act` can leave the effect that starts the hide timer unflushed until after the clock has been advanced, so the toast never hid.

## Alternatives
- **Plain fake timers:** stall, as above.
- **Define a global `jest` shim so RTL advances Vitest's clock:** a test-wide hack to save a margin.
- **`fireEvent` instead of `userEvent` in timer tests:** the suite's convention is `userEvent.setup()`.

## Consequences
The test pins "not before 4 seconds, gone by 6", not the exact 6000ms; `TOAST_MS` is the source of the exact figure.
