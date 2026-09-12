'use client';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { DataRow } from '@/types/api';
import type { ResourceConfig } from '@/config/resources';
import { listContracts } from '@/config/contracts';
import { executeAction } from '@/lib/api/resources';
import { errorText } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PermissionGate } from '@/components/common/gates';
export function RowActions({
  resource,
  row,
}: {
  resource: ResourceConfig;
  row: DataRow;
}) {
  const client = useQueryClient();
  const [action, setAction] = useState<{
    label: string;
    method: 'PATCH' | 'DELETE' | 'POST';
    url: string;
  } | null>(null);
  const idField = listContracts[resource.key]?.idField;
  const id = idField ? row[idField] : undefined;
  const mutate = useMutation({
    mutationFn: () => executeAction(action!.method, action!.url),
    onSuccess: async (result) => {
      toast.success(result.message);
      setAction(null);
      await client.invalidateQueries({ queryKey: ['records', resource.key] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  if (typeof id !== 'number' || !Number.isInteger(id) || id <= 0)
    return <span className="text-xs text-slate-400">ID mapping required</span>;
  const actions =
    resource.key === 'shifts'
      ? [
          {
            label: 'Toggle active',
            method: 'PATCH' as const,
            url: `/Shifts/${id}/toggle-active`,
            permission: 'EDIT',
          },
          {
            label: 'Delete',
            method: 'DELETE' as const,
            url: `/Shifts/${id}/Delete`,
            permission: 'DELETE',
          },
        ]
      : resource.key === 'overtime' && row.status === 'Draft'
        ? [
            {
              label: 'Approve',
              method: 'POST' as const,
              url: `/Overtime/${id}/Approve`,
              permission: 'APPROVE',
            },
            {
              label: 'Delete',
              method: 'DELETE' as const,
              url: `/Overtime/${id}/Delete`,
              permission: 'DELETE',
            },
          ]
        : resource.key === 'work-sessions' && row.status === 'Open'
          ? [
              {
                label: 'Cancel',
                method: 'POST' as const,
                url: `/WorkSessions/${id}/Cancel`,
                permission: 'EDIT',
              },
            ]
          : [];
  return (
    <>
      <div className="flex gap-2">
        {actions.map((a) => (
          <PermissionGate
            key={a.label}
            route={resource.route}
            permission={a.permission}
          >
            <Button variant="outline" size="sm" onClick={() => setAction(a)}>
              {a.label}
            </Button>
          </PermissionGate>
        ))}
        {!actions.length && (
          <span className="text-xs text-slate-400">View only</span>
        )}
      </div>
      <ConfirmDialog
        open={!!action}
        title={`${action?.label || 'Change'} record ${id}?`}
        description="This change will be sent to your company's backend. Confirm that you selected the correct record."
        busy={mutate.isPending}
        onCancel={() => setAction(null)}
        onConfirm={() => {
          if (!mutate.isPending) mutate.mutate();
        }}
      />
    </>
  );
}
