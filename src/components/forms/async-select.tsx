'use client';
import { useQuery } from '@tanstack/react-query';
import { resourceByKey } from '@/config/resources';
import { listContracts } from '@/config/contracts';
import { getList } from '@/lib/api/resources';
import { useAuthStore } from '@/stores/auth-store';
import { useState } from 'react';
import type { DataRow } from '@/types/api';
export function AsyncSelect({
  source,
  value,
  onChange,
  id,
  filter,
}: {
  source: string;
  value: unknown;
  onChange: (v: number | null) => void;
  id: string;
  filter?: (row: DataRow) => boolean;
}) {
  const resource = resourceByKey(source);
  const contract = listContracts[source];
  const session = useAuthStore((s) => s.session);
  const [search, setSearch] = useState('');
  const query = useQuery({
    queryKey: ['lookup', source, session?.userId, session?.companyId],
    queryFn: () => getList(source, resource!.listUrl!),
    enabled: !!resource?.listUrl && !!contract?.idField,
  });
  const unavailable = !resource?.listUrl || !contract?.idField;
  const rows = (query.data?.rows || []).filter(
    (row) => row.isActive !== false && (!filter || filter(row)),
  );
  const label = (row: DataRow) =>
    Object.entries(row)
      .filter(([key, v]) => typeof v === 'string' && /name|code/i.test(key))
      .map(([, v]) => String(v))
      .join(' · ') || String(row[contract?.idField || '']);
  return (
    <div>
      <input
        aria-label={`Search ${source}`}
        type="search"
        placeholder="Search options…"
        value={search}
        disabled={unavailable}
        onChange={(e) => setSearch(e.target.value)}
      />
      <select
        id={id}
        className="mt-1"
        value={value == null ? '' : String(value)}
        onChange={(e) =>
          onChange(e.target.value ? Number(e.target.value) : null)
        }
        disabled={unavailable || query.isLoading || query.isError}
      >
        <option value="">
          {unavailable
            ? 'Lookup not connected'
            : query.isLoading
              ? 'Loading…'
              : query.isError
                ? 'Unable to load options'
                : 'Select an option'}
        </option>
        {rows
          .filter((row) =>
            label(row).toLowerCase().includes(search.toLowerCase()),
          )
          .map((row) => (
            <option
              key={String(row[contract!.idField!])}
              value={String(row[contract!.idField!])}
            >
              {label(row)}
            </option>
          ))}
      </select>
      {unavailable && (
        <span className="text-xs font-normal text-amber-700">
          Requires a documented lookup and ID mapping.
        </span>
      )}
    </div>
  );
}
