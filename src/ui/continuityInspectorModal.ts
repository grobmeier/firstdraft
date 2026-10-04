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
import type FirstDraftPlugin from "../main";
import { loadInspector, openInspectorEvidence } from "../continuity/vault";
import type { Evidence } from "../continuity/model";

export class ContinuityInspectorModal extends Modal {
  private generation = 0;
  private guards: ReadonlyMap<string, string> = new Map();
  constructor(private plugin: FirstDraftPlugin) {
    super(plugin.app);
  }
  onOpen(): void {
    this.setTitle("Continuity inspector");
    void this.refresh();
  }
  onClose(): void {
    this.generation++;
    this.contentEl.empty();
  }
  private async refresh(): Promise<void> {
    const generation = ++this.generation;
    this.contentEl.empty();
    this.contentEl.createEl("p", { text: "Checking this screenplay…" });
    try {
      const snapshot = await loadInspector(this.plugin);
      if (generation !== this.generation) return;
      const { report, dossiers } = snapshot;
      this.guards = snapshot.guards;
      this.contentEl.empty();
      const refresh = this.contentEl.createEl("button", { text: "Refresh" });
      refresh.addEventListener("click", () => void this.refresh());
      this.contentEl.createEl("p", {
        text: `${report.files.length} screenplay parts · ${dossiers.size} character pages · ${report.findings.length} findings`,
      });
      this.contentEl.createEl("p", {
        text: "Read-only checks of character identities/links and scene headings/content. Suggestions may be intentional. Story logic, chronology, props and inferred character presence are not checked.",
      });
      if (report.incomplete.length) {
        this.contentEl.createEl("h3", { text: "Checks incomplete" });
        for (const issue of report.incomplete)
          this.contentEl.createEl("p", { text: issue });
      }
      if (!report.findings.length)
        this.contentEl.createEl("p", {
          text: report.incomplete.length
            ? "No findings in the supported portions checked; this is not a complete report."
            : "No issues found by these supported rules. This does not certify story continuity.",
        });
      let previousRule = "";
      for (const finding of report.findings) {
        if (finding.rule !== previousRule) {
          this.contentEl.createEl("h3", { text: finding.rule });
          previousRule = finding.rule;
        }
        this.contentEl.createEl("p", {
          text: `${finding.kind === "advice" ? "Advice" : "Identity/link problem"}: ${finding.message}`,
        });
        for (const evidence of finding.evidence) this.link(evidence);
        if (finding.dossierPath) {
          const source = dossiers.get(finding.dossierPath);
          if (source !== undefined)
            this.link(
              {
                path: finding.dossierPath,
                source,
                line: 0,
                text: source.split("\n")[0] ?? "",
              },
              "Character page",
            );
        }
      }
    } catch (error) {
      if (generation !== this.generation) return;
      this.contentEl.empty();
      this.contentEl.createEl("p", {
        text:
          error instanceof Error
            ? error.message
            : "Could not check this screenplay.",
      });
      const retry = this.contentEl.createEl("button", { text: "Refresh" });
      retry.addEventListener("click", () => void this.refresh());
    }
  }
  private link(evidence: Evidence, label = evidence.text): void {
    const button = this.contentEl.createEl("button", {
      cls: "firstdraft-inspector-evidence",
      text: `${label} · ${evidence.path}:${evidence.line + 1}`,
    });
    button.addEventListener("click", () => {
      void openInspectorEvidence(this.plugin, evidence, this.guards)
        .then(() => this.close())
        .catch(
          (error: unknown) =>
            new Notice(
              error instanceof Error
                ? error.message
                : "Could not open evidence.",
            ),
        );
    });
  }
}
