/**
 * @file An adapter for running Mimo in a web browser environment.
 * It provides browser-compatible implementations for system interactions.
 * File system operations are disabled and will throw errors.
 */

function fsUnavailable() {
  throw new Error(
    "File system access is not available in the browser environment.",
  );
}

const baseBrowserAdapter = {
  // --- File System (Disabled by default) ---
  readFileSync: fsUnavailable,
  readdirSync: fsUnavailable,
  existsSync: () => false, // Always return false, as no real file system exists
  writeFileSync: fsUnavailable,
  mkdirSync: fsUnavailable,
  unlinkSync: fsUnavailable,
  rmdirSync: fsUnavailable,
  rmSync: fsUnavailable,

  // --- Path (Simplified for URL/string-based paths) ---
  resolvePath: (...segments) => segments.join("/").replace(/\/+/g, "/"),
  dirname: (filePath) => {
    const lastSlash = filePath.lastIndexOf("/");
    return lastSlash === -1 ? "." : filePath.substring(0, lastSlash);
  },
  isAbsolutePath: (filePath) => filePath.startsWith("/"),
  joinPath: (...segments) => segments.join("/"),
  basename: (filePath) => {
    const lastSlash = filePath.lastIndexOf("/");
    return filePath.substring(lastSlash + 1);
  },

  // http
  fetchSync: (url, options = {}) => {
    try {
      const xhr = new XMLHttpRequest();
      // The 3rd argument 'false' makes the request Synchronous
      xhr.open(options.method || "GET", url, false);

      if (options.headers) {
        for (const [key, value] of Object.entries(options.headers)) {
          xhr.setRequestHeader(key, value);
        }
      }

      xhr.send(options.body || null);

      return {
        status: xhr.status,
        body: xhr.responseText,
      };
    } catch (e) {
      throw new Error("HTTP request failed: " + e.message);
    }
  },

  // --- Process (Mocked) ---
  getArguments: () => [], // No command-line arguments in the browser
  getEnvVariable: () => null, // No environment variables
  exit: (code) => {
    console.warn(
      `Mimo script called exit(${code}), but exit is disabled in the browser.`,
    );
  },
  cwd: () => "/", // The "root" in a browser context

  // --- Console (Direct Mapping) ---
  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),
};

export function createBrowserAdapter(overrides = {}) {
  return { ...baseBrowserAdapter, ...overrides };
}

export const browserAdapter = createBrowserAdapter();
