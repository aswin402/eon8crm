/**
 * Standard RFC 4180 compliant CSV generator for financial & operational exports
 */

export function escapeCsvField(val: string | number | boolean | null | undefined): string {
  if (val === null || val === undefined) {
    return '""';
  }
  if (typeof val === "number") {
    return String(val);
  }
  if (typeof val === "boolean") {
    return val ? "true" : "false";
  }
  const str = String(val);
  return `"${str.replace(/"/g, '""')}"`;
}

export function generateCsv(
  headers: string[],
  rows: (string | number | boolean | null | undefined)[][]
): string {
  const headerLine = headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(",");
  const dataLines = rows.map((row) => row.map(escapeCsvField).join(","));
  return [headerLine, ...dataLines].join("\r\n");
}
