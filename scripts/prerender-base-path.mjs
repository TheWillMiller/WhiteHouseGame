// vinext beta.5 renders '/' without its configured basePath during export.
// Correct only the loopback root render request; internal endpoints are untouched.
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  if (process.env.VINEXT_PRERENDER === '1' && process.env.GAME_BASE_PATH && typeof input === 'string') {
    const url = new URL(input);
    if (url.hostname === '127.0.0.1' && url.pathname === '/') {
      url.pathname = process.env.GAME_BASE_PATH + '/';
      return originalFetch(url, init);
    }
  }
  return originalFetch(input, init);
};
