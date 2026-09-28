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

export const EXAMPLE_FOLDER_NAME = "First Draft Example";

export interface ExampleProjectFile {
  path: string;
  content: string;
}

export function availableExampleFolderName(
  isTaken: (name: string) => boolean,
): string {
  let suffix = 1;
  let candidate = EXAMPLE_FOLDER_NAME;
  while (isTaken(candidate)) {
    suffix += 1;
    candidate = `${EXAMPLE_FOLDER_NAME} ${suffix}`;
  }
  return candidate;
}

export function exampleProjectFiles(folder: string): ExampleProjectFile[] {
  const projectLink = `${folder}/Screenplay Project`;
  const maraLink = `${folder}/Characters/Mara`;
  const eliasLink = `${folder}/Characters/Elias`;

  return [
    {
      path: "Start Here.md",
      content: `# Start Here

Welcome to First Draft. This removable example is a small, complete screenplay project.

1. Open [[Screenplay Project]] and review its ordered parts.
2. Open [[Parts/01 - Arrival]] and continue the scene in Fountain syntax.
3. Open the First Draft Palette for writing actions, project navigation, and the cheat sheet.
4. Try **Screenplay: Show Statistics** and **Screenplay: Check Characters**.
5. Export the project to Fountain or Final Draft FDX; the source notes remain unchanged.

The character dossiers are [[Characters/Mara]] and [[Characters/Elias]]. Delete the entire \`${folder}\` folder when you no longer need the example.
`,
    },
    {
      path: "Screenplay Project.md",
      content: `---
firstdraft: screenplay-project
title: First Draft Example
parts:
  - "[[Parts/01 - Arrival]]"
  - "[[Parts/02 - Choice]]"
character-folder: Characters
---

# First Draft Example

The project note owns the screenplay's reading order. Open the First Draft Palette to navigate, inspect, and export the whole screenplay.
`,
    },
    {
      path: "Parts/01 - Arrival.md",
      content: `---
screenplay: true
---

FADE IN:

EXT. RIVERSIDE PLATFORM - NIGHT

Rain silver-coats the empty tracks. MARA watches the station clock.

MARA (V.O.)
(steadying herself)
This is the last train.

ELIAS
Then we should board it.

CUT TO:
`,
    },
    {
      path: "Parts/02 - Choice.md",
      content: `---
screenplay: true
---

INT. LAST TRAIN - NIGHT

The doors wait open. Mara turns back towards the dark platform.

MARA
I forgot why I came.

ELIAS
No. You remembered why you can leave.

FADE TO BLACK:
`,
    },
    {
      path: "Characters/Mara.md",
      content: `---
firstdraft: character
character: "MARA"
aliases: []
screenplays:
  - "[[${projectLink}]]"
related:
  - "[[${eliasLink}]]"
---

# Mara

## Background

She came to the station to make a choice.

## Wants and fears

## Voice

## Relationships

## Continuity notes
`,
    },
    {
      path: "Characters/Elias.md",
      content: `---
firstdraft: character
character: "ELIAS"
aliases: []
screenplays:
  - "[[${projectLink}]]"
related:
  - "[[${maraLink}]]"
---

# Elias

## Background

He knows more about Mara's choice than he says.

## Wants and fears

## Voice

## Relationships

## Continuity notes
`,
    },
  ];
}
