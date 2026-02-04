import color from "picocolors";

export function formatIntroTitle(title: string): string {
  return color.bgYellow(color.black(` ${title} `));
}
