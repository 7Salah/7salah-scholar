#!/usr/bin/env node
// فاحص محتوى مبدئي (نصي فقط). يفحص النصوص/الشيفرة بحثًا عن كلمات ممنوعة حسب سياسة V22.
// لا يغني عن المراجعة البصرية اليدوية للأصول. الاستخدام: node tools/content-audit.mjs [مسار]
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const root = process.argv[2] || "game/src";
const exts = new Set([".ts", ".js", ".html", ".css", ".json", ".md", ".txt"]);
const skip = new Set(["node_modules", "dist", ".git"]);
const banned = [
  "porn", "nsfw", "nude", "naked", "topless", "lingerie", "bikini", "erotic", "sexy", "seduc", "strip", "fetish", "onlyfans", "xxx", "18\\+",
  "إباح", "عاري", "عارية", "عري", "إغراء", "مثير", "جنس", "تحرش", "حميم", "بكيني", "لانجري"
];
const re = new RegExp(banned.join("|"), "i");
// استثناءات: نصوص السياسة نفسها وهذا الملف
const ignoreFiles = ["V22-CONTENT-SAFETY.md", "content-audit.mjs", "V22-ART-DIRECTION.md"];

let hits = 0, files = 0;
(function walk(d) {
  for (const n of readdirSync(d)) {
    if (skip.has(n)) continue;
    const p = join(d, n);
    const s = statSync(p);
    if (s.isDirectory()) { walk(p); continue; }
    if (!exts.has(extname(n)) || ignoreFiles.includes(n)) continue;
    files++;
    readFileSync(p, "utf8").split("\n").forEach((line, i) => {
      const m = line.match(re);
      if (m) { hits++; console.log(`${p}:${i + 1}  [${m[0]}]  ${line.trim().slice(0, 120)}`); }
    });
  }
})(root);
console.log(`\nفُحص ${files} ملفًا — ${hits} تطابق.`);
process.exit(hits ? 1 : 0);
