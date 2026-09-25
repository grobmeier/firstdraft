import {
  acceptCompletion,
  autocompletion,
  pickedCompletion,
  type Completion,
  type CompletionContext,
  type CompletionResult,
} from "@codemirror/autocomplete";
import { EditorState, Prec, type Extension } from "@codemirror/state";
import { keymap, type EditorView } from "@codemirror/view";
import { editorInfoField } from "obsidian";
import type FirstDraftPlugin from "../main";
import {
  getScreenplayCompletionPlan,
  type CompletionCandidate,
} from "./completionEngine";

function applyCandidate(
  view: EditorView,
  completion: Completion,
  from: number,
  to: number,
  candidate: CompletionCandidate,
): void {
  view.dispatch({
    changes: { from, to, insert: candidate.applyText },
    selection: { anchor: from + candidate.applyText.length },
    annotations: pickedCompletion.of(completion),
  });
}

export function createScreenplayCompletionExtension(
  plugin: FirstDraftPlugin,
): Extension {
  const source = (context: CompletionContext): CompletionResult | null => {
    const info = context.state.field(editorInfoField, false);
    if (
      !plugin.settings.autocompleteEnabled ||
      !plugin.isScreenplayFile(info?.file ?? null)
    ) {
      return null;
    }

    const plan = getScreenplayCompletionPlan(
      context.state.doc.toString(),
      context.pos,
      plugin.settings,
      context.explicit,
    );
    if (!plan) return null;

    return {
      from: plan.from,
      to: plan.to,
      filter: false,
      options: plan.candidates.map((candidate) => ({
        label: candidate.label,
        detail: candidate.detail,
        apply: (view, completion, from, to) =>
          applyCandidate(view, completion, from, to, candidate),
      })),
    };
  };

  return [
    autocompletion({
      activateOnTyping: true,
      activateOnCompletion: (completion) => completion.detail === "Location",
      maxRenderedOptions: 20,
    }),
    EditorState.languageData.of(() => [{ autocomplete: source }]),
    Prec.highest(keymap.of([{ key: "Tab", run: acceptCompletion }])),
  ];
}
