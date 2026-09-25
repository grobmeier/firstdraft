import type {
  ScreenplayDocument,
  ScreenplayElement,
  ScreenplayElementType,
} from "./model";

const SCENE_HEADING = /^(?:INT|EXT|EST|INT\.\/EXT|INT\/EXT|I\/E)(?:\.|\s)/iu;
const HAS_LETTER = /\p{L}/u;
const UPPERCASE_LETTER = /\p{Lu}/u;
const LOWERCASE_LETTER = /\p{Ll}/u;

function withoutFrontmatter(source: string): string {
  const lines = source.replaceAll("\r\n", "\n").split("\n");
  if (lines[0]?.trim() !== "---") return lines.join("\n");

  const closingIndex = lines.findIndex(
    (line, index) => index > 0 && line.trim() === "---",
  );
  return closingIndex === -1
    ? lines.join("\n")
    : lines.slice(closingIndex + 1).join("\n");
}

export function isSceneHeading(line: string): boolean {
  const text = line.trim();
  if (text.startsWith("!")) return false;
  return /^\.[\p{L}\p{N}]/u.test(text) || SCENE_HEADING.test(text);
}

function isTransition(
  line: string,
  beforeBlank: boolean,
  afterBlank: boolean,
): boolean {
  const text = line.trim();
  if (text.startsWith(">") && !text.endsWith("<")) return true;
  return (
    beforeBlank &&
    afterBlank &&
    text.endsWith("TO:") &&
    UPPERCASE_LETTER.test(text) &&
    !LOWERCASE_LETTER.test(text)
  );
}

function characterName(line: string): string | null {
  const text = line.trim();
  const forced = text.startsWith("@");
  const candidate = forced ? text.slice(1).trim() : text;
  if (!candidate || isSceneHeading(candidate) || !HAS_LETTER.test(candidate))
    return null;
  if (!forced && LOWERCASE_LETTER.test(candidate)) return null;
  if (!forced && !UPPERCASE_LETTER.test(candidate)) return null;

  return candidate
    .replace(/\s*\^\s*$/u, "")
    .replace(/\s+\([^)]*\)\s*$/u, "")
    .trim();
}

function pushElement(
  elements: ScreenplayElement[],
  type: ScreenplayElementType,
  text: string,
  line: number,
): void {
  elements.push({ type, text, line });
}

export function parseFountain(source: string): ScreenplayDocument {
  const lines = withoutFrontmatter(source).split("\n");
  const elements: ScreenplayElement[] = [];
  let blankLines = 0;
  let inDialogue = false;

  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index] ?? "";
    const text = raw.trim();
    const beforeBlank = index === 0 || (lines[index - 1]?.trim() ?? "") === "";
    const afterBlank =
      index === lines.length - 1 || (lines[index + 1]?.trim() ?? "") === "";

    if (text === "") {
      blankLines += 1;
      inDialogue = false;
      continue;
    }

    if (isSceneHeading(text)) {
      pushElement(elements, "scene-heading", text, index + 1);
      inDialogue = false;
      continue;
    }

    if (isTransition(text, beforeBlank, afterBlank)) {
      pushElement(elements, "transition", text, index + 1);
      inDialogue = false;
      continue;
    }

    if (inDialogue && text.startsWith("(") && text.endsWith(")")) {
      pushElement(elements, "parenthetical", text, index + 1);
      continue;
    }

    if (inDialogue) {
      pushElement(elements, "dialogue", text, index + 1);
      continue;
    }

    const name = beforeBlank && !afterBlank ? characterName(text) : null;
    if (name !== null) {
      pushElement(elements, "character", name, index + 1);
      inDialogue = true;
      continue;
    }

    pushElement(elements, "action", raw, index + 1);
  }

  return { elements, blankLines };
}
