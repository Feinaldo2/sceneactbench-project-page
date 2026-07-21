export function withBase(path: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith('data:')) return path;
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
