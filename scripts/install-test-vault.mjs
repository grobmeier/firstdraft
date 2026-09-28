import { copyFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const vaultRoot = path.resolve(
  process.argv[2] ?? path.join(projectRoot, "First Draft Test Vault"),
);
const pluginRoot = path.join(vaultRoot, ".obsidian", "plugins", "firstdraft");
const characterRoot = path.join(vaultRoot, "Characters");
const projectRootFolder = path.join(vaultRoot, "Long Night");
const projectPartsFolder = path.join(projectRootFolder, "Parts");
const projectElsewhereFolder = path.join(projectRootFolder, "Elsewhere");
const settingsDemo = Array.from(
  { length: 18 },
  (_, index) => `INT. TEST STAGE ${index + 1} - DAY #${index + 1}#

A monitor glows beside an empty chair.

JANE
Setting pass ${index + 1}.

MILLER
The numbers move.
`,
).join("\n");

await mkdir(pluginRoot, { recursive: true });
await mkdir(characterRoot, { recursive: true });
await mkdir(projectPartsFolder, { recursive: true });
await mkdir(projectElsewhereFolder, { recursive: true });
await copyFile(
  path.join(projectRoot, "main.js"),
  path.join(pluginRoot, "main.js"),
);
await copyFile(
  path.join(projectRoot, "manifest.json"),
  path.join(pluginRoot, "manifest.json"),
);
await copyFile(
  path.join(projectRoot, "styles.css"),
  path.join(pluginRoot, "styles.css"),
);
await writeFile(
  path.join(projectRootFolder, "Screenplay Project.md"),
  `---
firstdraft: screenplay-project
title: The Long Night
parts:
  - "[[Parts/01 - Opening]]"
  - "[[Elsewhere/02 - The Ward]]"
character-folder: Characters
---

# The Long Night

This note owns the screenplay order. Its parts may live in different folders.
`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(projectPartsFolder, "01 - Opening.md"),
  `---
screenplay: true
---

FADE IN:

EXT. COAST ROAD - NIGHT

JANE
We should have turned back.

MILLER
Too late now.
`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(projectElsewhereFolder, "02 - The Ward.md"),
  `---
screenplay: true
---

INT. ABANDONED WARD - DAWN

REEVES waits beside the sealed door.

REEVES
Jane, you need to see this.

JANE
Open it.

>CUT TO:
`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(vaultRoot, "Milestone 1.md"),
  `---\nscreenplay: true\n---\n\nINT. TEST ROOM - DAY\n\nJANE\nIt works.\n`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(vaultRoot, "Milestone 2.md"),
  `---\nscreenplay: true\n---\n\nINT. MILITARY BASE - THERAPY ROOM - DAY\n\nDR. JANE MORROW, 42, enters.\n\nJANE\nHow long have you been having these dreams?\n\nMILLER\nSince I died.\n\nINT. MILITARY BASE - WARD - NIGHT\n\nREEVES\nMiller is awake.\n\nJANE\nI'll be there.\n\n`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(vaultRoot, "Milestone 3.md"),
  `---\nscreenplay: true\n---\n\nINT. MILITARY BASE - THERAPY ROOM - DAY\n\nRain traces the reinforced windows. DR. JANE MORROW, 42, studies a silent monitor.\n\nJANE\nHow long have you been having these dreams?\n\nMILLER\nSince I died.\n\nJANE\nThat is not the answer I expected.\n\nINT. MILITARY BASE - WARD - NIGHT\n\nOrderlies hurry between curtained beds as an alarm begins to pulse.\n\nREEVES\nMiller is awake.\n\nJANE\nI'll be there.\n\nEXT. MILITARY BASE - PARADE GROUND - DAWN\n\nThe rain has stopped. Miller stands alone beneath the first pale light.\n\n`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(vaultRoot, "Milestone 3 Settings Demo.md"),
  `---\nscreenplay: true\n---\n\n${settingsDemo}`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(vaultRoot, "Milestone 4.md"),
  `---\nscreenplay: true\ntitle: Milestone 4 Test\n---\n\nFADE IN:\n\nINT. MILITARY BASE - THERAPY ROOM - DAY\n\nRain traces the reinforced windows. DR. JANE MORROW, 42, studies a silent monitor.\n\nJANE\n(quietly)\nHow long have you been having these dreams?\n\nMILLER\n(to Jane)\nSince I died.\n\nJANE\nThat is not the answer I expected.\n\n>MEMORY CUT TO:\n\nINT. MILITARY BASE - WARD - NIGHT\n\nREEVES\nMiller is awake.\n\nJANE\nI'll be there.\n\nCUT TO:\n\n`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(vaultRoot, "Milestone 5.md"),
  `---\nscreenplay: true\ntitle: Milestone 5 FDX Test\n---\n\n.INT. RESEARCH & DEVELOPMENT LAB - NIGHT\n\n!A monitor reads: 2 < 3, then "READY" > 'WAIT'.\n\nDR. JANE MORROW (O.S.)\n(under her breath)\nThis must remain safe & readable.\n\n>MEMORY CUT TO:\n`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(characterRoot, "Jane.md"),
  `---
firstdraft: character
character: JANE
aliases:
  - DR. JANE MORROW
screenplays:
  - "[[Milestone 4]]"
related:
  - "[[Characters/Miller]]"
---

# Jane

## Background

Jane works at the military base.

## Wants and fears

## Voice

## Relationships

- [[Characters/Miller]] — her patient.

## Continuity notes
`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});
await writeFile(
  path.join(characterRoot, "Miller.md"),
  `---
firstdraft: character
character: MILLER
aliases: []
screenplays:
  - "[[Milestone 4]]"
related:
  - "[[Characters/Jane]]"
---

# Miller

## Background

## Wants and fears

## Voice

## Relationships

- [[Characters/Jane]] — his doctor.

## Continuity notes
`,
  { flag: "wx" },
).catch((error) => {
  if (error?.code !== "EEXIST") throw error;
});

console.log(`Installed First Draft in test vault: ${vaultRoot}`);
