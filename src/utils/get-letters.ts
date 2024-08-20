export default function getLetters(name: string, count: number): string {
  const words: string[] = name.split(" ");
  const letterCount: number = count ? Math.min(count, 3) : 2;

  return words
    .map((word) => word.replace('"', "").at(0))
    .slice(0, letterCount)
    .toString()
    .replaceAll(",", "");
}
