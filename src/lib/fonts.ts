// /lib/fonts.ts
const loaded = new Set<string>();
export function ensureGoogleFont(family: string, weights:number[]=[300,400,500,600,700]) {
  const fam = family.replace(/ /g, "+");
  const href = `https://fonts.googleapis.com/css2?family=${fam}:wght@${weights.join(";")}&display=swap`;
  if (loaded.has(href)) return;
  const link = document.createElement("link");
  link.rel = "stylesheet"; link.href = href;
  document.head.appendChild(link); loaded.add(href);
}