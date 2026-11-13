export function docHref(id: string) {
  return id === 'index' ? '/docs/' : `/docs/${id}/`;
}
