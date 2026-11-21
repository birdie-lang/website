export const docSections = {
  guide: 'Guide',
  specification: 'Specification',
  project: 'Project',
} as const;

export function docHref(id: string) {
  return id === 'index' ? '/docs/' : `/docs/${id}/`;
}
