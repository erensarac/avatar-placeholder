export default function (name: string, count: number = 2) {
  if (!name) {
    throw new Error("");
  }

  return name
    .split(" ")
    .map((value) => value.replace('"', "").at(0))
    .slice(0, count);
}
