// Собирает самодостаточную листовку: шрифт, логотип, AiCo, иконки и QR вшиваются в один HTML.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// Запуск: node src/build.mjs  (из папки flyer-ai-family). Результат: ai-family-A5.html рядом с src/.
const S = dirname(fileURLToPath(import.meta.url));
const W = resolve(S, "../../..");            // корень codify-workspace: логотип берётся из idcodify/public
const OUT = process.argv[2] || resolve(S, "../ai-family-A5.html");


let html = readFileSync(`${S}/flyer.src.html`, "utf8");

const fontCyr = readFileSync(`${S}/nunito-cyr.b64`, "utf8").trim();
const fontLat = readFileSync(`${S}/nunito-latin.b64`, "utf8").trim();

// Логотип с сайта: убираем фиксированный размер, оставляем viewBox.
let logo = readFileSync(`${W}/idcodify/public/codify-logo.svg`, "utf8").trim();
logo = logo.replace(/<svg[^>]*>/, (m) => m.replace(/ (width|height)="[^"]*"/g, "") .replace("<svg", '<svg class="logo" role="img" aria-label="Codify"'));
// Один логотип на страницу может повторяться: id градиентов должны быть уникальными.
let logoN = 0;
const logoUnique = () => { logoN++; return logo.replace(/paint(\d+)_radial_2579_92/g, `lg${logoN}_$1`); };

// AiCo по ADR 0013: плитка 200×200 r44 с градиентом логотипа, белый купол c=(100,152) r=84,
// глаза на y=116 с шагом ±22, радость = глифы «caret» в лаймовом, пиксель Ai 18×18 r5 над головой с зазором 3.
const aico = (cls, emotion = "happy") => {
  const eye = emotion === "happy"
    ? `<path d="M70 120 L78 111 L86 120 M114 120 L122 111 L130 120" fill="none" stroke="#6d7c00" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<g stroke="#246fff" stroke-width="14" stroke-linecap="round"><path d="M78 108v16"/><path d="M122 108v16"/></g><g fill="#fff"><circle cx="80.5" cy="110.5" r="2.4"/><circle cx="124.5" cy="110.5" r="2.4"/></g>`;
  return `<svg class="${cls}" viewBox="0 0 200 200" role="img" aria-label="AiCo, напарник ребёнка в приложении Codify">
  <defs>
    <linearGradient id="${cls}-t" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#01c4fa"/><stop offset="1" stop-color="#246fff"/></linearGradient>
    <linearGradient id="${cls}-b" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#ffffff"/><stop offset="1" stop-color="#e5edff"/></linearGradient>
    <clipPath id="${cls}-c"><rect width="200" height="200" rx="44"/></clipPath>
  </defs>
  <rect width="200" height="200" rx="44" fill="url(#${cls}-t)"/>
  <g clip-path="url(#${cls}-c)">
    <ellipse cx="100" cy="200" rx="92" ry="10" fill="#0a1058" opacity=".18"/>
    <circle cx="100" cy="152" r="84" fill="url(#${cls}-b)"/>
    ${eye}
  </g>
  <rect x="91" y="47" width="18" height="18" rx="5" fill="#c3dc3b" stroke="#869902" stroke-width="1.5"/>
</svg>`;
};

// Пиксельное сердечко 7×6 в розовом сайта (#fb64b6); клетки чуть меньше шага, чтобы читался пиксель.
const HEART = ["0110110","1111111","1111111","0111110","0011100","0001000"];
const heart = (x, y, cell, op) => {
  let d = "";
  HEART.forEach((row, j) => [...row].forEach((c, i) => { if (c === "1") d += `M${(x + i * cell).toFixed(2)} ${(y + j * cell).toFixed(2)}h${(cell * .86).toFixed(2)}v${(cell * .86).toFixed(2)}h-${(cell * .86).toFixed(2)}z`; }));
  return `<path d="${d}" fill="#fb64b6" opacity="${op}"/>`;
};
const heartsHero = () => `<svg class="hearts" viewBox="0 0 120 104" aria-hidden="true">
  ${heart(30, 8, 10, .78)}
  ${heart(2, 62, 6, .5)}
  ${heart(92, 54, 4.2, .55)}
  ${heart(100, 4, 2.6, .4)}
  ${heart(58, 80, 3.2, .35)}
</svg>`;
const heartsTop = () => `<svg class="hearts-top" viewBox="0 0 54 20" aria-hidden="true">${heart(0, 2, 2.6, .75)}${heart(24, 7, 1.8, .5)}${heart(40, 0, 1.4, .4)}</svg>`;
const heartsInline = () => `<svg class="hearts-inline" viewBox="0 0 60 18" aria-hidden="true">${heart(0, 1, 2.6, .7)}${heart(22, 5, 1.8, .5)}${heart(38, 0, 1.4, .4)}</svg>`;

const ico = (d, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}${extra}</svg>`;
const icons = {
  ICO_KEY: ico(`<circle cx="8" cy="15" r="4"/><path d="M10.8 12.2 20 3M15 8l3 3M17 6l3 3"/>`),
  ICO_PHOTO: ico(`<rect x="3" y="6" width="18" height="14" rx="3"/><circle cx="12" cy="13" r="3.5"/><path d="M8 6l1.5-2.5h5L16 6"/>`),
  ICO_HEART: ico(`<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>`),
  ICO_CHECK: ico(`<circle cx="12" cy="12" r="9"/><path d="m8 12 2.6 2.6L16 9.5"/>`),
  ICO_SHIELD: ico(`<path d="M12 3 5 6v6c0 4.4 3 7.6 7 9 4-1.4 7-4.6 7-9V6l-7-3z"/><path d="M12 9v4M12 16.5v.1"/>`),
  ICO_PHONE: ico(`<path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"/>`),
  // WhatsApp: Simple Icons 13.0.0 (CC0), заливка вместо обводки
  ICO_WA: `<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>`,
  ICO_IG: ico(`<rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>`),
  ICO_MAIL: ico(`<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="m3.5 7 8.5 6 8.5-6"/>`),
  ICO_PIN: ico(`<path d="M12 21s-6-5.3-6-11a6 6 0 0 1 12 0c0 5.7-6 11-6 11z"/><circle cx="12" cy="10" r="2.2"/>`),
  ICO_LIST: ico(`<path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 1.5-2M4 12l1 1 1.5-2M4 18l1 1 1.5-2"/>`),
  ICO_BOOK: ico(`<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20"/>`),
  ICO_GLOBE: ico(`<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>`),
  ICO_MIC: ico(`<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M9 21h6"/>`),
};

const qr = (name, label) => {
  const { n, path } = JSON.parse(readFileSync(`${S}/qr/qr-${name}.txt`, "utf8"));
  return `<svg viewBox="-1 -1 ${n + 2} ${n + 2}" role="img" aria-label="${label}"><rect x="-1" y="-1" width="${n + 2}" height="${n + 2}" fill="#fff"/><path d="${path}" fill="#0e1a47"/></svg>`;
};

const map = {
  FONT_CYR: fontCyr,
  FONT_LAT: fontLat,
  HEARTS_HERO: heartsHero(),
  HEARTS_TOP: heartsTop(),
  HEARTS_INLINE: heartsInline(),
  QR_WA: qr("wa", "QR-код: написать в WhatsApp Codify"),
  QR_SITE: qr("site", "QR-код: сайт codifylab.com"),
  ...icons,
};
html = html.replace(/\{\{LOGO\}\}/g, () => logoUnique());
html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => {
  if (!(k in map)) throw new Error(`нет значения для ${k}`);
  return map[k];
});

mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, html);
console.log("written", OUT, (html.length / 1024).toFixed(0), "KB");
