// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function setDeep(obj: unknown, path: string, value: unknown): any {
  const parts = path.split('.');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const out = structuredClone((obj || {}) as any);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let current: any = out;
  for (let index = 0; index < parts.length - 1; index++) current = current[parts[index]!] ||= {};
  current[parts[parts.length - 1]!] = value;
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getDeep(obj: unknown, path: string, fallback: any = ''): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return path.split('.').reduce((accumulator: any, key) => accumulator?.[key], obj) ?? fallback;
}
