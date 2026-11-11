// Bundles tests/*.test.ts with esbuild (ships with Vite) and runs them with node:test.
import { build } from "esbuild";
import { readdirSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
const out = ".test-build";
mkdirSync(out, { recursive: true });
const entries = readdirSync("tests").filter((f) => f.endsWith(".test.ts")).map((f) => `tests/${f}`);
await build({ entryPoints: entries, outdir: out, bundle: true, platform: "node", format: "esm", outExtension: { ".js": ".mjs" }, logLevel: "error" });
const files = readdirSync(out).filter((f) => f.endsWith(".mjs")).map((f) => `${out}/${f}`);
const r = spawnSync(process.execPath, ["--test", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
