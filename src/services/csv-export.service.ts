import { Injectable } from '@nestjs/common';
import { arrayToCsv, type CsvColumn } from '@utils/csv-export';

@Injectable()
export class CsvExportService {
  toCsv(rows: Record<string, unknown>[], columns: CsvColumn[]): string {
    return arrayToCsv(rows, columns);
  }
}
