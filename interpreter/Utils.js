export function isTruthy(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value.length > 0;
  return true;
}

export function stringify(value) {
  if (value === null || value === undefined) return "null";
  if (value instanceof Date) { 
    return `datetime(${value.toISOString()})`; 
  }
  if (Array.isArray(value)) {
    return `[${value.map((v) => stringify(v)).join(", ")}]`;
  }
  if (typeof value === "object" && value !== null) {
    const pairs = Object.entries(value).map(([key, val]) => `${key}: ${stringify(val)}`);
    return `{${pairs.join(", ")}}`;
  }
  if (typeof value === "string") return value;
  return String(value);
}
