'use client';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Plus, Download, Printer, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import type { ResourceConfig } from '@/config/resources';
import { getList } from '@/lib/api/resources';
import { errorText } from '@/lib/api/errors';
import { exportExcel, isSensitive } from '@/utils/export';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/dialog';
import {
  ErrorState,
  LoadingSkeleton,
  UnavailableState,
} from '@/components/common/states';
import { PermissionGate } from '@/components/common/gates';
import { DataTable } from '@/components/tables/data-table';
import { DataTablePagination } from '@/components/tables/pagination';
import { ResourceForm } from '@/components/forms/resource-form';
import { RowActions } from './row-actions';
import { OvertimePreview } from './overtime-preview';
import { CompanyLogo } from './company-logo';
export function ResourcePage({ resource }: { resource: ResourceConfig }) {
  const session = useAuthStore((s) => s.session);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [onlyActive, setOnlyActive] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const paginated = resource.key === 'attendance';
  const params = useMemo(
    () =>
      resource.key === 'shifts'
        ? { onlyActive }
        : paginated
          ? {
              page,
              pageSize,
              ...(fromDate ? { fromDate } : {}),
              ...(toDate ? { toDate } : {}),
              ...(operatorId ? { operatorId: Number(operatorId) } : {}),
            }
          : undefined,
    [
      resource.key,
      onlyActive,
      paginated,
      page,
      pageSize,
      fromDate,
      toDate,
      operatorId,
    ],
  );
  const invalidDates = !!(fromDate && toDate && fromDate > toDate);
  const query = useQuery({
    queryKey: [
      'records',
      resource.key,
      session?.userId,
      session?.companyId,
      params,
    ],
    queryFn: () => getList(resource.key, resource.listUrl!, params),
    enabled: !!resource.listUrl && !invalidDates,
  });
  const rows = useMemo(
    () =>
      (query.data?.rows || []).filter((row) =>
        Object.entries(row).some(
          ([key, v]) =>
            !isSensitive(key) &&
            v != null &&
            typeof v !== 'object' &&
            String(v).toLowerCase().includes(search.toLowerCase()),
        ),
      ),
    [query.data, search],
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">
            {resource.route.split('/')[1].replaceAll('-', ' ')}
          </p>
          <h1>{resource.title}</h1>
          <p>{resource.description}</p>
        </div>
        {resource.fields.length > 0 && (
          <PermissionGate route={resource.route} permission="ADD">
            <Button onClick={() => setOpen(true)}>
              <Plus size={16} />
              {resource.createUrl
                ? resource.key === 'salary-records'
                  ? 'Generate salary'
                  : resource.key === 'work-sessions'
                    ? 'Start session'
                    : 'Add record'
                : 'Preview form'}
            </Button>
          </PermissionGate>
        )}
      </div>
      {resource.key === 'work-sessions' && (
        <div className="workflow no-print">
          <span>01 · Attendance</span>
          <span>02 · Start session</span>
          <span>03 · Production & quality</span>
          <span>04 · Complete</span>
        </div>
      )}
      {resource.key === 'overtime' && <OvertimePreview />}
      {resource.key === 'companies' && <CompanyLogo />}
      <section className="panel">
        <div className="toolbar no-print">
          <div className="search-box">
            <Search size={16} />
            <input
              aria-label="Search current records"
              placeholder={paginated ? 'Search this page…' : 'Search records…'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {resource.key === 'shifts' && (
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
              />
              Active only
            </label>
          )}
          <div className="ml-auto flex gap-2">
            <Button
              size="icon"
              variant="ghost"
              disabled={!resource.listUrl || query.isFetching || invalidDates}
              onClick={() => query.refetch()}
              aria-label="Refresh records"
            >
              <RefreshCw size={16} />
            </Button>
            <PermissionGate route={resource.route} permission="EXPORT">
              <Button
                variant="outline"
                disabled={!rows.length || exporting}
                onClick={async () => {
                  setExporting(true);
                  try {
                    await exportExcel(resource.key, rows);
                  } catch {
                    toast.error('The export could not be created.');
                  } finally {
                    setExporting(false);
                  }
                }}
              >
                <Download size={15} />
                <span className="hidden sm:inline">
                  {exporting ? 'Exporting…' : 'Excel'}
                </span>
              </Button>
            </PermissionGate>
            <Button
              variant="outline"
              disabled={!rows.length}
              onClick={() => window.print()}
            >
              <Printer size={15} />
              <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </div>
        {paginated && (
          <div className="filters no-print">
            <label className="field">
              From date
              <input
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="field">
              To date
              <input
                type="date"
                value={toDate}
                min={fromDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                  setPage(1);
                }}
              />
            </label>
            <label className="field">
              Operator ID
              <input
                type="number"
                min="1"
                step="1"
                placeholder="All operators"
                value={operatorId}
                onChange={(e) => {
                  const v = e.target.value;
                  if (!v || /^[1-9]\d*$/.test(v)) {
                    setOperatorId(v);
                    setPage(1);
                  }
                }}
              />
            </label>
          </div>
        )}
        {invalidDates ? (
          <ErrorState message="The end date must be on or after the start date." />
        ) : !resource.listUrl ? (
          <UnavailableState description="The list endpoint for this module was not supplied. No records are fabricated. See the included API contract checklist to connect it." />
        ) : query.isPending ? (
          <LoadingSkeleton />
        ) : query.isError ? (
          <ErrorState
            message={errorText(query.error)}
            retry={() => query.refetch()}
          />
        ) : (
          <DataTable
            rows={rows}
            actions={
              [
                'shifts',
                'overtime',
                'work-sessions',
                'downtime-entries',
              ].includes(resource.key)
                ? (row) => <RowActions resource={resource} row={row} />
                : undefined
            }
          />
        )}{' '}
        {resource.listUrl && query.data && paginated && (
          <DataTablePagination
            page={page}
            pageSize={pageSize}
            count={query.data.rows.length}
            total={query.data.total}
            onPage={setPage}
            onSize={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
        {resource.listUrl && !paginated && (
          <div className="pagination">
            <span>{rows.length} records shown</span>
            <span>Live API data</span>
          </div>
        )}
      </section>
      <FormDialog
        open={open}
        onOpenChange={(value) => {
          if (!saving) setOpen(value);
        }}
        title={`${resource.createUrl ? 'New' : 'Preview'} · ${resource.title}`}
        description="Fields follow the supplied backend request contract."
        large={resource.fields.length > 5}
      >
        {open && (
          <ResourceForm
            resource={resource}
            onBusyChange={setSaving}
            onDone={() => setOpen(false)}
          />
        )}
      </FormDialog>
    </>
  );
}
