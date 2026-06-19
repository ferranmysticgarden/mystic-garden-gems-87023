import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition, openBrowser } from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("Bundling…");
const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});
console.log("Bundled.");

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: { args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames at ${composition.width}x${composition.height}…`);

await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/mnt/documents/mystic_promo_horizontal_30s_es.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 2,
  onProgress: ({ progress }) => {
    if (Math.round(progress * 100) % 10 === 0) {
      process.stdout.write(`\r${Math.round(progress * 100)}%`);
    }
  },
});

await browser.close({ silent: false });
console.log("\nDone.");
