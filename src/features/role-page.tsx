'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import type { Role } from '@/types/api';
import type { RoleCreateRequest, RoleUpdateRequest } from '@/types/requests';
import {
  createRole,
  getRoleById,
  getRoles,
  toggleRoleActive,
  updateRole,
} from '@/lib/api/roles';
import { errorText, ApiError } from '@/lib/api/errors';
import { formatDate, formatNumber } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@/components/common/states';
import { PermissionGate } from '@/components/common/gates';

const roleSchema = z.object({
  roleName: z.string().trim().min(1, 'Enter a role name'),
  description: z.string().trim(),
  isActive: z.boolean(),
});
type RoleFormValues = z.infer<typeof roleSchema>;

function RoleForm({
  companyId,
  roleId,
  onDone,
  onBusyChange,
}: {
  companyId: number;
  roleId: number | null;
  onDone: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const client = useQueryClient();
  const [formError, setFormError] = useState('');
  const detail = useQuery({
    queryKey: ['role', companyId, roleId],
    queryFn: () => getRoleById(roleId!, companyId),
    enabled: roleId !== null,
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { roleName: '', description: '', isActive: true },
  });

  useEffect(() => {
    if (detail.data)
      reset({
        roleName: detail.data.roleName,
        description: detail.data.description,
        isActive: detail.data.isActive,
      });
    else if (roleId === null)
      reset({ roleName: '', description: '', isActive: true });
  }, [detail.data, reset, roleId]);

  const save = useMutation({
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false),
    mutationFn: (values: RoleFormValues) => {
      const payload: RoleCreateRequest = {
        roleName: values.roleName,
        description: values.description,
        isActive: values.isActive,
      };
      return roleId === null
        ? createRole(companyId, payload)
        : updateRole(companyId, { ...payload, id: roleId } satisfies RoleUpdateRequest);
    },
    onSuccess: async (result) => {
      toast.success(result.message);
      await client.invalidateQueries({ queryKey: ['roles', companyId] });
      onDone();
    },
    onError: (error) => {
      setFormError(errorText(error));
      if (error instanceof ApiError)
        for (const [field, messages] of Object.entries(error.fields)) {
          if (field.toLowerCase() === 'rolename')
            setError('roleName', { message: messages.join(' ') });
          if (field.toLowerCase() === 'description')
            setError('description', { message: messages.join(' ') });
        }
    },
  });

  if (roleId !== null && detail.isPending) return <LoadingSkeleton />;
  if (roleId !== null && detail.isError)
    return <ErrorState message={errorText(detail.error)} retry={() => detail.refetch()} />;

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        setFormError('');
        if (!save.isPending) save.mutate(values);
      })}
    >
      <label className="field">
        Role name
        <input {...register('roleName')} aria-invalid={!!errors.roleName} />
        {errors.roleName && (
          <span className="field-error">{errors.roleName.message}</span>
        )}
      </label>
      <label className="field">
        Description
        <textarea rows={3} {...register('description')} aria-invalid={!!errors.description} />
        {errors.description && (
          <span className="field-error">{errors.description.message}</span>
        )}
      </label>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" {...register('isActive')} />
        Active role
      </label>
      {formError && <p role="alert" className="error-box">{formError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Savingâ€¦' : roleId === null ? 'Create role' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

export function RolePage() {
  const companyId = useAuthStore((state) => state.session?.companyId);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<Role | null>(null);
  const validCompanyId =
    typeof companyId === 'number' && Number.isInteger(companyId) && companyId > 0;
  const roles = useQuery({
    queryKey: ['roles', companyId],
    queryFn: () => getRoles(companyId!),
    enabled: validCompanyId,
  });
  const toggle = useMutation({
    mutationFn: () => toggleRoleActive(toggleTarget!.id, companyId!),
    onSuccess: async (result) => {
      toast.success(result.message);
      setToggleTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['roles', companyId] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };
  const openEdit = (role: Role) => {
    setEditingId(role.id);
    setFormOpen(true);
  };
  const closeForm = () => {
    if (!formBusy) {
      setFormOpen(false);
      setEditingId(null);
    }
  };

  if (!validCompanyId)
    return (
      <ErrorState message="Your session does not include a company workspace. Sign in again or contact your administrator." />
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Roles</h1>
          <p>Create and maintain roles for your company workspace.</p>
        </div>
        <PermissionGate route="/admin/roles" permission="ADD">
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add role
          </Button>
        </PermissionGate>
      </div>
      <section className="panel">
        <div className="toolbar no-print">
          <p className="text-sm text-slate-500">Roles are managed in the current company workspace.</p>
          <Button
            className="ml-auto"
            size="icon"
            variant="ghost"
            disabled={roles.isFetching}
            onClick={() => roles.refetch()}
            aria-label="Refresh roles"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        {roles.isPending ? (
          <LoadingSkeleton />
        ) : roles.isError ? (
          <ErrorState message={errorText(roles.error)} retry={() => roles.refetch()} />
        ) : !roles.data?.length ? (
          <EmptyState title="No roles found" description="Create the first role for this company workspace." />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Role name</th>
                  <th>Description</th>
                  <th>System role</th>
                  <th>Total users</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.data.map((role) => (
                  <tr key={role.id}>
                    <td className="font-medium text-slate-900">{role.roleName}</td>
                    <td>{role.description || 'â€”'}</td>
                    <td>
                      <span className="badge">{role.isSystemRole ? 'System' : 'Custom'}</span>
                    </td>
                    <td>{formatNumber(role.totalUsers)}</td>
                    <td><StatusBadge value={role.isActive} /></td>
                    <td>{formatDate(role.createdAt)}</td>
                    <td className="no-print">
                      <div className="flex flex-wrap gap-2">
                        <PermissionGate route="/admin/roles" permission="EDIT">
                          <Button variant="outline" size="sm" onClick={() => openEdit(role)}>
                            <Pencil size={14} /> Edit
                          </Button>
                        </PermissionGate>
                        <PermissionGate route="/admin/roles" permission="EDIT">
                          <Button variant="outline" size="sm" onClick={() => setToggleTarget(role)}>
                            <Power size={14} /> {role.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <FormDialog
        open={formOpen}
        onOpenChange={(open) => { if (!open) closeForm(); }}
        title={editingId === null ? 'Add role' : 'Edit role'}
        description="Role changes apply to the current company workspace."
      >
        {formOpen && (
          <RoleForm
            companyId={companyId}
            roleId={editingId}
            onDone={closeForm}
            onBusyChange={setFormBusy}
          />
        )}
      </FormDialog>
      <ConfirmDialog
        open={!!toggleTarget}
        title={`${toggleTarget?.isActive ? 'Deactivate' : 'Activate'} ${toggleTarget?.roleName || 'role'}?`}
        description={`This will ${toggleTarget?.isActive ? 'deactivate' : 'activate'} the selected role in this company workspace.`}
        busy={toggle.isPending}
        onCancel={() => setToggleTarget(null)}
        onConfirm={() => { if (!toggle.isPending) toggle.mutate(); }}
      />
    </>
  );
}
