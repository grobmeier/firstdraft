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

import { MarkdownView, Modal, Notice, Setting } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  sceneFile,
  filterScenes,
  EMPTY_SCENE_FILTERS,
  createScene,
  editSynopsis,
  moveScene,
  type Scene,
  type SceneFile,
  type SceneFilters,
} from "../scenes/model";
import {
  loadSceneWorkspace,
  jumpToScene,
  applySceneChanges,
  readSceneRecovery,
  restoreLastSceneMove,
  type SceneWorkspace,
} from "../scenes/vault";
import type { SceneRecovery } from "../scenes/transactions";
import { parseSceneHeadingParts } from "../screenplay/indexer";

async function report(
  task: () => Promise<void>,
  refresh: () => void,
): Promise<void> {
  try {
    await task();
    refresh();
  } catch (error) {
    new Notice(
      error instanceof Error
        ? error.message
        : "Scene operation failed. Your recovery copy, if any, is preserved.",
      12000,
    );
    refresh();
  }
}
function action(
  container: HTMLElement,
  label: string,
  run: () => void,
  disabled = false,
): HTMLButtonElement {
  const button = container.createEl("button", { text: label });
  button.disabled = disabled;
  button.addEventListener("click", run);
  return button;
}

export async function renderSceneWorkspace(
  plugin: FirstDraftPlugin,
  container: HTMLElement,
  filters: SceneFilters,
  isCurrent: () => boolean,
  refresh: () => void,
): Promise<void> {
  container.empty();
  container.createEl("h2", { text: "Scenes" });
  const bar = container.createDiv({ cls: "firstdraft-scene-actions" });
  action(bar, "Writing actions", () => {
    plugin.sceneWorkspaceMode = false;
    refresh();
  });
  action(bar, "Refresh", refresh);
  try {
    const workspace = await loadSceneWorkspace(plugin);
    if (!isCurrent()) return;
    const all = workspace.files.flatMap((file) => file.scenes);
    const issues = [
      ...workspace.issues,
      ...workspace.files.flatMap((file) =>
        file.issue ? [`${file.path}: ${file.issue}`] : [],
      ),
    ];
    if (issues.length)
      container.createEl("p", {
        cls: "firstdraft-scene-warning",
        text: issues.join("\n"),
      });
    const canWrite = workspace.issues.length === 0;
    action(
      bar,
      "New scene",
      () =>
        new SceneEditModal(plugin, workspace, null, "create", refresh).open(),
      !canWrite || !workspace.files.some((file) => !file.issue),
    );
    action(
      bar,
      "Restore last move",
      () =>
        void report(
          async () => {
            const record = await readSceneRecovery(plugin);
            if (!record) {
              new Notice("No scene move recovery copy is available.");
              return;
            }
            new RecoveryModal(plugin, record, refresh).open();
          },
          () => {},
        ),
    );
    const controls = container.createDiv({ cls: "firstdraft-scene-filters" });
    const search = controls.createEl("input", {
      type: "search",
      placeholder: "Find scenes or synopses",
    });
    search.value = filters.query;
    search.setAttribute("aria-label", "Find scenes or synopses");
    const selects: {
      key: "part" | "character" | "location" | "time";
      label: string;
      values: string[];
    }[] = [
      {
        key: "part",
        label: "All parts",
        values: workspace.files.map((file) => file.path),
      },
      {
        key: "character",
        label: "All characters",
        values: all.flatMap((scene) => scene.characters),
      },
      {
        key: "location",
        label: "All locations",
        values: all.map((scene) => scene.location),
      },
      {
        key: "time",
        label: "All times",
        values: all.map((scene) => scene.time),
      },
    ];
    const list = container.createDiv({ cls: "firstdraft-scene-list" });
    const renderList = (): void => {
      list.empty();
      const visible = filterScenes(all, filters);
      if (!visible.length)
        list.createEl("p", {
          text: all.length
            ? "No scenes match these filters."
            : "No scenes yet. Choose New scene to begin.",
        });
      list.createEl("p", {
        cls: "firstdraft-palette-muted",
        text: `${visible.length} of ${all.length} scenes · page positions are approximate`,
      });
      for (const scene of visible) {
        const file = workspace.files.find((item) => item.path === scene.path);
        if (!file) continue;
        const card = list.createDiv({ cls: "firstdraft-scene-card" });
        const active =
          scene.path === workspace.activePath &&
          workspace.activeLine >= scene.line &&
          (!file.scenes.find((item) => item.start > scene.start) ||
            workspace.activeLine <
              (file.scenes.find((item) => item.start > scene.start)?.line ??
                Infinity));
        if (active) card.addClass("is-active");
        const index = all.indexOf(scene);
        const heading = action(
          card,
          `${index + 1}. ${scene.heading}`,
          () => void report(() => jumpToScene(plugin, file, scene), refresh),
        );
        heading.addClass("firstdraft-scene-heading");
        if (active) heading.setAttribute("aria-current", "true");
        card.createEl("p", {
          cls: "firstdraft-palette-muted",
          text: `${scene.path} · ~p. ${scene.page.toFixed(1)}`,
        });
        if (scene.synopsis)
          card.createEl("p", {
            cls: "firstdraft-scene-synopsis",
            text: scene.synopsis,
          });
        if (scene.characters.length)
          card.createEl("p", {
            cls: "firstdraft-palette-muted",
            text: scene.characters.join(", "),
          });
        const buttons = card.createDiv({ cls: "firstdraft-scene-actions" });
        const disabled = !canWrite || Boolean(file.issue);
        action(
          buttons,
          "Synopsis",
          () =>
            new SceneEditModal(
              plugin,
              workspace,
              scene,
              "synopsis",
              refresh,
            ).open(),
          disabled,
        );
        const local = file.scenes.indexOf(scene);
        const shift = (offset: -1 | 1) =>
          void report(async () => {
            const target = file.scenes[local + offset];
            if (!target) return;
            await applySceneChanges(
              plugin,
              moveScene(
                file,
                scene,
                file,
                target,
                offset < 0 ? "before" : "after",
              ),
            );
          }, refresh);
        action(
          buttons,
          "Up",
          () => shift(-1),
          disabled ||
            local === 0 ||
            Boolean(
              filters.query ||
              filters.part ||
              filters.character ||
              filters.location ||
              filters.time,
            ),
        );
        action(
          buttons,
          "Down",
          () => shift(1),
          disabled ||
            local === file.scenes.length - 1 ||
            Boolean(
              filters.query ||
              filters.part ||
              filters.character ||
              filters.location ||
              filters.time,
            ),
        );
        action(
          buttons,
          "Move…",
          () =>
            new SceneEditModal(
              plugin,
              workspace,
              scene,
              "move",
              refresh,
            ).open(),
          disabled,
        );
      }
    };
    search.addEventListener("input", () => {
      filters.query = search.value;
      renderList();
    });
    for (const { key, label, values } of selects) {
      const select = controls.createEl("select");
      select.setAttribute("aria-label", label);
      select.createEl("option", { value: "", text: label });
      for (const value of [...new Set(values)].filter(Boolean))
        select.createEl("option", { value, text: value });
      if (!values.includes(filters[key])) filters[key] = "";
      select.value = filters[key];
      select.addEventListener("change", () => {
        filters[key] = select.value;
        renderList();
      });
    }
    action(controls, "Clear filters", () => {
      Object.assign(filters, EMPTY_SCENE_FILTERS);
      refresh();
    });
    renderList();
  } catch (error) {
    if (isCurrent())
      container.createEl("p", {
        text: error instanceof Error ? error.message : "Could not load scenes.",
      });
  }
}

class SceneEditModal extends Modal {
  private targetFile: SceneFile;
  private target: Scene | null = null;
  private position: "before" | "after" = "after";
  private heading = "INT. LOCATION - DAY";
  private synopsis = "";
  private submitting = false;
  constructor(
    private plugin: FirstDraftPlugin,
    private workspace: SceneWorkspace,
    private scene: Scene | null,
    private mode: "create" | "move" | "synopsis",
    private refresh: () => void,
  ) {
    super(plugin.app);
    this.targetFile =
      workspace.files.find((file) => file.path === scene?.path) ??
      workspace.files.find((file) => !file.issue) ??
      workspace.files[0];
    this.synopsis = mode === "synopsis" ? (scene?.synopsis ?? "") : "";
  }
  onOpen(): void {
    this.setTitle(
      this.mode === "create"
        ? "New scene"
        : this.mode === "move"
          ? "Move scene"
          : "Edit synopsis",
    );
    this.contentEl.empty();
    if (this.scene) {
      this.contentEl.createEl("p", { text: this.scene.heading });
      this.contentEl.createEl("p", { text: `Source: ${this.scene.path}` });
    }
    if (this.mode !== "synopsis") {
      new Setting(this.contentEl).setName("Part").addDropdown((dropdown) => {
        for (const file of this.workspace.files.filter((file) => !file.issue))
          dropdown.addOption(file.path, file.path);
        dropdown.setValue(this.targetFile.path).onChange((path) => {
          this.targetFile =
            this.workspace.files.find((file) => file.path === path) ??
            this.targetFile;
          this.target = null;
          this.onOpen();
        });
      });
      new Setting(this.contentEl)
        .setName("Destination scene")
        .addDropdown((dropdown) => {
          dropdown.addOption("end", "End of part");
          for (const [index, scene] of this.targetFile.scenes.entries())
            if (scene !== this.scene)
              dropdown.addOption(
                String(scene.start),
                `${index + 1}. ${scene.heading}`,
              );
          dropdown
            .setValue(this.target ? String(this.target.start) : "end")
            .onChange((start) => {
              this.target =
                this.targetFile.scenes.find(
                  (scene) => String(scene.start) === start,
                ) ?? null;
            });
        });
      new Setting(this.contentEl).setName("Position").addDropdown((dropdown) =>
        dropdown
          .addOption("before", "Before destination scene")
          .addOption("after", "After destination scene")
          .setValue(this.position)
          .onChange((value) => {
            this.position = value === "before" ? "before" : "after";
          }),
      );
    }
    if (this.mode === "create") {
      new Setting(this.contentEl)
        .setName("Suggested scene type")
        .addDropdown((dropdown) => {
          for (const type of this.plugin.settings.preferredSceneTypes)
            dropdown.addOption(type, type);
          dropdown.setValue(
            parseSceneHeadingParts(this.heading)?.type ?? "INT.",
          );
          dropdown.onChange((type) => {
            const current = parseSceneHeadingParts(this.heading);
            this.heading = `${type} ${current?.location ?? "LOCATION"} - ${current?.timeOfDay ?? "DAY"}`;
            this.onOpen();
          });
        });
      new Setting(this.contentEl)
        .setName("Suggested location")
        .addDropdown((dropdown) => {
          dropdown.addOption("", "Choose or type in the heading");
          for (const location of [
            ...new Set(
              this.workspace.files.flatMap((file) =>
                file.scenes.map((scene) => scene.location),
              ),
            ),
          ].filter(Boolean))
            dropdown.addOption(location, location);
          dropdown.setValue(
            parseSceneHeadingParts(this.heading)?.location ?? "",
          );
          dropdown.onChange((location) => {
            if (location) {
              const current = parseSceneHeadingParts(this.heading);
              this.heading = `${current?.type ?? "INT."} ${location} - ${current?.timeOfDay ?? "DAY"}`;
              this.onOpen();
            }
          });
        });
      new Setting(this.contentEl)
        .setName("Suggested time")
        .addDropdown((dropdown) => {
          dropdown.addOption("", "Choose or type in the heading");
          for (const time of [
            ...new Set([
              ...this.plugin.settings.preferredTimesOfDay,
              ...this.workspace.files.flatMap((file) =>
                file.scenes.map((scene) => scene.time),
              ),
            ]),
          ].filter(Boolean))
            dropdown.addOption(time, time);
          dropdown.setValue(
            parseSceneHeadingParts(this.heading)?.timeOfDay ?? "",
          );
          dropdown.onChange((time) => {
            if (time) {
              const current = parseSceneHeadingParts(this.heading);
              this.heading = `${current?.type ?? "INT."} ${current?.location ?? "LOCATION"} - ${time}`;
              this.onOpen();
            }
          });
        });
      new Setting(this.contentEl).setName("Scene heading").addText((text) =>
        text.setValue(this.heading).onChange((value) => {
          this.heading = value;
        }),
      );
    }
    if (this.mode !== "move")
      new Setting(this.contentEl)
        .setName("Synopsis (optional)")
        .addTextArea((text) =>
          text.setValue(this.synopsis).onChange((value) => {
            this.synopsis = value;
          }),
        );
    if (this.mode === "move")
      this.contentEl.createEl("p", {
        text: "Confirm the destination before moving. Cross-file moves save a local recovery copy; save both notes first. A new cross-file move replaces the previous recovery copy.",
      });
    const error = this.contentEl.createEl("p", {
      cls: "firstdraft-scene-warning",
    });
    const button = action(
      this.contentEl,
      this.mode === "move" ? "Confirm move" : "Save",
      () => {
        if (this.submitting) return;
        this.submitting = true;
        button.disabled = true;
        void this.submit()
          .then(() => {
            this.close();
            this.refresh();
          })
          .catch((problem: unknown) => {
            error.setText(
              problem instanceof Error
                ? problem.message
                : "Scene operation failed.",
            );
            this.submitting = false;
            button.disabled = false;
          });
      },
    );
  }
  private async submit(): Promise<void> {
    if (this.mode === "synopsis" && this.scene) {
      await applySceneChanges(this.plugin, [
        editSynopsis(this.targetFile, this.scene, this.synopsis),
      ]);
      return;
    }
    if (this.mode === "move" && this.scene) {
      const source = this.workspace.files.find(
        (file) => file.path === this.scene?.path,
      );
      if (!source) throw new Error("The source part is unavailable.");
      await applySceneChanges(
        this.plugin,
        moveScene(
          source,
          this.scene,
          this.targetFile,
          this.target,
          this.position,
        ),
      );
      return;
    }
    const change = createScene(
      this.targetFile,
      this.heading,
      this.synopsis,
      this.target,
      this.position,
    );
    await applySceneChanges(this.plugin, [change]);
    const updated = sceneFile(
      change.path,
      change.after,
      this.plugin.settings.pageSize,
    );
    const inserted = updated.scenes.find(
      (scene) => scene.start === change.focus,
    );
    if (inserted) {
      await jumpToScene(this.plugin, updated, inserted);
      const editor =
        this.plugin.app.workspace.getActiveViewOfType(MarkdownView)?.editor;
      if (editor) {
        const line =
          inserted.line +
          1 +
          (this.synopsis.trim()
            ? this.synopsis.trim().split(/\r?\n/u).length
            : 0);
        editor.setCursor({ line, ch: 0 });
        editor.focus();
      }
    }
  }
}

class RecoveryModal extends Modal {
  constructor(
    private plugin: FirstDraftPlugin,
    private record: SceneRecovery,
    private refresh: () => void,
  ) {
    super(plugin.app);
  }
  onOpen(): void {
    this.setTitle("Restore last scene move");
    this.contentEl.createEl("p", {
      text: "Restore the pre-move contents of these files? Restore stops if either file contains later edits. The recovery copy stays local in plugin configuration.",
    });
    for (const change of this.record.changes)
      this.contentEl.createEl("p", { text: change.path });
    const details = this.contentEl.createEl("details");
    details.createEl("summary", { text: "Preview affected file changes" });
    for (const change of this.record.changes) {
      details.createEl("h4", { text: change.path });
      details.createEl("p", { text: "Restore this pre-move text:" });
      details.createEl("pre", { text: change.before });
    }
    const button = action(this.contentEl, "Confirm restore", () => {
      button.disabled = true;
      void report(async () => {
        await restoreLastSceneMove(this.plugin, this.record);
        this.close();
        new Notice("Pre-move screenplay contents restored.");
      }, this.refresh).finally(() => {
        button.disabled = false;
      });
    });
  }
}
