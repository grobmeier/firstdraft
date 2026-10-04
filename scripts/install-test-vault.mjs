/*
 * Copyright 2026 Christian Grobmeier
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
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
const sceneDemoFolder = path.join(vaultRoot, "Scene Workspace Demo");
await mkdir(path.join(sceneDemoFolder, "Elsewhere"), { recursive: true });
const sceneDemoFiles = {
  "Project.md": `---
firstdraft: screenplay-project
title: The Last Train
parts:
  - "[[01 - Arrival]]"
  - "[[Elsewhere/02 - Departure]]"
character-folder: Characters
---

# The Last Train

An isolated scene workspace demo. Start with the Scene workspace test plan.
`,
  "01 - Arrival.md": `---
screenplay: true
screenplay-project: "[[Scene Workspace Demo/Project]]"
---

Title: The Last Train
Author: Example Writer

FADE IN:

INT. STATION - DAY
= Alex arrives before the last train.

ALEX
Is this the right platform?

EXT. PLATFORM - NIGHT
= Sam waits beneath the clock.

SAM
We have one minute.
`,
  "Elsewhere/02 - Departure.md": `---
screenplay: true
screenplay-project: "[[Scene Workspace Demo/Project]]"
---

INT. STATION - DAY
= Alex returns to collect a forgotten ticket.

ALEX
I left something behind.

.INT. 駅 - NIGHT
= The last train leaves.

@サム
出発しましょう。
`,
  "Scene workspace test plan.md": await readFile(
    path.join(projectRoot, "docs", "SCENE_WORKSPACE.md"),
    "utf8",
  ),
};
for (const [name, contents] of Object.entries(sceneDemoFiles)) {
  await writeFile(path.join(sceneDemoFolder, name), contents, {
    flag: "wx",
  }).catch((error) => {
    if (error?.code !== "EEXIST") throw error;
  });
}
const inspectorRoot = path.join(vaultRoot, "Continuity Inspector Demo");
await mkdir(path.join(inspectorRoot, "Characters"), { recursive: true });
const inspectorFiles = {
  "Project.md": `---
firstdraft: screenplay-project
title: Inspector demo
parts:
  - "[[Opening]]"
  - "[[Departure]]"
character-folder: Characters
---

An isolated, neutral continuity demo.
`,
  "Opening.md": `---
screenplay: true
screenplay-project: "[[Continuity Inspector Demo/Project]]"
---

Title: Inspector Demo
Author: Example Writer

INT. STATION
= Intentional outline placeholder.

INT. STATION - DAY

@ÉLISE (V.O.)
The platform is quiet.

MILER
I have the tickets.
`,
  "Departure.md": `---
screenplay: true
screenplay-project: "[[Continuity Inspector Demo/Project]]"
---

.INT. 駅 - NIGHT

@サム
出発しましょう。
`,
  "Characters/Elise.md": `---
firstdraft: character
character: ELISE
aliases:
  - ÉLISE
screenplays:
  - "[[Continuity Inspector Demo/Project]]"
---

# Elise
`,
  "Characters/Miller.md": `---
firstdraft: character
character: MILLER
screenplays:
  - "[[Continuity Inspector Demo/Project]]"
---

# Miller
`,
  "Inspector test plan.md": await readFile(
    path.join(projectRoot, "docs", "CONTINUITY_INSPECTOR.md"),
    "utf8",
  ),
};
for (const [name, contents] of Object.entries(inspectorFiles)) {
  await writeFile(path.join(inspectorRoot, name), contents, {
    flag: "wx",
  }).catch((error) => {
    if (error?.code !== "EEXIST") throw error;
  });
}
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
screenplay-project: "[[Long Night/Screenplay Project]]"
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
screenplay-project: "[[Long Night/Screenplay Project]]"
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
