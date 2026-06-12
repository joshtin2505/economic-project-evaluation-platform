export interface CsvRow {
  date: string;
  description: string;
  amount: number;
  balance_after?: number;
  external_id?: string;
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === "," || char === ";") && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

function parseAmount(value: string): number {
  const cleaned = value.replace(/[^\d.,-]/g, "").replace(",", ".");
  return parseFloat(cleaned) || 0;
}

function parseDate(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  const parts = trimmed.split(/[\/\-]/);
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`;
    }
    return `${parts[2]}-${parts[1].padStart(2, "0")}-${parts[0].padStart(2, "0")}`;
  }
  return new Date().toISOString().slice(0, 10);
}

export function parseBankCsv(csvContent: string): CsvRow[] {
  const lines = csvContent
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length < 2) return [];

  const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase());
  const dateIdx = header.findIndex((h) =>
    ["fecha", "date", "transaction date"].some((k) => h.includes(k)),
  );
  const descIdx = header.findIndex((h) =>
    ["descripcion", "description", "detalle", "concepto"].some((k) =>
      h.includes(k),
    ),
  );
  const amountIdx = header.findIndex((h) =>
    ["monto", "amount", "valor", "importe"].some((k) => h.includes(k)),
  );
  const balanceIdx = header.findIndex((h) =>
    ["saldo", "balance"].some((k) => h.includes(k)),
  );

  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    const date = dateIdx >= 0 ? parseDate(cols[dateIdx]) : parseDate(cols[0]);
    const description =
      descIdx >= 0 ? cols[descIdx] : (cols[1] ?? "Movimiento bancario");
    const amount =
      amountIdx >= 0
        ? parseAmount(cols[amountIdx])
        : parseAmount(cols[2] ?? "0");
    const balance_after =
      balanceIdx >= 0 ? parseAmount(cols[balanceIdx]) : undefined;

    if (amount === 0) continue;

    rows.push({
      date,
      description,
      amount,
      balance_after,
      external_id: `${date}-${amount}-${description}`.slice(0, 100),
    });
  }

  return rows;
}
