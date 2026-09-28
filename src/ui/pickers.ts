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

import {
  FuzzySuggestModal,
  Modal,
  Setting,
  TextComponent,
  type App,
} from "obsidian";

export interface PickerOptions<T> {
  title: string;
  placeholder: string;
  items: readonly T[];
  itemText: (item: T) => string;
  onChoose: (item: T) => void;
}

export class PickerModal<T> extends FuzzySuggestModal<T> {
  constructor(
    app: App,
    private readonly options: PickerOptions<T>,
  ) {
    super(app);
    this.setTitle(options.title);
    this.setPlaceholder(options.placeholder);
  }

  getItems(): T[] {
    return [...this.options.items];
  }

  getItemText(item: T): string {
    return this.options.itemText(item);
  }

  onChooseItem(item: T): void {
    this.options.onChoose(item);
  }
}

export class TextInputModal extends Modal {
  private value = "";

  constructor(
    app: App,
    private readonly heading: string,
    private readonly placeholder: string,
    private readonly onSubmit: (value: string) => void,
  ) {
    super(app);
  }

  onOpen(): void {
    this.setTitle(this.heading);
    const input = new TextComponent(this.contentEl)
      .setPlaceholder(this.placeholder)
      .onChange((value) => {
        this.value = value;
      });
    input.inputEl.addClass("firstdraft-prompt-input");
    input.inputEl.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.isComposing) {
        event.preventDefault();
        this.submit();
      }
    });

    new Setting(this.contentEl).addButton((button) =>
      button
        .setButtonText("Insert")
        .setCta()
        .onClick(() => this.submit()),
    );
    window.setTimeout(() => input.inputEl.focus());
  }

  private submit(): void {
    const value = this.value.trim();
    if (!value) return;
    this.close();
    this.onSubmit(value);
  }
}
