import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
export const nodeAdapter = {
  readFileSync: (filePath, encoding = "utf-8") =>
    fs.readFileSync(filePath, encoding),

  readdirSync: (filePath) => fs.readdirSync(filePath),

  existsSync: (filePath) => fs.existsSync(filePath),

  writeFileSync: (filePath, data, encoding = "utf-8") =>
    fs.writeFileSync(filePath, data, encoding),

  mkdirSync: (filePath, options) => {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(filePath, options);
    }
  },
  unlinkSync: (filePath) => fs.unlinkSync(filePath),
  rmdirSync: (filePath) => fs.rmdirSync(filePath),

  rmSync: (filePath, options) => fs.rmSync(filePath, options),

  resolvePath: (...segments) => path.resolve(...segments),

  dirname: (filePath) => path.dirname(filePath),

  isAbsolutePath: (filePath) => path.isAbsolute(filePath),

  joinPath: (...segments) => path.join(...segments),

  basename: (filePath, ext) => path.basename(filePath, ext),

  getArguments: () => process.argv.slice(2),

  getEnvVariable: (variableName) => process.env[variableName],

  exit: (code) => process.exit(code),

  cwd: () => process.cwd(),

  log: (...args) => console.log(...args),
  error: (...args) => console.error(...args),

  // --- HTTP Implementation ---
  fetchSync: (url, options = {}) => {
    const method = options.method || "GET";
    const headers = options.headers || {};
    const body = options.body || null;

    const args = ["-s", "-i", "-X", method];

    for (const [key, value] of Object.entries(headers)) {
      args.push("-H", `${key}: ${value}`);
    }

    if (body) {
      args.push("-d", body);
    }

    args.push(url);

    const result = spawnSync("curl", args, { encoding: "utf-8" });

    if (result.error) {
      throw new Error(
        `HTTP Request failed: ${result.error.message}. Ensure 'curl' is installed.`,
      );
    }

    if (result.status !== 0) {
      throw new Error(
        `HTTP Connection failed: ${result.stderr || "Unknown error"}`,
      );
    }

    const output = result.stdout;
    const separator = "\r\n\r\n";
    let splitIndex = output.indexOf(separator);
    if (splitIndex === -1) splitIndex = output.indexOf("\n\n");

    const headerPart = splitIndex !== -1 ? output.substring(0, splitIndex) : "";
    const bodyPart =
      splitIndex !== -1
        ? output.substring(splitIndex + separator.length)
        : output;

    const statusLine = headerPart.split("\n")[0] || "";
    const statusMatch = statusLine.match(/HTTP\/\d(\.\d)?\s+(\d+)/);
    const statusCode = statusMatch ? parseInt(statusMatch[2], 10) : 0;

    return {
      status: statusCode,
      body: bodyPart,
    };
  },
};
