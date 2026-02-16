export function isTruthy(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

export function stringify(value, useColors = false) {
  if (value === null || value === undefined) return useColors ? "\x1b[90mnull\x1b[0m" : "null";

  if (value instanceof Date) {
    const str = `datetime(${value.toISOString()})`;
    return useColors ? `\x1b[32m${str}\x1b[0m` : str;
  }

  if (Array.isArray(value)) {
    const items = value.map((v) => stringify(v, useColors)).join(useColors ? "\x1b[90m, \x1b[0m" : ", ");
    return useColors ? `\x1b[90m[\x1b[0m${items}\x1b[90m]\x1b[0m` : `[${items}]`;
  }

  if (typeof value === "object" && value !== null) {
    const pairs = Object.entries(value).map(([key, val]) => {
      const k = useColors ? `\x1b[34m${key}\x1b[0m` : key;
      return `${k}: ${stringify(val, useColors)}`;
    });
    return useColors ? `\x1b[90m{\x1b[0m${pairs.join(useColors ? "\x1b[90m, \x1b[0m" : ", ")}\x1b[90m}\x1b[0m` : `{${pairs.join(", ")}}`;
  }

  if (typeof value === "string") return useColors ? `\x1b[32m"${value}"\x1b[0m` : value;
  if (typeof value === "number") return useColors ? `\x1b[33m${value}\x1b[0m` : String(value);
  if (typeof value === "boolean") return useColors ? `\x1b[35m${value}\x1b[0m` : String(value);

  return String(value);
}

/**
 * Very basic syntax highlighting for Mimo code.
 * @param {string} code 
 * @returns {string} Colored ANSI string
 */
export function highlightMimoCode(code) {
  // Keywords
  const keywords = ["set", "let", "const", "global", "function", "fn", "return", "if", "else", "while", "for", "in", "try", "catch", "throw", "match", "case", "import", "from", "export", "as", "end", "call", "show"];
  const operators = ["+", "-", "*", "/", "%", "=", "!=", "==", ">", "<", ">=", "<=", "and", "or", "not", "&&", "||", "!", "??", "?."];

  let highlighted = code;

  // Highlight strings - avoid highlighting inside highlighted parts
  highlighted = highlighted.replace(/"[^"]*"/g, (match) => `\x1b[32m${match}\x1b[0m`);

  // Highlight comments
  highlighted = highlighted.replace(/#.*$/gm, (match) => `\x1b[90m${match}\x1b[0m`);

  // Highlight numbers
  highlighted = highlighted.replace(/\b\d+(\.\d+)?\b/g, (match) => `\x1b[33m${match}\x1b[0m`);

  // Highlight boolean literals
  highlighted = highlighted.replace(/\b(true|false|null)\b/g, (match) => `\x1b[35m${match}\x1b[0m`);

  // Highlight keywords
  for (const kw of keywords) {
    const regex = new RegExp(`\\b${kw}\\b`, 'g');
    highlighted = highlighted.replace(regex, (match) => `\x1b[1;36m${match}\x1b[0m`);
  }

  // Highlight operators
  for (const op of operators) {
    const escapedOp = op.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Avoid replacing inside ANSI escape codes
    const regex = new RegExp(`(?<!\\x1b\\[[0-9;]*)(${escapedOp})(?![0-9;]*m)`, 'g');
    highlighted = highlighted.replace(regex, (match) => `\x1b[31m${match}\x1b[0m`);
  }

  return highlighted;
}
