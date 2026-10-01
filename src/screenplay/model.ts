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

export type ScreenplayElementType =
  | "scene-heading"
  | "action"
  | "character"
  | "dialogue"
  | "parenthetical"
  | "transition";

export interface ScreenplayElement {
  type: ScreenplayElementType;
  text: string;
  line: number;
  characterExtension?: string;
}

export interface ScreenplayDocument {
  elements: ScreenplayElement[];
  blankLines: number;
  titlePage?: ScreenplayTitlePage;
}

export interface ScreenplayTitlePage {
  title: string;
  credit?: string;
  author?: string;
  source?: string;
  draftDate?: string;
  contact?: string;
}

export type PageSize = "us-letter" | "a4";

export interface PageEstimate {
  pages: number;
  formattedLines: number;
}

export interface PageEstimationOptions {
  pageSize: PageSize;
}

export interface PageEstimator {
  estimate(
    document: ScreenplayDocument,
    options: PageEstimationOptions,
  ): PageEstimate;
}

export interface CharacterUsage {
  name: string;
  dialogueBlocks: number;
}

export interface Usage {
  value: string;
  count: number;
  lastUsedPosition: number;
}

export interface ScreenplayIndex {
  characters: Usage[];
  locations: Usage[];
  timesOfDay: Usage[];
  parentheticals: Usage[];
  transitions: Usage[];
}

export interface ScreenplayStatistics {
  scenes: number;
  words: number;
  characters: CharacterUsage[];
  locations: string[];
  dialogueBlocks: number;
  actionBlocks: number;
  estimatedPages: number;
  estimatedRuntimeMinutes: number;
}
