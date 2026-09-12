import { format } from 'date-fns';
import type { DataRow } from '@/types/api';
export const isSensitive = (key: string) =>
  /password|token|secret|smtp|connectionstring/i.test(key);
export function safeExportRows(rows: DataRow[]) {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row)
        .filter(
          ([key, value]) =>
            !isSensitive(key) && (value == null || typeof value !== 'object'),
        )
        .map(([key, value]) => [
          key,
          typeof value === 'string' && /^[=+@\-\t\r]/.test(value)
            ? `'${value}`
            : value,
        ]),
    ),
  );
}
export async function exportExcel(name: string, rows: DataRow[]) {
  const XLSX = await import('xlsx');
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.json_to_sheet(safeExportRows(rows)),
    'Records',
  );
  XLSX.writeFile(book, `${name}-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
}
