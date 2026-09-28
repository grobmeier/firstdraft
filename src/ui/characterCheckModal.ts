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

import { Modal, TFile } from "obsidian";
import type { App } from "obsidian";
import type {
  CharacterIssue,
  CharacterIssueSeverity,
} from "../characters/verification";

const LABELS: Record<CharacterIssueSeverity, string> = {
  error: "Errors",
  warning: "Warnings",
  observation: "Observations",
};

export class CharacterCheckModal extends Modal {
  constructor(
    app: App,
    private readonly issues: readonly CharacterIssue[],
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle("Character check");
    this.contentEl.addClass("firstdraft-character-check");
    if (this.issues.length === 0) {
      this.contentEl.createEl("p", {
        text: "No deterministic character-page issues were found.",
      });
      return;
    }

    for (const severity of ["error", "warning", "observation"] as const) {
      const issues = this.issues.filter((issue) => issue.severity === severity);
      if (issues.length === 0) continue;
      this.contentEl.createEl("h3", {
        text: `${LABELS[severity]} (${issues.length})`,
      });
      const list = this.contentEl.createEl("ul", {
        cls: `firstdraft-character-check-${severity}`,
      });
      for (const issue of issues) {
        const item = list.createEl("li");
        if (issue.path) {
          const button = item.createEl("button", {
            cls: "clickable-icon firstdraft-character-check-link",
            text: issue.message,
          });
          button.addEventListener(
            "click",
            () => void this.openPath(issue.path!),
          );
        } else {
          item.setText(issue.message);
        }
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }

  private async openPath(path: string): Promise<void> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (!(file instanceof TFile)) return;
    this.close();
    await this.app.workspace.getLeaf("tab").openFile(file);
  }
}
