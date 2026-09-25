import { Modal } from "obsidian";
import type { App } from "obsidian";
import type { ScreenplayStatistics } from "../screenplay/model";
import {
  formatEstimatedPages,
  formatEstimatedRuntime,
} from "../screenplay/status";

interface StatisticRow {
  label: string;
  value: string;
}

function statisticRows(statistics: ScreenplayStatistics): StatisticRow[] {
  return [
    {
      label: "Estimated pages",
      value: formatEstimatedPages(statistics.estimatedPages),
    },
    {
      label: "Estimated runtime",
      value: `~${formatEstimatedRuntime(statistics.estimatedRuntimeMinutes)} min`,
    },
    { label: "Scenes", value: statistics.scenes.toString() },
    { label: "Words", value: statistics.words.toLocaleString() },
    {
      label: "Characters discovered",
      value: statistics.characters.length.toString(),
    },
    {
      label: "Locations discovered",
      value: statistics.locations.length.toString(),
    },
    { label: "Dialogue blocks", value: statistics.dialogueBlocks.toString() },
    { label: "Action blocks", value: statistics.actionBlocks.toString() },
  ];
}

export class StatisticsModal extends Modal {
  constructor(
    app: App,
    private readonly statistics: ScreenplayStatistics,
  ) {
    super(app);
  }

  onOpen(): void {
    const { contentEl } = this;
    contentEl.addClass("firstdraft-statistics");
    contentEl.createEl("h2", { text: "Screenplay Statistics" });

    const summary = contentEl.createEl("dl", {
      cls: "firstdraft-statistics-summary",
    });
    for (const row of statisticRows(this.statistics)) {
      summary.createEl("dt", { text: row.label });
      summary.createEl("dd", { text: row.value });
    }

    if (this.statistics.characters.length > 0) {
      contentEl.createEl("h3", { text: "Dialogue by Character" });
      const table = contentEl.createEl("table", {
        cls: "firstdraft-character-statistics",
      });
      const header = table.createEl("thead").createEl("tr");
      header.createEl("th", { text: "Character" });
      header.createEl("th", { text: "Dialogue blocks" });
      const body = table.createEl("tbody");

      for (const character of this.statistics.characters) {
        const row = body.createEl("tr");
        row.createEl("td", { text: character.name });
        row.createEl("td", { text: character.dialogueBlocks.toString() });
      }
    }
  }

  onClose(): void {
    this.contentEl.empty();
  }
}
