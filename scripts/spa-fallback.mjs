/**
 * GitHub Pages serves a static tree with no rewrite rules, so any URL that
 * is not a real file returns 404. Copying index.html to 404.html hands the
 * app back instead, keeping refreshes and shared deep links working.
 */
import { copyFileSync, existsSync } from "node:fs";

if (!existsSync("dist/index.html")) {
  console.error("spa-fallback: dist/index.html missing — did the build run?");
  process.exit(1);
}
copyFileSync("dist/index.html", "dist/404.html");
console.log("spa-fallback: wrote dist/404.html");
