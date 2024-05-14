import type { Color } from "../types/color";

export const colors: Color[] = await Bun.file("colors.json").json();
