'use client';
import type { DataRow } from '@/types/api';
import { isSensitive } from '@/utils/export';
import { fieldLabel } from '@/schemas/resource';
import { StatusBadge, EmptyState } from '@/components/common/states';
export function DataTable({
  rows,
  actions,
}: {
  rows: DataRow[];
  actions?: (row: DataRow) => React.ReactNode;
}) {
  if (!rows.length) return <EmptyState />;
  const columns = Array.from(
    new Set(rows.flatMap((row) => Object.keys(row))),
  ).filter(
    (key) =>
      !isSensitive(key) &&
      rows.some(
        (row) =>
          row[key] === null ||
          ['string', 'number', 'boolean'].includes(typeof row[key]),
      ),
  );
  return (
    <div className="overflow-x-auto">
      <table>
        <thead>
          <tr>
            {columns.map((key) => (
              <th key={key}>{fieldLabel(key)}</th>
            ))}
            {actions && <th className="no-print">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((key) => (
                <td key={key}>
                  {/status|isActive/i.test(key) ? (
                    <StatusBadge value={row[key]} />
                  ) : row[key] == null ? (
                    '—'
                  ) : typeof row[key] === 'object' ? (
                    '—'
                  ) : (
                    String(row[key])
                  )}
                </td>
              ))}
              {actions && <td className="no-print">{actions(row)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
