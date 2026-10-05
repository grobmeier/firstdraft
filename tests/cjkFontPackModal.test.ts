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

import { beforeEach, describe, expect, it, vi } from "vitest";
import type FirstDraftPlugin from "../src/main";
import { CjkFontPackModal } from "../src/ui/cjkFontPackModal";
import { CJK_FONT_FILES, installCjkFontPack } from "../src/export/cjkFontPack";
import type * as FontPackModule from "../src/export/cjkFontPack";

const ui = vi.hoisted(() => ({
  elements: [] as Array<{
    tag: string;
    text?: string;
    files?: unknown[];
    disabled?: boolean;
    handler?: () => void;
    setText: (text: string) => void;
  }>,
}));
vi.mock("obsidian", () => ({
  Notice: vi.fn(),
  Modal: class {
    contentEl = {
      empty: vi.fn(),
      createEl: (tag: string, options: { text?: string } = {}) => {
        const element = {
          tag,
          text: options.text,
          files: [] as unknown[],
          disabled: false,
          handler: undefined as (() => void) | undefined,
          setAttribute: vi.fn(),
          setText(text: string) {
            this.text = text;
          },
          addEventListener(_name: string, handler: () => void) {
            this.handler = handler;
          },
        };
        ui.elements.push(element);
        return element;
      },
    };
  },
}));
vi.mock("../src/export/cjkFontPack", async (importOriginal) => ({
  ...(await importOriginal<typeof FontPackModule>()),
  installCjkFontPack: vi.fn(),
}));

function render() {
  const adapter = {};
  const modal = new CjkFontPackModal({
    app: { vault: { adapter } },
    manifest: { dir: "custom/plugins/firstdraft" },
  } as unknown as FirstDraftPlugin);
  modal.onOpen();
  const input = ui.elements.find((element) => element.tag === "input")!;
  const button = ui.elements.find((element) => element.tag === "button")!;
  const status = ui.elements.find((element) =>
    element.text?.startsWith("Choose NotoSans"),
  )!;
  return { input, button, status, adapter };
}

function selected() {
  return Object.values(CJK_FONT_FILES).map((file) => ({
    name: file.name,
    size: Number(file.size),
    arrayBuffer: vi.fn(async () => new ArrayBuffer(1)),
  }));
}

describe("font-pack file picker", () => {
  beforeEach(() => {
    ui.elements.length = 0;
    vi.clearAllMocks();
  });

  it("does nothing when selection is cancelled or incomplete", () => {
    const f = render();
    f.button.handler!();
    expect(f.status.text).toContain("Select exactly");
    expect(installCjkFontPack).not.toHaveBeenCalled();
    f.input.files = selected().slice(0, 1);
    f.button.handler!();
    expect(installCjkFontPack).not.toHaveBeenCalled();
  });

  it("rejects wrong-sized files without reading them", () => {
    const f = render();
    const files = selected();
    files[0].size = 1;
    f.input.files = files;
    f.button.handler!();
    expect(files[0].arrayBuffer).not.toHaveBeenCalled();
    expect(installCjkFontPack).not.toHaveBeenCalled();
  });

  it("installs both selected files under the registered plugin directory", async () => {
    vi.mocked(installCjkFontPack).mockResolvedValue(undefined);
    const f = render();
    f.input.files = selected();
    f.button.handler!();
    expect(f.button.disabled).toBe(true);
    await vi.waitFor(() =>
      expect(f.status.text).toContain("Offline CJK fonts installed"),
    );
    expect(installCjkFontPack).toHaveBeenCalledWith(
      f.adapter,
      "custom/plugins/firstdraft",
      { regular: new Uint8Array(1), bold: new Uint8Array(1) },
    );
    expect(f.button.disabled).toBe(false);
  });

  it("allows retry after storage or validation failure", async () => {
    vi.mocked(installCjkFontPack).mockRejectedValueOnce(
      new Error("Storage full"),
    );
    const f = render();
    f.input.files = selected();
    f.button.handler!();
    await vi.waitFor(() =>
      expect(f.status.text).toContain("Could not install"),
    );
    expect(f.input.disabled).toBe(false);
    expect(f.button.disabled).toBe(false);
    vi.mocked(installCjkFontPack).mockResolvedValue(undefined);
    f.button.handler!();
    await vi.waitFor(() =>
      expect(f.status.text).toContain("Offline CJK fonts installed"),
    );
  });
});
