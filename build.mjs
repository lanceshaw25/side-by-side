// Builds the extension into dist/.
//   npm run build   – one-time build
//   npm run watch   – rebuild TypeScript on every save
import * as esbuild from "esbuild";
import { cp } from "node:fs/promises";

const watch = process.argv.includes("--watch");

// Files that go into the extension unchanged (manifest, CSS).
// Note: in watch mode these are copied once at startup, so restart
// the watcher after editing anything in public/.
await cp("public", "dist", { recursive: true });

const options = {
  entryPoints: ["src/content.ts"],
  bundle: true,
  outdir: "dist",
  format: "iife", // content scripts can't use import/export
  target: "chrome120",
  sourcemap: true, // lets DevTools show the original TypeScript
  logLevel: "info",
};

if (watch) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
