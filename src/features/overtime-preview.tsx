'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { previewOvertime, executeAction, isRow } from '@/lib/api/resources';
import { errorText } from '@/lib/api/errors';
import { safeExportRows } from '@/utils/export';
import { fieldLabel } from '@/schemas/resource';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { PermissionGate } from '@/components/common/gates';
const schema = z.object({ attendanceId: z.coerce.number().int().positive() });
export function OvertimePreview() {
  const client = useQueryClient();
  const [preview, setPreview] = useState<{ id: number; data: unknown } | null>(
    null,
  );
  const [confirm, setConfirm] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  const create = useMutation({
    mutationFn: () =>
      executeAction('POST', `/Overtime/FromAttendance/${preview!.id}`),
    onSuccess: async (result) => {
      toast.success(result.message);
      setConfirm(false);
      setPreview(null);
      await client.invalidateQueries({ queryKey: ['records', 'overtime'] });
    },
    onError: (e) => toast.error(errorText(e)),
  });
  return (
    <section className="panel mb-6 p-5 no-print">
      <h2 className="font-semibold">Calculate from attendance</h2>
      <p className="my-2 text-sm text-slate-500">
        Enter a known attendance record ID to preview the backend calculation.
      </p>
      <form
        className="flex flex-wrap items-end gap-3"
        onSubmit={handleSubmit(async ({ attendanceId }) => {
          setPreview(null);
          try {
            setPreview({
              id: attendanceId,
              data: await previewOvertime(attendanceId),
            });
          } catch (e) {
            toast.error(errorText(e));
          }
        })}
      >
        <label className="field">
          Attendance ID
          <input type="number" min="1" {...register('attendanceId')} />
          {errors.attendanceId && (
            <span className="field-error">Enter a valid attendance ID</span>
          )}
        </label>
        <Button variant="outline" disabled={isSubmitting || create.isPending}>
          {isSubmitting ? 'Calculating…' : 'Preview overtime'}
        </Button>
      </form>
      {preview && (
        <div className="mt-5 border-t border-slate-100 pt-5">
          <h3 className="mb-3 text-sm font-semibold">
            Preview · Attendance {preview.id}
          </h3>
          {isRow(preview.data) ? (
            <dl className="grid gap-3 sm:grid-cols-3">
              {Object.entries(safeExportRows([preview.data])[0]).map(
                ([key, value]) => (
                  <div key={key}>
                    <dt className="text-xs text-slate-400">
                      {fieldLabel(key)}
                    </dt>
                    <dd className="mt-1 text-sm font-medium">
                      {String(value ?? '—')}
                    </dd>
                  </div>
                ),
              )}
            </dl>
          ) : (
            <p className="notice">
              The calculation response needs a documented display adapter.
            </p>
          )}
          <PermissionGate route="/salary/overtime" permission="ADD">
            <Button
              className="mt-4"
              onClick={() => setConfirm(true)}
              disabled={!isRow(preview.data) || create.isPending}
            >
              Create from attendance {preview.id}
            </Button>
          </PermissionGate>
        </div>
      )}
      <ConfirmDialog
        open={confirm}
        title="Create overtime from this attendance?"
        description={`The backend will calculate overtime for attendance ${preview?.id}.`}
        busy={create.isPending}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          if (!create.isPending) create.mutate();
        }}
      />
    </section>
  );
}
