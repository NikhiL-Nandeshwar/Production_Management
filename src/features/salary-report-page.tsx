'use client';

import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endOfWeek, format, startOfMonth, startOfWeek } from 'date-fns';
import { Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import type { SalaryRecord, User } from '@/types/api';
import type {
  GenerateBulkSalaryRequest,
  GenerateSingleSalaryRequest,
  SalaryRecordListParams,
} from '@/types/requests';
import {
  generateBulkSalary,
  generateSingleSalary,
  getSalaryRecords,
} from '@/lib/api/salary-records';
import { getUsers } from '@/lib/api/users';
import { errorText } from '@/lib/api/errors';
import { formatCurrency, formatDate, formatNumber } from '@/utils/format';
import { Button } from '@/components/ui/button';
import { FormDialog } from '@/components/ui/dialog';
import { DataTablePagination } from '@/components/tables/pagination';
import {
  EmptyState,
  ErrorState,
  LoadingSkeleton,
  StatusBadge,
} from '@/components/common/states';
import { PermissionGate } from '@/components/common/gates';

type DatePreset = 'week' | 'month' | 'custom';
type Generator = 'single' | 'bulk' | null;
type ReportFilters = {
  preset: DatePreset;
  fromDate: string;
  toDate: string;
  userId: string;
  status: '' | 'Draft';
};

const dateInput = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a valid date');
const amount = z.coerce.number().finite().min(0, 'Must be zero or greater');
const generationFields = {
  fromDate: dateInput,
  toDate: dateInput,
  incentiveAmount: amount,
  deductionAmount: amount,
};
const withValidDates = <T extends z.ZodRawShape>(schema: z.ZodObject<T>) =>
  schema.refine((values) => values.fromDate <= values.toDate, {
    path: ['toDate'],
    message: 'End date must be on or after start date.',
  });
const singleSchema = withValidDates(
  z.object({
    ...generationFields,
    userId: z.coerce.number().int().positive('Select an employee'),
  }),
);
const bulkSchema = withValidDates(
  z.object({
    ...generationFields,
    userIds: z.array(z.number().int().positive()).min(1, 'Select at least one employee'),
  }),
);
type SingleValues = z.infer<typeof singleSchema>;
type BulkValues = z.infer<typeof bulkSchema>;

const dateString = (value: Date) => format(value, 'yyyy-MM-dd');
function thisWeek() {
  const today = new Date();
  return {
    fromDate: dateString(startOfWeek(today, { weekStartsOn: 1 })),
    toDate: dateString(endOfWeek(today, { weekStartsOn: 1 })),
  };
}
function thisMonth() {
  const today = new Date();
  return {
    fromDate: dateString(startOfMonth(today)),
    toDate: dateString(today),
  };
}
function employeeName(user: User) {
  return user.displayName || user.username;
}

function FormActions({
  busy,
  onCancel,
  label,
}: {
  busy: boolean;
  onCancel: () => void;
  label: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <Button type="button" variant="outline" disabled={busy} onClick={onCancel}>
        Cancel
      </Button>
      <Button type="submit" disabled={busy}>
        {busy ? 'Generating...' : label}
      </Button>
    </div>
  );
}

function SingleGenerationForm({
  companyId,
  users,
  usersLoading,
  onGenerated,
  onDone,
}: {
  companyId: number;
  users: User[];
  usersLoading: boolean;
  onGenerated: () => void;
  onDone: () => void;
}) {
  const queryClient = useQueryClient();
  const defaults = thisMonth();
  const { register, handleSubmit, formState: { errors } } = useForm<SingleValues>({
    resolver: zodResolver(singleSchema),
    defaultValues: { ...defaults, userId: 0, incentiveAmount: 0, deductionAmount: 0 },
  });
  const generate = useMutation({
    mutationFn: (values: SingleValues) =>
      generateSingleSalary(companyId, values as GenerateSingleSalaryRequest),
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ['salary-records', companyId] });
      onGenerated();
      onDone();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <form className="space-y-5" onSubmit={handleSubmit((values) => generate.mutate(values))}>
      <label className="field">Employee
        <select {...register('userId', { valueAsNumber: true })} disabled={usersLoading} aria-invalid={!!errors.userId}>
          <option value={0}>{usersLoading ? 'Loading employees...' : 'Select an employee'}</option>
          {users.map((user) => <option key={user.id} value={user.id}>{employeeName(user)} ({user.username})</option>)}
        </select>
        {errors.userId && <span className="field-error">{errors.userId.message}</span>}
      </label>
      <GenerationFields register={register} errors={errors} />
      <FormActions busy={generate.isPending} onCancel={onDone} label="Generate salary" />
    </form>
  );
}

function GenerationFields({ register, errors }: { register: ReturnType<typeof useForm<SingleValues>>['register']; errors: ReturnType<typeof useForm<SingleValues>>['formState']['errors'] }) {
  return <>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="field">From date<input type="date" {...register('fromDate')} aria-invalid={!!errors.fromDate} />{errors.fromDate && <span className="field-error">{errors.fromDate.message}</span>}</label>
      <label className="field">To date<input type="date" {...register('toDate')} aria-invalid={!!errors.toDate} />{errors.toDate && <span className="field-error">{errors.toDate.message}</span>}</label>
    </div>
    <div className="grid gap-5 sm:grid-cols-2">
      <label className="field">Incentive amount<input type="number" min="0" step="any" {...register('incentiveAmount', { valueAsNumber: true })} aria-invalid={!!errors.incentiveAmount} />{errors.incentiveAmount && <span className="field-error">{errors.incentiveAmount.message}</span>}</label>
      <label className="field">Deduction amount<input type="number" min="0" step="any" {...register('deductionAmount', { valueAsNumber: true })} aria-invalid={!!errors.deductionAmount} />{errors.deductionAmount && <span className="field-error">{errors.deductionAmount.message}</span>}</label>
    </div>
  </>;
}

function BulkGenerationForm({ companyId, users, usersLoading, onGenerated, onDone }: { companyId: number; users: User[]; usersLoading: boolean; onGenerated: () => void; onDone: () => void }) {
  const queryClient = useQueryClient();
  const defaults = thisMonth();
  const { register, handleSubmit, control, formState: { errors } } = useForm<BulkValues>({
    resolver: zodResolver(bulkSchema),
    defaultValues: { ...defaults, userIds: [], incentiveAmount: 0, deductionAmount: 0 },
  });
  const generate = useMutation({
    mutationFn: (values: BulkValues) => generateBulkSalary(companyId, values as GenerateBulkSalaryRequest),
    onSuccess: async (result) => {
      toast.success(result.message);
      await queryClient.invalidateQueries({ queryKey: ['salary-records', companyId] });
      onGenerated();
      onDone();
    },
    onError: (error) => toast.error(errorText(error)),
  });
  return (
    <form className="space-y-5" onSubmit={handleSubmit((values) => generate.mutate(values))}>
      <label className="field">Employees
        <Controller name="userIds" control={control} render={({ field }) => (
          <select multiple className="min-h-36" value={field.value.map(String)} disabled={usersLoading} aria-invalid={!!errors.userIds} onChange={(event) => field.onChange(Array.from(event.currentTarget.selectedOptions, (option) => Number(option.value)))}>
            {users.map((user) => <option key={user.id} value={user.id}>{employeeName(user)} ({user.username})</option>)}
          </select>
        )} />
        <span className="text-xs text-slate-500">Hold Ctrl or Cmd to select more than one employee.</span>
        {errors.userIds && <span className="field-error">{errors.userIds.message}</span>}
      </label>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">From date<input type="date" {...register('fromDate')} aria-invalid={!!errors.fromDate} />{errors.fromDate && <span className="field-error">{errors.fromDate.message}</span>}</label>
        <label className="field">To date<input type="date" {...register('toDate')} aria-invalid={!!errors.toDate} />{errors.toDate && <span className="field-error">{errors.toDate.message}</span>}</label>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="field">Incentive amount<input type="number" min="0" step="any" {...register('incentiveAmount', { valueAsNumber: true })} aria-invalid={!!errors.incentiveAmount} />{errors.incentiveAmount && <span className="field-error">{errors.incentiveAmount.message}</span>}</label>
        <label className="field">Deduction amount<input type="number" min="0" step="any" {...register('deductionAmount', { valueAsNumber: true })} aria-invalid={!!errors.deductionAmount} />{errors.deductionAmount && <span className="field-error">{errors.deductionAmount.message}</span>}</label>
      </div>
      <FormActions busy={generate.isPending} onCancel={onDone} label="Generate bulk salary" />
    </form>
  );
}

function SalaryRows({ records }: { records: SalaryRecord[] }) {
  return <div className="overflow-x-auto"><table><thead><tr><th>Employee</th><th>From date</th><th>To date</th><th>Salary / hour</th><th>Total work hours</th><th>OT hours</th><th>Base amount</th><th>Overtime amount</th><th>Incentive</th><th>Deduction</th><th>Final amount</th><th>Status</th></tr></thead><tbody>{records.map((record) => <tr key={record.id}><td><span className="font-medium text-slate-900">{record.displayName}</span><small className="block text-slate-400">{record.userName}</small></td><td>{formatDate(record.fromDate)}</td><td>{formatDate(record.toDate)}</td><td>{formatCurrency(record.salaryPerHourSnapshot)}</td><td>{formatNumber(record.totalWorkHours)}</td><td>{formatNumber(record.totalOtHours)}</td><td>{formatCurrency(record.baseAmount)}</td><td>{formatCurrency(record.overtimeAmount)}</td><td>{formatCurrency(record.incentiveAmount)}</td><td>{formatCurrency(record.deductionAmount)}</td><td className="font-medium text-slate-900">{formatCurrency(record.finalAmount)}</td><td><StatusBadge value={record.status} /></td></tr>)}</tbody></table></div>;
}

export function SalaryReportPage() {
  const companyId = useAuthStore((state) => state.session?.companyId);
  const [generator, setGenerator] = useState<Generator>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filters, setFilters] = useState<ReportFilters>({ preset: 'month', ...thisMonth(), userId: '', status: '' });
  const validCompanyId = typeof companyId === 'number' && Number.isInteger(companyId) && companyId > 0;
  const datesValid = !!filters.fromDate && !!filters.toDate && filters.fromDate <= filters.toDate;
  const params = useMemo<SalaryRecordListParams>(() => ({ FromDate: filters.fromDate || undefined, ToDate: filters.toDate || undefined, ...(filters.userId ? { UserId: Number(filters.userId) } : {}), ...(filters.status ? { Status: filters.status } : {}), Page: page, PageSize: pageSize, companyId: companyId! }), [companyId, filters, page, pageSize]);
  const report = useQuery({ queryKey: ['salary-records', companyId, params], queryFn: () => getSalaryRecords(params), enabled: validCompanyId && datesValid });
  const employees = useQuery({ queryKey: ['users', companyId], queryFn: () => getUsers(companyId!), enabled: validCompanyId });
  const changeFilters = (next: Partial<ReportFilters>) => { setFilters((current) => ({ ...current, ...next })); setPage(1); };
  const selectPreset = (preset: DatePreset) => {
    if (preset === 'week') changeFilters({ preset, ...thisWeek() });
    else if (preset === 'month') changeFilters({ preset, ...thisMonth() });
    else changeFilters({ preset, fromDate: '', toDate: '' });
  };
  const closeGenerator = () => setGenerator(null);
  if (!validCompanyId) return <ErrorState message="Your session does not include a company workspace. Sign in again or contact your administrator." />;
  return <>
    <div className="page-heading"><div><p className="eyebrow">REPORTS</p><h1>Salary Report</h1><p>Review backend-calculated salary records and generate salary for a selected period.</p></div><PermissionGate route="/reports/salary" permission="ADD"><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => setGenerator('single')}><Plus size={16} />Generate salary</Button><Button onClick={() => setGenerator('bulk')}><Users size={16} />Generate bulk salary</Button></div></PermissionGate></div>
    <section className="panel"><div className="filters no-print"><label className="field">Date range<select value={filters.preset} onChange={(event) => selectPreset(event.target.value as DatePreset)}><option value="week">This Week</option><option value="month">This Month</option><option value="custom">Custom Range</option></select></label>{filters.preset === 'custom' && <><label className="field">From date<input type="date" value={filters.fromDate} onChange={(event) => changeFilters({ fromDate: event.target.value })} /></label><label className="field">To date<input type="date" value={filters.toDate} onChange={(event) => changeFilters({ toDate: event.target.value })} /></label></>}<label className="field">Employee<select value={filters.userId} onChange={(event) => changeFilters({ userId: event.target.value })} disabled={employees.isPending}><option value="">All employees</option>{employees.data?.map((user) => <option key={user.id} value={user.id}>{employeeName(user)}</option>)}</select></label><label className="field">Status<select value={filters.status} onChange={(event) => changeFilters({ status: event.target.value as '' | 'Draft' })}><option value="">All</option><option value="Draft">Draft</option></select></label><Button variant="outline" className="self-end h-10 border-teal-200 bg-teal-50 text-teal-900 hover:bg-teal-100 hover:text-teal-950" disabled={!datesValid || report.isFetching} onClick={() => { setPage(1); report.refetch(); }}>Apply</Button></div>{filters.preset === 'custom' && !datesValid ? <ErrorState message="Select a valid date range to load salary records." /> : report.isPending ? <LoadingSkeleton /> : report.isError ? <ErrorState message={errorText(report.error)} retry={() => report.refetch()} /> : !report.data?.items.length ? <EmptyState title="No salary records found" description="No salary records found for the selected period." /> : <SalaryRows records={report.data.items} />}{report.data && <DataTablePagination page={report.data.pageNumber} pageSize={report.data.pageSize} total={report.data.totalCount} count={report.data.items.length} onPage={setPage} onSize={(size) => { setPageSize(size); setPage(1); }} />}</section>
    <FormDialog open={generator !== null} onOpenChange={(open) => { if (!open) closeGenerator(); }} title={generator === 'bulk' ? 'Generate bulk salary' : 'Generate salary'} description="The backend calculates and returns the salary record; this form only sends the selected inputs.">{generator === 'single' ? <SingleGenerationForm companyId={companyId} users={employees.data || []} usersLoading={employees.isPending || employees.isError} onGenerated={() => setPage(1)} onDone={closeGenerator} /> : generator === 'bulk' ? <BulkGenerationForm companyId={companyId} users={employees.data || []} usersLoading={employees.isPending || employees.isError} onGenerated={() => setPage(1)} onDone={closeGenerator} /> : null}</FormDialog>
  </>;
}
