import { CsvExportService } from './csv-export.service';
import { type CsvColumn } from '@utils/csv-export';

describe('CsvExportService', () => {
  let service: CsvExportService;

  beforeEach(() => {
    service = new CsvExportService();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should delegate to arrayToCsv', () => {
    const rows = [{ name: 'Alice', age: 30 }];
    const columns: CsvColumn[] = [
      { header: 'Name', key: 'name' },
      { header: 'Age', key: 'age' },
    ];

    const result = service.toCsv(rows, columns);

    expect(result).toBe('Name,Age\nAlice,30');
  });

  it('should handle transforms', () => {
    const rows = [{ amount: 15099 }];
    const columns: CsvColumn[] = [
      { header: 'Amount', key: 'amount', transform: (v) => `$${Number(v) / 100}` },
    ];

    const result = service.toCsv(rows, columns);

    expect(result).toContain('$150.99');
  });

  it('should return only header line for empty rows', () => {
    const columns: CsvColumn[] = [{ header: 'Name', key: 'name' }];

    const result = service.toCsv([], columns);

    expect(result).toBe('Name');
  });
});
