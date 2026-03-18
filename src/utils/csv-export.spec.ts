import { arrayToCsv, centsToDollars, formatDate, type CsvColumn } from './csv-export';

describe('csv-export utility', () => {
  describe('centsToDollars', () => {
    it('should convert cents to dollar string', () => {
      expect(centsToDollars(15099)).toBe('150.99');
    });

    it('should handle zero', () => {
      expect(centsToDollars(0)).toBe('0.00');
    });

    it('should handle single-digit cents', () => {
      expect(centsToDollars(105)).toBe('1.05');
    });

    it('should handle negative amounts', () => {
      expect(centsToDollars(-500)).toBe('-5.00');
    });
  });

  describe('formatDate', () => {
    it('should format Date object to YYYY-MM-DD', () => {
      const result = formatDate(new Date('2026-03-15T10:30:00Z'));
      expect(result).toBe('2026-03-15');
    });

    it('should format ISO string to YYYY-MM-DD', () => {
      expect(formatDate('2026-03-15T10:30:00Z')).toBe('2026-03-15');
    });

    it('should return empty string for falsy value', () => {
      expect(formatDate('')).toBe('');
    });
  });

  describe('arrayToCsv', () => {
    it('should produce CSV with headers and data', () => {
      const rows = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      const columns: CsvColumn[] = [
        { header: 'Name', key: 'name' },
        { header: 'Age', key: 'age' },
      ];

      const csv = arrayToCsv(rows, columns);
      const lines = csv.split('\n');

      expect(lines[0]).toBe('Name,Age');
      expect(lines[1]).toBe('Alice,30');
      expect(lines[2]).toBe('Bob,25');
    });

    it('should escape values containing commas', () => {
      const rows = [{ desc: 'Hello, World' }];
      const columns: CsvColumn[] = [{ header: 'Description', key: 'desc' }];

      const csv = arrayToCsv(rows, columns);

      expect(csv).toContain('"Hello, World"');
    });

    it('should escape values containing double quotes', () => {
      const rows = [{ desc: 'She said "hello"' }];
      const columns: CsvColumn[] = [{ header: 'Description', key: 'desc' }];

      const csv = arrayToCsv(rows, columns);

      expect(csv).toContain('"She said ""hello"""');
    });

    it('should escape values containing newlines', () => {
      const rows = [{ desc: 'line1\nline2' }];
      const columns: CsvColumn[] = [{ header: 'Description', key: 'desc' }];

      const csv = arrayToCsv(rows, columns);

      expect(csv).toContain('"line1\nline2"');
    });

    it('should apply column transforms', () => {
      const rows = [{ amount: 15099 }];
      const columns: CsvColumn[] = [
        { header: 'Amount', key: 'amount', transform: (v) => centsToDollars(Number(v)) },
      ];

      const csv = arrayToCsv(rows, columns);

      expect(csv).toBe('Amount\n150.99');
    });

    it('should handle null/undefined values', () => {
      const rows = [{ name: null, age: undefined }];
      const columns: CsvColumn[] = [
        { header: 'Name', key: 'name' },
        { header: 'Age', key: 'age' },
      ];

      const csv = arrayToCsv(rows, columns);

      expect(csv).toBe('Name,Age\n,');
    });
  });
});
