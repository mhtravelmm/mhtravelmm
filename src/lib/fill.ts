/**
 * Replaces `{name}` placeholders, so one key can serve every count or title.
 * Kept out of `i18n.tsx` so that file only exports its component and hook.
 */
export function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in values ? String(values[name]) : match,
  );
}
