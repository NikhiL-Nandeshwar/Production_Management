'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Pencil, Plus, Power, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import type { Component, DowntimeCategory, Machine, Shift } from '@/types/api';
import type {
  ComponentsCreateRequest,
  ComponentsUpdateRequest,
  DowntimeCategoriesCreateRequest,
  DowntimeCategoriesUpdateRequest,
  MachinesCreateRequest,
  MachinesUpdateRequest,
  ShiftsCreateRequest,
  ShiftsUpdateRequest,
} from '@/types/requests';
import * as shiftApi from '@/lib/api/shifts';
import * as machineApi from '@/lib/api/machines';
import * as componentApi from '@/lib/api/components';
import * as downtimeCategoryApi from '@/lib/api/downtime-categories';
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

type MasterKind = 'shifts' | 'machines' | 'components' | 'downtime-categories';
type MasterRow = Shift | Machine | Component | DowntimeCategory;
type MasterFormValues = {
  id?: number;
  shiftName?: string;
  startTime?: string;
  endTime?: string;
  breakMinutes?: number;
  machineCode?: string;
  machineName?: string;
  machineType?: string;
  location?: string;
  componentCode?: string;
  componentName?: string;
  drawingNumber?: string;
  unitOfMeasure?: string;
  cycleTimeMinutes?: number | null;
  categoryName?: string;
  isActive: boolean;
};

const schemas = {
  shifts: z.object({
    shiftName: z.string().trim().min(1, 'Enter a shift name'),
    startTime: z.string().min(1, 'Enter a start time'),
    endTime: z.string().min(1, 'Enter an end time'),
    breakMinutes: z.number().int().min(0, 'Break minutes cannot be negative'),
    isActive: z.boolean(),
  }),
  machines: z.object({
    machineCode: z.string().trim().min(1, 'Enter a machine code'),
    machineName: z.string().trim().min(1, 'Enter a machine name'),
    machineType: z.string().trim().min(1, 'Enter a machine type'),
    location: z.string().trim().min(1, 'Enter a location'),
    isActive: z.boolean(),
  }),
  components: z.object({
    componentCode: z.string().trim().min(1, 'Enter a component code'),
    componentName: z.string().trim().min(1, 'Enter a component name'),
    drawingNumber: z.string().trim().min(1, 'Enter a drawing number'),
    unitOfMeasure: z.string().trim().min(1, 'Enter a unit of measure'),
    cycleTimeMinutes: z.number().finite().min(0, 'Cycle time cannot be negative'),
    isActive: z.boolean(),
  }),
  'downtime-categories': z.object({
    categoryName: z.string().trim().min(1, 'Enter a category name'),
    isActive: z.boolean(),
  }),
};

const details: Record<MasterKind, string> = {
  shifts: 'Define working hours and break allowances for the current company.',
  machines: 'Maintain the equipment available to the current company.',
  components: 'Maintain the part catalogue for the current company.',
  'downtime-categories': 'Define the downtime categories available to production.',
};
const titles: Record<MasterKind, string> = {
  shifts: 'Shifts',
  machines: 'Machines',
  components: 'Components',
  'downtime-categories': 'Downtime Categories',
};

const singularTitles: Record<MasterKind, string> = {
  shifts: 'Shift',
  machines: 'Machine',
  components: 'Component',
  'downtime-categories': 'Downtime Category',
};

function getDetail(kind: MasterKind, id: number, companyId: number): Promise<MasterRow> {
  if (kind === 'shifts') return shiftApi.getById(id, companyId);
  if (kind === 'machines') return machineApi.getById(id, companyId);
  if (kind === 'components') return componentApi.getById(id, companyId);
  return downtimeCategoryApi.getById(id, companyId);
}

function getList(kind: MasterKind, companyId: number): Promise<MasterRow[]> {
  if (kind === 'shifts') return shiftApi.getAll(companyId);
  if (kind === 'machines') return machineApi.getAll(companyId);
  if (kind === 'components') return componentApi.getAll(companyId);
  return downtimeCategoryApi.getAll(companyId, false);
}

function toggleMaster(
  kind: Exclude<MasterKind, 'components'>,
  id: number,
  companyId: number,
) {
  if (kind === 'shifts') return shiftApi.toggleActive(id, companyId);
  if (kind === 'machines') return machineApi.toggleActive(id, companyId);
  return downtimeCategoryApi.toggleActive(id, companyId);
}

function defaults(kind: MasterKind): MasterFormValues {
  return { isActive: true, ...(kind === 'shifts' ? { breakMinutes: 0 } : {}) };
}

function MasterForm({
  kind,
  companyId,
  editingId,
  onDone,
  onBusyChange,
}: {
  kind: MasterKind;
  companyId: number;
  editingId: number | null;
  onDone: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const client = useQueryClient();
  const [formError, setFormError] = useState('');
  const detail = useQuery({
    queryKey: [kind, companyId, editingId],
    queryFn: () => getDetail(kind, editingId!, companyId),
    enabled: editingId !== null,
  });
  const { register, handleSubmit, reset, setError, formState: { errors } } =
    useForm<MasterFormValues>({ defaultValues: defaults(kind) });

  useEffect(() => {
    const value = detail.data;
    if (value)
      reset({
        ...value,
        ...(kind === 'components'
          ? { cycleTimeMinutes: (value as Component).cycleTimeMinutes ?? undefined }
          : {}),
      });
    else if (editingId === null) reset(defaults(kind));
  }, [detail.data, editingId, kind, reset]);

  const save = useMutation({
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false),
    mutationFn: (values: MasterFormValues) => {
      if (kind === 'shifts') {
        const payload = {
          shiftName: values.shiftName!,
          startTime: values.startTime!,
          endTime: values.endTime!,
          breakMinutes: values.breakMinutes!,
          isActive: values.isActive,
        } satisfies ShiftsCreateRequest;
        return editingId === null
          ? shiftApi.create(companyId, payload)
          : shiftApi.update(companyId, { ...payload, id: editingId } satisfies ShiftsUpdateRequest);
      }
      if (kind === 'machines') {
        const createPayload = {
          machineCode: values.machineCode!,
          machineName: values.machineName!,
          machineType: values.machineType!,
          location: values.location!,
          isActive: values.isActive,
        } satisfies MachinesCreateRequest;
        if (editingId === null) return machineApi.create(companyId, createPayload);
        const updatePayload = {
          id: editingId,
          machineName: values.machineName!,
          machineType: values.machineType!,
          location: values.location!,
          isActive: values.isActive,
        } satisfies MachinesUpdateRequest;
        return machineApi.update(companyId, updatePayload);
      }
      if (kind === 'downtime-categories') {
        const payload = {
          categoryName: values.categoryName!,
          isActive: values.isActive,
        } satisfies DowntimeCategoriesCreateRequest;
        if (editingId === null) return downtimeCategoryApi.create(companyId, payload);
        return downtimeCategoryApi.update(companyId, {
          ...payload,
          id: editingId,
        } satisfies DowntimeCategoriesUpdateRequest);
      }
      const createPayload = {
        componentCode: values.componentCode!,
        componentName: values.componentName!,
        drawingNumber: values.drawingNumber!,
        unitOfMeasure: values.unitOfMeasure!,
        cycleTimeMinutes: values.cycleTimeMinutes!,
        isActive: values.isActive,
      } satisfies ComponentsCreateRequest;
      if (editingId === null) return componentApi.create(companyId, createPayload);
      const updatePayload = {
        id: editingId,
        componentName: values.componentName!,
        drawingNumber: values.drawingNumber!,
        unitOfMeasure: values.unitOfMeasure!,
        cycleTimeMinutes: values.cycleTimeMinutes!,
        isActive: values.isActive,
      } satisfies ComponentsUpdateRequest;
      return componentApi.update(companyId, updatePayload);
    },
    onSuccess: async (result) => {
      toast.success(result.message);
      onBusyChange(false);
      onDone();
      await client.invalidateQueries({ queryKey: [kind, companyId] });
    },
    onError: (error) => {
      setFormError(errorText(error));
      if (error instanceof ApiError)
        for (const [field, messages] of Object.entries(error.fields)) {
          const key = field.replace(/^\$\./, '') as keyof MasterFormValues;
          setError(key, { message: messages.join(' ') });
        }
    },
  });

  if (editingId !== null && detail.isPending) return <LoadingSkeleton />;
  if (editingId !== null && detail.isError)
    return <ErrorState message={errorText(detail.error)} retry={() => detail.refetch()} />;

  const field = (name: keyof MasterFormValues, label: string, type = 'text', disabled = false) => (
    <label className="field">
      {label}
      <input
        type={type}
        disabled={disabled}
        step={type === 'number' ? '1' : undefined}
        {...register(name, type === 'number' ? { valueAsNumber: true } : {})}
        aria-invalid={!!errors[name]}
      />
      {errors[name] && <span className="field-error">{String(errors[name]?.message)}</span>}
    </label>
  );

  return (
    <form className="space-y-5" onSubmit={handleSubmit((values) => {
      setFormError('');
      const result = schemas[kind].safeParse(values);
      if (!result.success) {
        for (const issue of result.error.issues) {
          const key = issue.path[0] as keyof MasterFormValues;
          setError(key, { message: issue.message });
        }
        return;
      }
      if (!save.isPending) save.mutate(values);
    })}>
      <div className="grid gap-5 sm:grid-cols-2">
        {kind === 'shifts' && <>
          {field('shiftName', 'Shift name')}
          {field('startTime', 'Start time', 'time')}
          {field('endTime', 'End time', 'time')}
          {field('breakMinutes', 'Break minutes', 'number')}
        </>}
        {kind === 'machines' && <>
          {field('machineCode', 'Machine code', 'text', editingId !== null)}
          {field('machineName', 'Machine name')}
          {field('machineType', 'Machine type')}
          {field('location', 'Location')}
        </>}
        {kind === 'components' && <>
          {field('componentCode', 'Component code', 'text', editingId !== null)}
          {field('componentName', 'Component name')}
          {field('drawingNumber', 'Drawing number')}
          {field('unitOfMeasure', 'Unit of measure')}
          {field('cycleTimeMinutes', 'Cycle time (minutes)', 'number')}
        </>}
        {kind === 'downtime-categories' && <>
          {field('categoryName', 'Category name')}
        </>}
      </div>
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" {...register('isActive')} /> Active
      </label>
      {formError && <p role="alert" className="error-box">{formError}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={save.isPending}>Cancel</Button>
        <Button type="submit" disabled={save.isPending}>{save.isPending ? 'Saving...' : editingId === null ? `Create ${singularTitles[kind]}` : 'Save changes'}</Button>
      </div>
    </form>
  );
}

function rowName(kind: MasterKind, row: MasterRow) {
  if (kind === 'shifts') return (row as Shift).shiftName;
  if (kind === 'machines') return (row as Machine).machineName;
  if (kind === 'components') return (row as Component).componentName;
  return (row as DowntimeCategory).categoryName;
}

export function MasterPage({ kind }: { kind: MasterKind }) {
  const companyId = useAuthStore((state) => state.session?.companyId);
  const client = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formBusy, setFormBusy] = useState(false);
  const [toggleTarget, setToggleTarget] = useState<MasterRow | null>(null);
  const validCompanyId = typeof companyId === 'number' && Number.isInteger(companyId) && companyId > 0;
  const list = useQuery({
    queryKey: [kind, companyId],
    queryFn: () => getList(kind, companyId!),
    enabled: validCompanyId,
  });
  const toggle = useMutation({
    mutationFn: () => {
      if (kind === 'components')
        throw new ApiError('Component active status has no documented toggle endpoint.');
      return toggleMaster(kind, toggleTarget!.id, companyId!);
    },
    onSuccess: async (result) => {
      toast.success(result.message);
      setToggleTarget(null);
      await client.invalidateQueries({ queryKey: [kind, companyId] });
    },
    onError: (error) => toast.error(errorText(error)),
  });
  const openCreate = () => { setEditingId(null); setFormOpen(true); };
  const openEdit = (row: MasterRow) => { setEditingId(row.id); setFormOpen(true); };
  const closeForm = () => { if (!formBusy) { setFormOpen(false); setEditingId(null); } };

  if (!validCompanyId)
    return <ErrorState message="Your session does not include a company workspace. Sign in again or contact your administrator." />;

  return <>
    <div className="page-heading">
      <div><p className="eyebrow">MASTERS</p><h1>{titles[kind]}</h1><p>{details[kind]}</p></div>
      <PermissionGate route={`/masters/${kind}`} permission="ADD"><Button onClick={openCreate}><Plus size={16} /> Add {singularTitles[kind]}</Button></PermissionGate>
    </div>
    <section className="panel">
      <div className="toolbar no-print">
        <p className="text-sm text-slate-500">Company workspace records</p>
        <Button className="ml-auto" size="icon" variant="ghost" disabled={list.isFetching} onClick={() => list.refetch()} aria-label={`Refresh ${titles[kind].toLowerCase()}`}><RefreshCw size={16} /></Button>
      </div>
      {list.isPending ? <LoadingSkeleton /> : list.isError ? <ErrorState message={errorText(list.error)} retry={() => list.refetch()} /> : !list.data?.length ? <EmptyState title={`No ${kind} found`} description={`Create the first ${kind.slice(0, -1)} for this company workspace.`} /> :
        <div className="overflow-x-auto"><table><thead><tr>
          <th>Name</th>{kind === 'shifts' && <><th>Start</th><th>End</th><th>Break</th></>}{kind === 'machines' && <><th>Code</th><th>Type</th><th>Location</th></>}{kind === 'components' && <><th>Code</th><th>Drawing</th><th>Unit</th><th>Cycle time</th></>}<th>Status</th><th className="no-print">Actions</th>
        </tr></thead><tbody>{list.data.map((row) => <tr key={row.id}>
          <td className="font-medium text-slate-900">{rowName(kind, row)}</td>
          {kind === 'shifts' && <><td>{(row as Shift).startTime}</td><td>{(row as Shift).endTime}</td><td>{(row as Shift).breakMinutes}</td></>}
          {kind === 'machines' && <><td>{(row as Machine).machineCode}</td><td>{(row as Machine).machineType}</td><td>{(row as Machine).location}</td></>}
          {kind === 'components' && <><td>{(row as Component).componentCode}</td><td>{(row as Component).drawingNumber}</td><td>{(row as Component).unitOfMeasure}</td><td>{(row as Component).cycleTimeMinutes == null ? '-' : `${(row as Component).cycleTimeMinutes} min`}</td></>}
          <td><StatusBadge value={row.isActive} /></td><td className="no-print"><div className="flex flex-wrap gap-2"><PermissionGate route={`/masters/${kind}`} permission="EDIT"><Button variant="outline" size="sm" onClick={() => openEdit(row)}><Pencil size={14} /> Edit</Button><Button variant="outline" size="sm" disabled={kind === 'components'} title={kind === 'components' ? 'Component status changes are not available yet.' : undefined} onClick={() => { if (kind !== 'components') setToggleTarget(row); }}><Power size={14} /> {row.isActive ? 'Deactivate' : 'Activate'}</Button></PermissionGate></div></td>
        </tr>)}</tbody></table></div>}
    </section>
    <FormDialog open={formOpen} onOpenChange={(open) => !open && closeForm()} title={`${editingId === null ? 'Add' : 'Edit'} ${singularTitles[kind]}`} description={details[kind]}>
      <MasterForm kind={kind} companyId={companyId} editingId={editingId} onDone={() => { setFormOpen(false); setEditingId(null); }} onBusyChange={setFormBusy} />
    </FormDialog>
    <ConfirmDialog open={!!toggleTarget} title={toggleTarget ? `${toggleTarget.isActive ? 'Deactivate' : 'Activate'} ${rowName(kind, toggleTarget)}?` : 'Change record status?'} description={toggleTarget ? `This will ${toggleTarget.isActive ? 'deactivate' : 'activate'} ${rowName(kind, toggleTarget)}${toggleTarget.isActive ? '. It will no longer be available for new use.' : ' and make it available for use.'}` : 'Change the record status.'} busy={toggle.isPending} onCancel={() => setToggleTarget(null)} onConfirm={() => !toggle.isPending && toggle.mutate()} />
  </>;
}
