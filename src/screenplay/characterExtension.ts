import { isSceneHeading } from "./parser";

const HAS_LETTER = /\p{L}/u;
const LOWERCASE_LETTER = /\p{Ll}/u;
const STANDARD_TRANSITION = /(?:TO:|FADE IN:|FADE OUT\.)$/u;

export function characterNameFromCue(line: string): string | null {
  if (!isLikelyCharacterCue(line)) return null;
  return line
    .trim()
    .replace(/^@/u, "")
    .replace(/\s*\^\s*$/u, "")
    .replace(/\s+\([^)]*\)\s*$/u, "")
    .trim()
    .toLocaleUpperCase();
}

export function isLikelyCharacterCue(line: string): boolean {
  const text = line.trim();
  const forced = text.startsWith("@");
  const candidate = text
    .replace(/^@/u, "")
    .replace(/\s*\^\s*$/u, "")
    .replace(/\s+\([^)]*\)\s*$/u, "")
    .trim();
  return (
    Boolean(candidate) &&
    HAS_LETTER.test(candidate) &&
    !isSceneHeading(candidate) &&
    !text.startsWith(">") &&
    !STANDARD_TRANSITION.test(candidate) &&
    (forced || !LOWERCASE_LETTER.test(candidate))
  );
}

export function withCharacterExtension(
  line: string,
  extension: string,
): string {
  const indentation = line.match(/^\s*/u)?.[0] ?? "";
  const trimmed = line.trim();
  const caret = /\s*\^\s*$/u.test(trimmed) ? " ^" : "";
  const cue = trimmed
    .replace(/\s*\^\s*$/u, "")
    .replace(/\s+\([^)]*\)\s*$/u, "")
    .trim();
  return `${indentation}${cue} ${extension}${caret}`;
}
