// Logo palette extraction. A stub until T-026 fills it in; returning no swatches keeps
// ImageUpload's onPalette path working if the logo palette is cut.
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- the argument is used once T-026 lands
export async function extractPalette(_dataUrl: string): Promise<string[]> {
  return [];
}
