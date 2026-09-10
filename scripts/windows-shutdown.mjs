// vinext calls process.exit(0) immediately after static prerendering. On Windows,
// Node 24 can hit a libuv close race while those handles are still settling.
// Let successful builds drain normally. Nonzero exits retain their behavior.
if (process.platform === 'win32') {
  const exit = process.exit.bind(process);
  process.exit = (code) => {
    if ((code === undefined || Number(code) === 0) && !process.exitCode) {
      process.exitCode = 0;
      return;
    }
    return exit(code ?? process.exitCode);
  };
}
