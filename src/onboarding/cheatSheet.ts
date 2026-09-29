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

export interface CheatSheetEntry {
  term: string;
  explanation: string;
  example?: string;
}

export interface CheatSheetSection {
  title: string;
  introduction: string;
  entries: CheatSheetEntry[];
}

export const CHEAT_SHEET_SECTIONS: CheatSheetSection[] = [
  {
    title: "Screenplay terms",
    introduction: "Common terms used when describing a screenplay.",
    entries: [
      {
        term: "Scene heading / slugline",
        explanation:
          "Starts a scene and names whether it is inside or outside, the location, and usually the time.",
        example: "INT. KITCHEN - DAY",
      },
      {
        term: "INT. / EXT.",
        explanation:
          "Interior or exterior. Use INT./EXT. when a scene genuinely spans both.",
        example: "EXT. RIVERSIDE PLATFORM - NIGHT",
      },
      {
        term: "Action",
        explanation:
          "What the audience can see or hear, written as an ordinary line.",
        example: "Rain silver-coats the empty tracks.",
      },
      {
        term: "Character cue",
        explanation: "The speaking character's name in uppercase.",
        example: "MARA",
      },
      {
        term: "Dialogue",
        explanation: "Words spoken directly below a character cue.",
        example: "MARA\nThis is the last train.",
      },
      {
        term: "Parenthetical",
        explanation:
          "A short delivery or action note directly below the character cue.",
        example: "MARA\n(quietly)\nWe have to go.",
      },
      {
        term: "Transition",
        explanation:
          "A change between shots or scenes, conventionally uppercase.",
        example: "CUT TO:",
      },
      {
        term: "V.O.",
        explanation:
          "Voice-over: the voice is heard, but the character is not speaking in the scene.",
        example: "MARA (V.O.)",
      },
      {
        term: "O.S.",
        explanation:
          "Off-screen: the character is present in the scene but outside the frame.",
        example: "ELIAS (O.S.)",
      },
    ],
  },
  {
    title: "Fountain quick syntax",
    introduction:
      "These are the six core element types First Draft recognises and exports to FDX.",
    entries: [
      {
        term: "Scene heading",
        explanation: "Begin with INT., EXT., or INT./EXT.",
        example: "INT. LAST TRAIN - NIGHT",
      },
      {
        term: "Action",
        explanation: "Write a normal sentence between blank lines.",
        example: "The doors wait open.",
      },
      {
        term: "Character",
        explanation: "Write the cue in uppercase on its own line.",
        example: "MARA",
      },
      {
        term: "Parenthetical",
        explanation: "Put a brief direction in parentheses below the cue.",
        example: "(after a beat)",
      },
      {
        term: "Dialogue",
        explanation: "Write speech directly below its cue or parenthetical.",
        example: "MARA\n(after a beat)\nAll right.",
      },
      {
        term: "Transition",
        explanation: "Use an uppercase transition ending in TO:.",
        example: "SMASH CUT TO:",
      },
    ],
  },
  {
    title: "First Draft terms",
    introduction: "How First Draft organises portable screenplay material.",
    entries: [
      {
        term: "Screenplay mode",
        explanation:
          "A .fountain file, or a Markdown note with screenplay: true in its properties.",
      },
      {
        term: "Project note",
        explanation:
          "A Markdown note that owns the title and ordered list of screenplay parts.",
      },
      {
        term: "Part",
        explanation:
          "One screenplay file in a project's explicit reading order, such as a chapter or act. A screenplay-project property can link back when the part lives elsewhere.",
      },
      {
        term: "Character dossier",
        explanation:
          "A normal Markdown note for background, relationships, voice, and continuity notes.",
      },
      {
        term: "Project-local character folder",
        explanation:
          "The Characters folder beside a project note, optionally changed with character-folder.",
      },
    ],
  },
];
