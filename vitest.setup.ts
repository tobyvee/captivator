import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Testing Library's auto-setup (unmount after each test, and React's act environment flag)
// runs only when Vitest globals are on. They're off, so do both here, and only in files
// that opt into jsdom.
if (typeof document !== "undefined") {
  const { cleanup } = await import("@testing-library/react");
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  afterEach(cleanup);
}
