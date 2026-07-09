export function setDeep(obj: any, path: string, value: any): any {
  const parts = path.split('.')
  const out = structuredClone(obj || {})
  let current = out
  for (let index = 0; index < parts.length - 1; index++) current = current[parts[index]] ||= {}
  current[parts.at(-1)!] = value
  return out
}

export function getDeep(obj: any, path: string, fallback: any = ''): any {
  return path.split('.').reduce((accumulator, key) => accumulator?.[key], obj) ?? fallback
}
