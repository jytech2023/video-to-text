/**
 * YouTube Cookie Fetcher
 *
 * Extracts cookies from your real Chrome browser profile (already logged in).
 * No need to log in again — reads directly from Chrome's cookie database.
 *
 * Usage:
 *   # Export cookies from Chrome (default)
 *   pnpm cookies:refresh
 *
 *   # Export from a specific browser
 *   pnpm cookies:refresh -- --browser firefox
 *
 *   # Also output base64 for Render deployment
 *   pnpm cookies:base64
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const COOKIES_PATH = path.join(__dirname, "..", "cookies.txt");

function run() {
  const args = process.argv.slice(2);
  const outputBase64 = args.includes("--base64");

  // Find browser flag
  const browserIdx = args.indexOf("--browser");
  const browser = browserIdx !== -1 ? args[browserIdx + 1] : "chrome";

  console.log(`Extracting YouTube cookies from ${browser}...\n`);

  try {
    // Use yt-dlp itself to dump cookies from the browser
    // This is the most reliable method — uses the same extraction yt-dlp would use
    execSync(
      `yt-dlp --cookies-from-browser ${browser} --cookies "${COOKIES_PATH}" --skip-download "https://www.youtube.com/watch?v=dQw4w9WgXcQ"`,
      { stdio: "pipe", timeout: 30_000 }
    );
  } catch {
    // yt-dlp may exit with error on skip-download but still write cookies
  }

  if (!fs.existsSync(COOKIES_PATH) || fs.statSync(COOKIES_PATH).size === 0) {
    console.error(
      "Failed to extract cookies. Make sure you are logged into YouTube in your browser."
    );
    process.exit(1);
  }

  const cookieContent = fs.readFileSync(COOKIES_PATH, "utf-8");
  const lineCount = cookieContent.split("\n").filter((l) => l && !l.startsWith("#")).length;
  console.log(`Saved ${lineCount} cookies to ${COOKIES_PATH}`);

  if (outputBase64) {
    const b64 = Buffer.from(cookieContent).toString("base64");
    console.log("\n=== Base64 (copy to Render YT_COOKIES_BASE64 env var) ===\n");
    console.log(b64);
    console.log("");
  }

  console.log("\nFor local dev, add to .env.local:");
  console.log("YT_COOKIE_FILE=./cookies.txt");
}

run();
