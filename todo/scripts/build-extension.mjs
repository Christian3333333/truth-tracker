import * as esbuild from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const extensionDir = path.join(root, "..", "extension");

await esbuild.build({
  entryPoints: [
    path.join(extensionDir, "background.ts"),
    path.join(extensionDir, "content.ts"),
    path.join(extensionDir, "offscreen.ts"),
    path.join(extensionDir, "popup.ts"),
  ],
  outdir: path.join(extensionDir, "dist"),
  bundle: true,
  format: "esm",
  platform: "browser",
  target: ["chrome120"],
  sourcemap: true,
  logLevel: "info",
});

console.log("Extension built → extension/dist");
