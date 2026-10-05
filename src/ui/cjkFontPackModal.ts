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
import { CJK_FONT_FILES, installCjkFontPack } from "../export/cjkFontPack";

const installing = new WeakSet<FirstDraftPlugin>();

export class CjkFontPackModal extends Modal {
  constructor(private readonly plugin: FirstDraftPlugin) {
    super(plugin.app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.createEl("h2", { text: "Install offline CJK PDF fonts" });
    contentEl.createEl("p", {
      text: "Optional fonts for Chinese, Japanese and Korean PDF export. Select both official WOFF files from your device. No fonts or screenplay text are downloaded or uploaded by the plugin.",
    });
    const instructions = contentEl.createEl("a", {
      text: "Font files, licence and installation instructions",
      href: "https://github.com/grobmeier/firstdraft/blob/main/docs/CJK_FONT_PACK.md",
    });
    instructions.setAttribute("target", "_blank");
    instructions.setAttribute("rel", "noopener noreferrer");
    contentEl.createEl("p", {
      text: "Install on each device that needs CJK PDF export. The files are checked against the official hashes and stored in chunks below 5 MB. Auxiliary plugin-file sync is not guaranteed.",
    });
    const input = contentEl.createEl("input", { type: "file" });
    input.multiple = true;
    input.accept = ".woff";
    input.setAttribute("aria-label", "Select regular and bold CJK fonts");
    const status = contentEl.createEl("p", {
      text: "Choose NotoSansCJK-Regular.woff and NotoSansCJK-Bold.woff.",
    });
    status.setAttribute("role", "status");
    const button = contentEl.createEl("button", {
      text: "Install selected fonts",
      cls: "mod-cta",
    });
    button.addEventListener("click", () => {
      void this.install(input, button, status);
    });
  }

  private async install(
    input: HTMLInputElement,
    button: HTMLButtonElement,
    status: HTMLElement,
  ): Promise<void> {
    if (installing.has(this.plugin)) return;
    const files = Array.from(input.files ?? []);
    const regular = files.find(
      (file) => file.name === CJK_FONT_FILES.regular.name,
    );
    const bold = files.find((file) => file.name === CJK_FONT_FILES.bold.name);
    if (
      files.length !== 2 ||
      regular?.size !== CJK_FONT_FILES.regular.size ||
      bold?.size !== CJK_FONT_FILES.bold.size
    ) {
      status.setText(
        "Select exactly the official regular and bold WOFF files. Nothing was installed.",
      );
      return;
    }
    installing.add(this.plugin);
    button.disabled = true;
    input.disabled = true;
    status.setText("Validating and installing fonts…");
    try {
      await installCjkFontPack(
        this.plugin.app.vault.adapter,
        this.plugin.manifest.dir ?? "",
        {
          regular: new Uint8Array(await regular.arrayBuffer()),
          bold: new Uint8Array(await bold.arrayBuffer()),
        },
      );
      status.setText(
        "Offline CJK fonts installed. You can now export CJK PDFs on this device.",
      );
      new Notice("Offline CJK PDF fonts installed.");
    } catch {
      status.setText(
        "Could not install the fonts. Check the official files and available storage, then retry. A partial pack cannot be used for PDF export.",
      );
    } finally {
      installing.delete(this.plugin);
      button.disabled = false;
      input.disabled = false;
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
