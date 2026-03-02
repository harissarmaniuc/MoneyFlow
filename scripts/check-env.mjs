import fs from "node:fs";
import path from "node:path";

const required = [
  "DATABASE_URL",
  "NEXTAUTH_URL",
  "AUTH_SECRET",
  "CRON_SECRET",
];
const optionalPairs = [["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"]];

function readEnvFile(filename) {
  if (!fs.existsSync(filename)) return {};
  const content = fs.readFileSync(filename, "utf8");
  return Object.fromEntries(
    content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const idx = line.indexOf("=");
        const key = line.slice(0, idx).trim();
        const value = line.slice(idx + 1).trim().replace(/^"|"$/g, "");
        return [key, value];
      })
  );
}

const cwd = process.cwd();
const envFromFiles = {
  ...readEnvFile(path.join(cwd, ".env")),
  ...readEnvFile(path.join(cwd, ".env.local")),
};

const lookup = (key) => process.env[key] ?? envFromFiles[key] ?? "";
const missing = required.filter((key) => {
  const value = lookup(key);
  return !value || value.startsWith("replace-");
});

if (missing.length > 0) {
  console.error("Missing or placeholder env vars:");
  for (const key of missing) {
    console.error(`- ${key}`);
  }
  process.exit(1);
}

const databaseUrl = lookup("DATABASE_URL");
const nextAuthUrl = lookup("NEXTAUTH_URL");
const runningOnVercel =
  (process.env.VERCEL ?? "").toLowerCase() === "1" ||
  process.env.VERCEL_ENV === "production";

if (runningOnVercel) {
  if (/localhost|127\.0\.0\.1/i.test(nextAuthUrl)) {
    console.error("Invalid NEXTAUTH_URL for Vercel: must be your deployed HTTPS URL.");
    process.exit(1);
  }
}

if (databaseUrl.startsWith("file:")) {
  console.error("Invalid DATABASE_URL: this project expects a PostgreSQL connection string.");
  process.exit(1);
}

for (const [keyA, keyB] of optionalPairs) {
  const a = lookup(keyA);
  const b = lookup(keyB);
  const configured =
    a &&
    b &&
    !a.startsWith("replace-with-") &&
    !b.startsWith("replace-with-");
  if (!configured) {
    console.warn(`Optional provider not configured: ${keyA}, ${keyB} (Google login disabled)`);
  }
}

console.log("Environment configuration looks good.");
