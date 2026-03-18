export type CsvColumn = {
  header: string;
  key: string;
  transform?: (v: unknown) => string;
};

export function centsToDollars(cents: number): string {
  const dollars = Math.floor(cents / 100);
  const remainder = Math.abs(cents % 100);
  return `${cents < 0 && dollars === 0 ? '-' : ''}${dollars}.${String(remainder).padStart(2, '0')}`;
}

export function formatDate(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
}

function escapeCsvValue(value: string): string {
  if (
    value.includes(',') ||
    value.includes('"') ||
    value.includes('\n') ||
    value.includes('\r')
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function arrayToCsv(
  rows: Record<string, unknown>[],
  columns: CsvColumn[],
): string {
  const headerLine = columns
    .map((c) => escapeCsvValue(c.header))
    .join(',');

  const dataLines = rows.map((row) =>
    columns
      .map((col) => {
        const raw = row[col.key];
        const value = col.transform
          ? col.transform(raw)
          : raw == null
            ? ''
            : String(raw as string | number | boolean);
        return escapeCsvValue(value);
      })
      .join(','),
  );

  return [headerLine, ...dataLines].join('\n');
}
