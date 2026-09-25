export function estimateRuntimeMinutes(
  estimatedPages: number,
  minutesPerPage = 1,
): number {
  const safeRatio = Number.isFinite(minutesPerPage)
    ? Math.max(0, minutesPerPage)
    : 1;
  return estimatedPages * safeRatio;
}
