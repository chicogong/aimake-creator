import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const promoDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(promoDir, "../../..");
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ttf": "font/ttf",
  ".ttc": "font/collection",
  ".woff2": "font/woff2",
};

function isInside(file, root) {
  const resolved = resolve(file);
  return resolved === root || resolved.startsWith(`${root}/`);
}

const server = createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || "/").split("?")[0]);
  const file = join(repoRoot, url === "/" ? "docs/promotions/aimake-studio-intro/cover.html" : url.slice(1));
  if (!isInside(file, repoRoot)) {
    res.writeHead(403); res.end(); return;
  }
  try {
    const body = await readFile(file);
    res.writeHead(200, { "content-type": mime[extname(file)] || "application/octet-stream" });
    res.end(body);
  } catch {
    res.writeHead(404); res.end("not found");
  }
});

await new Promise((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
const { port } = server.address();
const origin = `http://127.0.0.1:${port}`;

const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH || "/usr/bin/google-chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu", "--font-render-hinting=none"],
});

const jobs = [
  { path: "/docs/promotions/aimake-studio-intro/cover.html", file: "cover-16x9.png", width: 1920, height: 1080 },
  { path: "/docs/promotions/aimake-studio-intro/flow.html", file: "flow-diagram.png", width: 1920, height: 1080 },
  { path: "/docs/promotions/aimake-studio-intro/share.html", file: "share-star-cocreate.png", width: 1080, height: 1080 },
];

for (const job of jobs) {
  const page = await browser.newPage();
  await page.setViewport({ width: job.width, height: job.height, deviceScaleFactor: 2 });
  await page.goto(origin + job.path, { waitUntil: "networkidle0" });
  await page.evaluate(() => document.fonts.ready);
  // extra tick so antialiased glyphs settle
  await new Promise((r) => setTimeout(r, 200));
  const out = join(promoDir, job.file);
  await page.screenshot({
    path: out,
    type: "png",
    clip: { x: 0, y: 0, width: job.width, height: job.height },
    omitBackground: false,
  });
  console.log("wrote", out);
  await page.close();
}

await browser.close();
server.close();
