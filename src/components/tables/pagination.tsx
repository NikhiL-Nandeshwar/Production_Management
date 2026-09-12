import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function DataTablePagination({
  page,
  pageSize,
  total,
  count,
  onPage,
  onSize,
}: {
  page: number;
  pageSize: number;
  total?: number;
  count: number;
  onPage: (page: number) => void;
  onSize: (size: number) => void;
}) {
  return (
    <div className="pagination no-print">
      <span>
        {total == null ? `${count} records on this page` : `${total} records`}
      </span>
      <div className="flex items-center gap-3">
        <label className="hidden sm:block">
          Rows{' '}
          <select
            aria-label="Rows per page"
            className="ml-1 rounded border p-1"
            value={pageSize}
            onChange={(e) => onSize(Number(e.target.value))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <Button
          size="icon"
          variant="ghost"
          disabled={page <= 1}
          aria-label="Previous page"
          onClick={() => onPage(page - 1)}
        >
          <ChevronLeft size={16} />
        </Button>
        <span>
          Page {page}
          {total != null
            ? ` of ${Math.max(1, Math.ceil(total / pageSize))}`
            : ''}
        </span>
        <Button
          size="icon"
          variant="ghost"
          disabled={total != null ? page * pageSize >= total : count < pageSize}
          aria-label="Next page"
          onClick={() => onPage(page + 1)}
        >
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
}
