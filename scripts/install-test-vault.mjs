import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const vaultRoot = path.resolve(
  process.argv[2] ?? path.join(projectRoot, ".test-vault"),
);
const pluginRoot = path.join(vaultRoot, ".obsidian", "plugins", "firstdraft");

await mkdir(pluginRoot, { recursive: true });
await copyFile(
  path.join(projectRoot, "main.js"),
  path.join(pluginRoot, "main.js"),
);
await copyFile(
  path.join(projectRoot, "manifest.json"),
  path.join(pluginRoot, "manifest.json"),
);
await writeFile(
  path.join(vaultRoot, "Milestone 1.md"),
  `---\nscreenplay: true\n---\n\nINT. TEST ROOM - DAY\n\nJANE\n+It works.\n`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});

console.log(`Installed First Draft in test vault: ${vaultRoot}`);
