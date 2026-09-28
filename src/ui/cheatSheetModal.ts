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

import { Modal, Notice } from "obsidian";
import type { App } from "obsidian";
import { CHEAT_SHEET_SECTIONS } from "../onboarding/cheatSheet";

export class CheatSheetModal extends Modal {
  constructor(app: App) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Screenplay cheat sheet");
    this.contentEl.addClass("firstdraft-cheat-sheet");

    for (const section of CHEAT_SHEET_SECTIONS) {
      this.contentEl.createEl("h3", { text: section.title });
      this.contentEl.createEl("p", {
        cls: "firstdraft-palette-muted",
        text: section.introduction,
      });
      const entries = this.contentEl.createEl("dl");
      for (const entry of section.entries) {
        entries.createEl("dt", { text: entry.term });
        entries.createEl("dd", { text: entry.explanation });
        if (entry.example)
          this.renderExample(entries, entry.term, entry.example);
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private renderExample(
    container: HTMLElement,
    term: string,
    example: string,
  ): void {
    const row = container.createDiv({ cls: "firstdraft-cheat-example" });
    row.createEl("code", { text: example });
    const copy = row.createEl("button", {
      cls: "firstdraft-cheat-copy",
      text: "Copy",
      attr: { "aria-label": `Copy ${term} example` },
    });
    copy.addEventListener("click", () => {
      void navigator.clipboard
        .writeText(example)
        .then(() => new Notice(`Copied ${term} example.`))
        .catch(() => new Notice("Could not copy the example."));
    });
  }
}
