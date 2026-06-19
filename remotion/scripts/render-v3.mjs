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
  id: "v3",
  puppeteerInstance: browser,
});

console.log(`Rendering ${composition.durationInFrames} frames at ${composition.width}x${composition.height}…`);

let last = -1;
await renderMedia({
  composition,
  serveUrl: bundled,
  codec: "h264",
  outputLocation: "/mnt/documents/mystic_promo_horizontal_30s_es_v3.mp4",
  puppeteerInstance: browser,
  muted: true,
  concurrency: 1,
  timeoutInMilliseconds: 120000,
  onProgress: ({ progress }) => {
    const p = Math.round(progress * 100);
    if (p !== last && p % 5 === 0) {
      console.log(`${p}%`);
      last = p;
    }
  },
});

await browser.close({ silent: false });
console.log("Done.");
