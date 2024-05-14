import type { Color } from "../types/color";

const colors: Color[] = await Bun.file("colors.json").json();

export default function (name: string, colorName?: string): Color {
  const randomIndex: number = name.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const randomColor: Color = colors.at(Math.round(randomIndex))!;
  const color = colors.find((color) => color.name === colorName);

  if (color) {
    return color;
  } else if (randomColor) {
    return randomColor;
  }

  return colors[randomIndex] || colors[0];
}
