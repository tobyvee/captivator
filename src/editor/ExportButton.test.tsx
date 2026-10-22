// @vitest-environment jsdom
import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildExportHtml, downloadHtml, ExportError, MSG_IMAGE_FAILED, type ExportResult } from "@/lib/export";
import { useStore } from "@/lib/store";
import { ExportButton, TOAST_MS } from "./ExportButton";

// jsdom can't render the export (canvas, fetch) or download a blob, so both are mocked; the rest
// of the module (ExportError, exportFileName, PAGE_BUDGET) is real.
vi.mock("@/lib/export", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/export")>()),
  buildExportHtml: vi.fn(),
  downloadHtml: vi.fn(),
}));

const build = vi.mocked(buildExportHtml);
const download = vi.mocked(downloadHtml);

const result = (over: Partial<ExportResult> = {}): ExportResult => ({
  html: "<!doctype html><title>x</title>",
  bytes: 42 * 1024,
  overBudget: false,
  reencoded: false,
  ...over,
});

beforeEach(() => {
  localStorage.clear();
  useStore.setState(useStore.getInitialState(), true);
  useStore.persist.clearStorage();
  build.mockReset();
  download.mockReset();
  act(() => useStore.getState().setName("Harbourside Summit"));
});

afterEach(() => {
  vi.useRealTimers();
});

const button = () => screen.getByRole("button", { name: /Export HTML|Exporting…/ });
const status = () => screen.getByRole("status");

describe("ExportButton", () => {
  it("is a real primary button, enabled, with a 44px tap target", () => {
    render(<ExportButton />);
    expect(button().tagName).toBe("BUTTON");
    expect(button()).toHaveAttribute("type", "button");
    expect(button()).toBeEnabled();
    expect(button()).toHaveClass("min-h-11");
    expect(status()).toBeEmptyDOMElement();
  });

  it("is busy and disabled while exporting, then downloads and reports the size", async () => {
    let resolve!: (r: ExportResult) => void;
    build.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(button());
    expect(button()).toHaveTextContent("Exporting…");
    expect(button()).toBeDisabled();
    const { design, name } = useStore.getState();
    expect(build).toHaveBeenCalledWith(design, name);
    expect(download).not.toHaveBeenCalled();

    await act(async () => resolve(result()));
    expect(download).toHaveBeenCalledWith("<!doctype html><title>x</title>", "Harbourside Summit");
    expect(status()).toHaveTextContent("Downloaded harbourside-summit.html: 42 KB of 100 KB");
    expect(status()).not.toHaveTextContent("Photo shrunk");
    expect(button()).toHaveTextContent("Export HTML");
    expect(button()).toBeEnabled();
  });

  it("exports the design and name as they are at the click, not at render", async () => {
    build.mockResolvedValue(result());
    const user = userEvent.setup();
    render(<ExportButton />);

    act(() => {
      useStore.getState().setName("Café / WiFi!");
      useStore.getState().updateBackground({ type: "colour", colour: "#123456" });
    });
    await user.click(button());

    expect(build.mock.calls[0][0].background).toEqual({ type: "colour", colour: "#123456" });
    expect(build).toHaveBeenCalledWith(useStore.getState().design, "Café / WiFi!");
    expect(download).toHaveBeenCalledWith(expect.any(String), "Café / WiFi!");
    expect(status()).toHaveTextContent("Downloaded cafe-wifi.html");
  });

  it("notes when the photo was shrunk to fit", async () => {
    build.mockResolvedValue(result({ bytes: 98 * 1024, reencoded: true }));
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(button());
    expect(status()).toHaveTextContent("Downloaded harbourside-summit.html: 98 KB of 100 KB. Photo shrunk to fit.");
  });

  it("hides a within-budget toast after about 6 seconds", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    build.mockResolvedValue(result());
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ExportButton />);

    await user.click(button());
    expect(status()).toHaveTextContent("Downloaded");
    act(() => vi.advanceTimersByTime(TOAST_MS - 100));
    expect(status()).toHaveTextContent("Downloaded");
    act(() => vi.advanceTimersByTime(200));
    expect(status()).toBeEmptyDOMElement();
  });

  it("still downloads over budget, and warns until dismissed", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    build.mockResolvedValue(result({ bytes: 131 * 1024, overBudget: true, reencoded: true }));
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime.bind(vi) });
    render(<ExportButton />);

    await user.click(button());
    expect(download).toHaveBeenCalledTimes(1);
    const warning =
      "Downloaded harbourside-summit.html: 131 KB, over the 100 KB budget. Guests on slow WiFi may wait; try a simpler photo.";
    expect(status()).toHaveTextContent(warning);

    act(() => vi.advanceTimersByTime(TOAST_MS * 3));
    expect(status()).toHaveTextContent(warning);

    await user.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(status()).toBeEmptyDOMElement();
  });

  it("reports an image failure, downloads nothing and never stays busy", async () => {
    build.mockRejectedValue(new ExportError(MSG_IMAGE_FAILED));
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(button());
    expect(download).not.toHaveBeenCalled();
    expect(status()).toHaveTextContent(
      "Export failed: we couldn't load one of the images. Try again, or replace it.",
    );
    expect(button()).toHaveTextContent("Export HTML");
    expect(button()).toBeEnabled();

    // A retry clears the failure and can succeed.
    build.mockResolvedValue(result());
    await user.click(button());
    expect(status()).not.toHaveTextContent("Export failed");
    expect(status()).toHaveTextContent("Downloaded harbourside-summit.html");
  });

  it("shows an ExportError's message as text, never as markup", async () => {
    build.mockRejectedValue(new ExportError('<img src="x" onerror="alert(1)">'));
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(button());
    expect(status()).toHaveTextContent('Export failed: <img src="x" onerror="alert(1)">');
    expect(status().querySelector("img")).toBeNull();
  });

  it("gives a generic failure for an unexpected error, including a failed download", async () => {
    build.mockResolvedValue(result());
    download.mockImplementation(() => {
      throw new Error("createObjectURL is not a function");
    });
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(button());
    expect(status()).toHaveTextContent("Export failed: something went wrong. Try again.");
    expect(status()).not.toHaveTextContent("createObjectURL");
    expect(button()).toBeEnabled();
  });

  it("runs one export at a time", async () => {
    let resolve!: (r: ExportResult) => void;
    build.mockReturnValue(new Promise((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<ExportButton />);

    await user.click(button());
    await user.click(button());
    expect(build).toHaveBeenCalledTimes(1);

    await act(async () => resolve(result()));
    expect(download).toHaveBeenCalledTimes(1);
  });
});
