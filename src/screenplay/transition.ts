const STANDARD_TRANSITION = /(?:TO:|FADE IN:|FADE OUT\.)$/u;

export function normalizeTransition(value: string): string {
  const text = value.trim().replaceAll("\n", " ");
  if (!text) return "";
  if (text.startsWith(">")) return text;

  const uppercase = text.toLocaleUpperCase();
  return STANDARD_TRANSITION.test(uppercase) ? uppercase : `>${text}`;
}
