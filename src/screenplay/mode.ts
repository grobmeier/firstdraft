export interface ScreenplayModeSettings {
  activateFountainFiles: boolean;
  activateFrontmatter: boolean;
}

export interface FileLike {
  extension: string;
}

export function isScreenplayMode(
  file: FileLike | null,
  frontmatter: Record<string, unknown> | undefined,
  settings: ScreenplayModeSettings,
): boolean {
  if (file === null) return false;
  if (
    settings.activateFountainFiles &&
    file.extension.toLocaleLowerCase() === "fountain"
  ) {
    return true;
  }

  return settings.activateFrontmatter && frontmatter?.screenplay === true;
}
