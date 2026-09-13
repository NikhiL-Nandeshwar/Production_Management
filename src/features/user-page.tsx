'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import type { Role, User } from '@/types/api';
import type { UsersCreateRequest, UsersUpdateRequest } from '@/types/requests';
import { getRoles } from '@/lib/api/roles';
import {
  createUser,
  getUserById,
  getUsers,
  toggleUserActive,
  updateUser,
} from '@/lib/api/users';
import { ApiError, errorText } from '@/lib/api/errors';
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

const userSchema = z.object({
  roleId: z.number().int().positive('Select a role'),
  username: z.string().trim().min(1, 'Enter a username'),
  email: z.string().trim().email('Enter a valid email address'),
  displayName: z.string().trim().min(1, 'Enter a display name'),
  password: z.string(),
  isActive: z.boolean(),
});
type UserFormValues = z.infer<typeof userSchema>;

function UserForm({
  companyId,
  userId,
  roles,
  rolesLoading,
  onDone,
  onBusyChange,
}: {
  companyId: number;
  userId: number | null;
  roles: Role[];
  rolesLoading: boolean;
  onDone: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const client = useQueryClient();
  const [formError, setFormError] = useState('');
  const detail = useQuery({
    queryKey: ['user', companyId, userId],
    queryFn: () => getUserById(userId!, companyId),
    enabled: userId !== null,
  });
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      roleId: 0,
      username: '',
      email: '',
      displayName: '',
      password: '',
      isActive: true,
    },
  });

  useEffect(() => {
    if (detail.data)
      reset({
        roleId: detail.data.roleId,
        username: detail.data.username,
        email: detail.data.email,
        displayName: detail.data.displayName,
        password: '',
        isActive: detail.data.isActive,
      });
    else if (userId === null)
      reset({
        roleId: 0,
        username: '',
        email: '',
        displayName: '',
        password: '',
        isActive: true,
      });
  }, [detail.data, reset, userId]);

  const save = useMutation({
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false),
    mutationFn: (values: UserFormValues) => {
      if (userId === null) {
        const payload: UsersCreateRequest = {
          roleId: values.roleId,
          username: values.username,
          email: values.email,
          displayName: values.displayName,
          password: values.password,
          isActive: values.isActive,
        };
        return createUser(companyId, payload);
      }
      const payload: UsersUpdateRequest = {
        id: userId,
        roleId: values.roleId,
        email: values.email,
        displayName: values.displayName,
        isActive: values.isActive,
      };
      return updateUser(companyId, payload);
    },
    onSuccess: async (result) => {
      toast.success(result.message);
      await client.invalidateQueries({ queryKey: ['users', companyId] });
      onDone();
    },
    onError: (error) => {
      setFormError(errorText(error));
      if (error instanceof ApiError)
        for (const [field, messages] of Object.entries(error.fields)) {
          const key = field.toLowerCase();
          if (key === 'roleid') setError('roleId', { message: messages.join(' ') });
          if (key === 'username') setError('username', { message: messages.join(' ') });
          if (key === 'email') setError('email', { message: messages.join(' ') });
          if (key === 'displayname')
            setError('displayName', { message: messages.join(' ') });
          if (key === 'password') setError('password', { message: messages.join(' ') });
        }
    },
  });

  if (userId !== null && detail.isPending) return <LoadingSkeleton />;
  if (userId !== null && detail.isError)
    return <ErrorState message={errorText(detail.error)} retry={() => detail.refetch()} />;

  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((values) => {
        setFormError('');
        if (userId === null && !values.password) {
          setError('password', { message: 'Enter a password' });
          return;
        }
        if (!save.isPending) save.mutate(values);
      })}
    >
      <label className="field">
        Username
        <input
          {...register('username')}
          aria-invalid={!!errors.username}
          disabled={userId !== null}
        />
        {userId !== null && (
          <span className="field-hint text-amber-800">
            Username cannot be changed after the user is created.
          </span>
        )}
        {errors.username && (
          <span className="field-error">{errors.username.message}</span>
        )}
      </label>
      <label className="field">
        Email
        <input type="email" {...register('email')} aria-invalid={!!errors.email} />
        {errors.email && <span className="field-error">{errors.email.message}</span>}
      </label>
      <label className="field">
        Display name
        <input {...register('displayName')} aria-invalid={!!errors.displayName} />
        {errors.displayName && (
          <span className="field-error">{errors.displayName.message}</span>
        )}
      </label>
      <label className="field">
        Role
        <select
          {...register('roleId', { valueAsNumber: true })}
          aria-invalid={!!errors.roleId}
          disabled={rolesLoading}
        >
          <option value={0}>{rolesLoading ? 'Loading roles...' : 'Select a role'}</option>
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.roleName}
            </option>
          ))}
        </select>
        {errors.roleId && <span className="field-error">{errors.roleId.message}</span>}
      </label>
      {userId === null && (
        <label className="field">
          Password
          <input
            type="password"
            autoComplete="new-password"
            {...register('password')}
            aria-invalid={!!errors.password}
          />
          {errors.password && <span className="field-error">{errors.password.message}</span>}
        </label>
      )}
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" {...register('isActive')} />
        Active user
      </label>
      {formError && <p role="alert" className="error-box">{formError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={save.isPending || rolesLoading}>
          {save.isPending ? 'Saving...' : userId === null ? 'Create user' : 'Save changes'}
        </Button>
      </div>
    </form>
  );
}

export function UserPage() {
  const companyId = useAuthStore((state) => state.session?.companyId);
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<User | null>(null);
  const validCompanyId =
    typeof companyId === 'number' && Number.isInteger(companyId) && companyId > 0;
  const users = useQuery({
    queryKey: ['users', companyId],
    queryFn: () => getUsers(companyId!),
    enabled: validCompanyId,
  });
  const roles = useQuery({
    queryKey: ['roles', companyId],
    queryFn: () => getRoles(companyId!),
    enabled: validCompanyId,
  });
  const toggle = useMutation({
    mutationFn: () => toggleUserActive(toggleTarget!.id, companyId!),
    onSuccess: async (result) => {
      toast.success(result.message);
      setToggleTarget(null);
      await queryClient.invalidateQueries({ queryKey: ['users', companyId] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const openCreate = () => {
    setEditingId(null);
    setFormOpen(true);
  };
  const openEdit = (user: User) => {
    setEditingId(user.id);
    setFormOpen(true);
  };
  const closeForm = () => {
    if (!formBusy) {
      setFormOpen(false);
      setEditingId(null);
    }
  };
  const roleName = (roleId: number) =>
    roles.data?.find((role) => role.id === roleId)?.roleName || `Role #${roleId}`;

  if (!validCompanyId)
    return (
      <ErrorState message="Your session does not include a company workspace. Sign in again or contact your administrator." />
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ADMINISTRATION</p>
          <h1>Users</h1>
          <p>Manage access to your company workspace.</p>
        </div>
        <PermissionGate route="/admin/users" permission="ADD">
          <Button onClick={openCreate}>
            <Plus size={16} />
            Add user
          </Button>
        </PermissionGate>
      </div>
      <section className="panel">
        <div className="toolbar no-print">
          <p className="text-sm text-slate-500">Users are managed in the current company workspace.</p>
          <Button
            className="ml-auto"
            size="icon"
            variant="ghost"
            disabled={users.isFetching}
            onClick={() => users.refetch()}
            aria-label="Refresh users"
          >
            <RefreshCw size={16} />
          </Button>
        </div>
        {users.isPending ? (
          <LoadingSkeleton />
        ) : users.isError ? (
          <ErrorState message={errorText(users.error)} retry={() => users.refetch()} />
        ) : !users.data?.length ? (
          <EmptyState title="No users found" description="Create the first user for this company workspace." />
        ) : (
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Display name</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="no-print">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.data.map((user) => (
                  <tr key={user.id}>
                    <td className="font-medium text-slate-900">{user.username}</td>
                    <td>{user.email}</td>
                    <td>{user.displayName}</td>
                    <td>{roleName(user.roleId)}</td>
                    <td><StatusBadge value={user.isActive} /></td>
                    <td className="no-print">
                      <div className="flex flex-wrap gap-2">
                        <PermissionGate route="/admin/users" permission="EDIT">
                          <Button variant="outline" size="sm" onClick={() => openEdit(user)}>
                            <Pencil size={14} /> Edit
                          </Button>
                        </PermissionGate>
                        <PermissionGate route="/admin/users" permission="EDIT">
                          <Button variant="outline" size="sm" onClick={() => setToggleTarget(user)}>
                            <Power size={14} /> {user.isActive ? 'Deactivate' : 'Activate'}
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
        title={editingId === null ? 'Add user' : 'Edit user'}
        description="User changes apply to the current company workspace."
      >
        {formOpen && (
          <UserForm
            companyId={companyId}
            userId={editingId}
            roles={roles.data || []}
            rolesLoading={roles.isPending || roles.isError}
            onDone={closeForm}
            onBusyChange={setFormBusy}
          />
        )}
      </FormDialog>
      <ConfirmDialog
        open={!!toggleTarget}
        title={`${toggleTarget?.isActive ? 'Deactivate' : 'Activate'} ${toggleTarget?.displayName || 'user'}?`}
        description={`This will ${toggleTarget?.isActive ? 'deactivate' : 'activate'} the selected user in this company workspace.`}
        busy={toggle.isPending}
        onCancel={() => setToggleTarget(null)}
        onConfirm={() => { if (!toggle.isPending) toggle.mutate(); }}
      />
    </>
  );
}
