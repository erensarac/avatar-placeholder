export default function (text: string, textCase: "uppercase" | "lowercase"): string {
  if (textCase === "uppercase") {
    return text.toUpperCase();
  }

  return text.toLowerCase();
}
