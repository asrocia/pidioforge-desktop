export function isRoute(req, url, method, pathname) {
  return req.method === method && url.pathname === pathname;
}

export function matchRoute(req, url, method, pattern) {
  if (req.method !== method) return null;
  return url.pathname.match(pattern);
}
