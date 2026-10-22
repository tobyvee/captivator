// The small-phone fit check's numbers and decision. The measurement itself lives in the editor
// (useFitCheck), which renders the landing page compact at FIT_WIDTH and reads its height.

/** The width the landing page is measured at: an iPhone SE's login sheet. */
export const FIT_WIDTH = 375;

/** The height of an iPhone SE's login sheet. Content past it makes guests scroll to reach Connect. */
export const FOLD_HEIGHT = 600;

/** Whether content of this height passes the small-phone fold. */
export function isTooTall(height: number): boolean {
  return height > FOLD_HEIGHT;
}
