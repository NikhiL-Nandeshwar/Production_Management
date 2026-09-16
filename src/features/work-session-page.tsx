'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth-store';
import * as shiftApi from '@/lib/api/shifts';
import * as machineApi from '@/lib/api/machines';
import * as componentApi from '@/lib/api/components';
import * as downtimeCategoryApi from '@/lib/api/downtime-categories';
import * as workSessionApi from '@/lib/api/work-sessions';
import type { WorkSession } from '@/types/api';
import type {
  WorkSessionsCreateRequest,
  WorkSessionsUpdateRequest,
} from '@/types/requests';
import { errorText } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import {
  ErrorState,
  LoadingSkeleton,
} from '@/components/common/states';

function currentTime() {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

function nonNegative(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function timeDuration(start: string, end: string) {
  if (!start || !end) return 0;
  const [startHours, startMinutes] = start.split(':').map(Number);
  const [endHours, endMinutes] = end.split(':').map(Number);
  if (![startHours, startMinutes, endHours, endMinutes].every(Number.isFinite)) return 0;
  const startTotal = startHours * 60 + startMinutes;
  let endTotal = endHours * 60 + endMinutes;
  if (endTotal <= startTotal) endTotal += 24 * 60;
  return endTotal - startTotal;
}

function displayNumber(value: number, suffix = '') {
  return Number.isFinite(value) ? `${value.toFixed(2).replace(/\.00$/, '')}${suffix}` : '—';
}

function toIso(workDate: string, time: string) {
  return new Date(`${workDate}T${time}:00`).toISOString();
}

function displayDateTime(value: string | null) {
  if (!value) return 'Not available';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function timeInputValue(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ''
    : `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function elapsedSeconds(value: string) {
  const start = Date.parse(value);
  return Number.isFinite(start) ? Math.max(0, Math.floor((Date.now() - start) / 1000)) : 0;
}

function formatElapsed(seconds: number) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
}

type DowntimeState = { enabled: boolean; minutes: string };

function restoredDowntimeState(value: WorkSession) {
  return Object.fromEntries(
    value.downtimes.map((item) => [
      item.downtimeCategoryId,
      { enabled: true, minutes: String(item.durationMinutes) },
    ]),
  );
}

export function WorkSessionPage() {
  const session = useAuthStore((state) => state.session);
  const companyId = session?.companyId;
  const today = new Date().toISOString().slice(0, 10);
  const [workDate, setWorkDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [shiftId, setShiftId] = useState('');
  const [machineId, setMachineId] = useState('');
  const [componentId, setComponentId] = useState('');
  const [startTime, setStartTime] = useState(currentTime);
  const [endTime, setEndTime] = useState('');
  const [norms, setNorms] = useState('60');
  const [qtyOk, setQtyOk] = useState('0');
  const [rework, setRework] = useState('0');
  const [machiningRejection, setMachiningRejection] = useState('0');
  const [castingRejection, setCastingRejection] = useState('0');
  const [overtimeHours, setOvertimeHours] = useState('0');
  const [overtimeMinutes, setOvertimeMinutes] = useState('0');
  const [downtime, setDowntime] = useState<Record<number, DowntimeState>>({});
  const [activeSession, setActiveSession] = useState<WorkSession | null>(null);
  const [completedSession, setCompletedSession] = useState<WorkSession | null>(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [sessionError, setSessionError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const validCompanyId =
    !!session && typeof companyId === 'number' && companyId > 0;
  const shifts = useQuery({
    queryKey: ['work-session-shifts', companyId],
    queryFn: () => shiftApi.getAll(companyId!),
    enabled: validCompanyId,
  });
  const machines = useQuery({
    queryKey: ['work-session-machines', companyId],
    queryFn: () => machineApi.getAll(companyId!),
    enabled: validCompanyId,
  });
  const components = useQuery({
    queryKey: ['work-session-components', companyId],
    queryFn: () => componentApi.getAll(companyId!),
    enabled: validCompanyId,
  });
  const downtimeCategories = useQuery({
    queryKey: ['work-session-downtime-categories', companyId],
    queryFn: () => downtimeCategoryApi.getAll(companyId!, true),
    enabled: validCompanyId,
  });
  const activeSessionQuery = useQuery({
    queryKey: ['work-session-active', companyId, session?.userId],
    queryFn: () => workSessionApi.getAll(companyId!, session!.userId),
    enabled: validCompanyId && typeof session?.userId === 'number',
  });
  const completedSessionQuery = useQuery({
    queryKey: ['work-session-completed', companyId, session?.userId, today],
    queryFn: () => workSessionApi.getAll(companyId!, session!.userId, 'Completed', today),
    enabled: validCompanyId && typeof session?.userId === 'number',
  });
  useEffect(() => {
    const restored = activeSessionQuery.data?.find(
      (value) =>
        value.status === 'Open' &&
        value.companyId === companyId &&
        value.operatorUserId === session?.userId,
    );
    if (!restored) return;
    const restore = window.setTimeout(() => {
      // The verified example has status Open with a non-null outTime; confirm this inconsistency with the backend team.
      setActiveSession(restored);
      setSessionEnded(false);
      setWorkDate(restored.workDate);
      setShiftId(String(restored.shiftId));
      setMachineId(String(restored.machineId));
      setComponentId(String(restored.componentId));
      setStartTime(timeInputValue(restored.inTime));
      setEndTime(restored.outTime ? timeInputValue(restored.outTime) : '');
      setNorms(String(restored.normsMinutes));
      setQtyOk(String(restored.qtyOk));
      setRework(String(restored.reworkQty));
      setMachiningRejection(String(restored.machiningRejectionQty));
      setCastingRejection(String(restored.castingRejectionQty));
      setOvertimeHours(String(Math.floor(restored.overtimeMinutes / 60)));
      setOvertimeMinutes(String(restored.overtimeMinutes % 60));
      setDowntime(restoredDowntimeState(restored));
    }, 0);
    return () => window.clearTimeout(restore);
  }, [activeSessionQuery.data, companyId, session?.userId]);
  useEffect(() => {
    if (completedSessionQuery.error) {
      const clear = window.setTimeout(() => setCompletedSession(null), 0);
      return () => window.clearTimeout(clear);
    }
    const latest = completedSessionQuery.data
      ?.filter(
        (value) =>
          value.status === 'Completed' &&
          value.companyId === companyId &&
          value.operatorUserId === session?.userId,
      )
      .sort(
        (left, right) =>
          Date.parse(right.updatedAt || right.createdAt) -
          Date.parse(left.updatedAt || left.createdAt),
      )[0];
    const restore = window.setTimeout(() => setCompletedSession(latest ?? null), 0);
    return () => window.clearTimeout(restore);
  }, [completedSessionQuery.data, completedSessionQuery.error, companyId, session?.userId]);
  useEffect(() => {
    if (!activeSession || sessionEnded) return;
    const update = () => setElapsed(elapsedSeconds(activeSession.inTime));
    update();
    const timer = window.setInterval(update, 1000);
    return () => window.clearInterval(timer);
  }, [activeSession, sessionEnded]);
  const lookupError =
    shifts.error ||
    machines.error ||
    components.error ||
    downtimeCategories.error || activeSessionQuery.error;
  const lookupLoading =
    shifts.isPending ||
    machines.isPending ||
    components.isPending ||
    downtimeCategories.isPending || activeSessionQuery.isPending;
  const canStart = Boolean(workDate && shiftId && machineId && componentId && startTime);
  const selectedComponent = components.data?.find(
    (component) => String(component.id) === componentId,
  );
  const selectedShift = shifts.data?.find((shift) => String(shift.id) === shiftId);
  const cycleTime = selectedComponent?.cycleTimeMinutes ?? null;
  const shiftDuration = selectedShift
    ? timeDuration(selectedShift.startTime.slice(0, 5), selectedShift.endTime.slice(0, 5))
    : 0;
  const normsMinutes = nonNegative(norms);
  const totalQty =
    nonNegative(qtyOk) +
    nonNegative(rework) +
    nonNegative(machiningRejection) +
    nonNegative(castingRejection);
  const totalDowntimeMinutes = (downtimeCategories.data ?? []).reduce(
    (total, category) => {
      const value = downtime[category.id];
      return total + (value?.enabled ? nonNegative(value.minutes) : 0);
    },
    0,
  );
  const overtimeMinutesTotal = nonNegative(overtimeHours) * 60 + nonNegative(overtimeMinutes);
  const availableProductionTime = Math.max(
    0,
    shiftDuration - normsMinutes - totalDowntimeMinutes + overtimeMinutesTotal,
  );
  const idealQty =
    cycleTime !== null && cycleTime > 0 ? availableProductionTime / cycleTime : 0;
  const efficiency = idealQty > 0 ? (totalQty / idealQty) * 100 : 0;
  const finalActualWorkHours =
    cycleTime !== null && cycleTime > 0
      ? (totalQty * cycleTime + totalDowntimeMinutes + overtimeMinutesTotal) / 60
      : Number.NaN;
  const updateDowntime = (id: number, update: Partial<DowntimeState>) =>
    setDowntime((current) => ({
      ...current,
      [id]: { ...(current[id] ?? { enabled: false, minutes: '0' }), ...update },
    }));
  const createSession = useMutation({
    mutationFn: (payload: WorkSessionsCreateRequest) =>
      workSessionApi.create(companyId!, payload),
    onSuccess: (result) => {
      toast.success(result.message || 'Work session started successfully.');
      setActiveSession(result.data);
      setCompletedSession(null);
      setSessionEnded(false);
      setSessionError('');
      setDowntime(restoredDowntimeState(result.data));
    },
    onError: (error) => setSessionError(errorText(error)),
  });
  const completeSession = useMutation({
    mutationFn: (id: number) => workSessionApi.complete(companyId!, id),
    onSuccess: (result) => {
      toast.success(result.message || 'Work session completed successfully.');
      setCompletedSession(result.data);
      setActiveSession(null);
      setSessionEnded(true);
      setSessionError('');
      setEndTime('');
      setWorkDate(new Date().toISOString().slice(0, 10));
      setShiftId('');
      setMachineId('');
      setComponentId('');
      setStartTime(currentTime());
      setNorms('60');
      setQtyOk('0');
      setRework('0');
      setMachiningRejection('0');
      setCastingRejection('0');
      setOvertimeHours('0');
      setOvertimeMinutes('0');
      setDowntime({});
    },
    onError: (error) => setSessionError(`Completion failed: ${errorText(error)}`),
  });
  const updateSession = useMutation({
    mutationFn: (payload: WorkSessionsUpdateRequest) =>
      workSessionApi.update(companyId!, payload),
    onSuccess: (result) => {
      setActiveSession(result.data);
      setSessionEnded(false);
      setSessionError('');
      setDowntime(restoredDowntimeState(result.data));
      completeSession.mutate(result.data.id);
    },
    onError: (error) => setSessionError(errorText(error)),
  });
  const startSession = () => {
    if (!canStart || createSession.isPending || activeSession) return;
    setSessionError('');
    createSession.mutate({
      operatorUserId: session!.userId,
      workDate,
      shiftId: Number(shiftId),
      machineId: Number(machineId),
      componentId: Number(componentId),
      inTime: toIso(workDate, startTime),
      normsMinutes,
      remarks: '',
    });
  };
  const endSession = () => {
    if (!activeSession || sessionEnded || updateSession.isPending || completeSession.isPending) return;
    const capturedOutTime = currentTime();
    setEndTime(capturedOutTime);
    setSessionError('');
    updateSession.mutate({
      id: activeSession.id,
      operatorUserId: session!.userId,
      workDate,
      shiftId: Number(shiftId),
      machineId: Number(machineId),
      componentId: Number(componentId),
      inTime: toIso(workDate, startTime),
      outTime: toIso(workDate, capturedOutTime),
      normsMinutes,
      qtyOk: nonNegative(qtyOk),
      reworkQty: nonNegative(rework),
      machiningRejectionQty: nonNegative(machiningRejection),
      castingRejectionQty: nonNegative(castingRejection),
      machineBreakdownMinutes: 0,
      powerOffMinutes: 0,
      noLoadMinutes: 0,
      settingMinutes: 0,
      unloadingMinutes: 0,
      overtimeMinutes: overtimeMinutesTotal,
      remarks: '',
      downtimes: (downtimeCategories.data ?? [])
        .filter((category) => downtime[category.id]?.enabled)
        .map((category) => ({
          downtimeCategoryId: category.id,
          durationMinutes: nonNegative(downtime[category.id]?.minutes || '0'),
          remarks: '',
        })),
    });
  };
    const savedSummary = completedSession ?? activeSession;
    const summaryShiftDuration = savedSummary?.shiftDurationMinutes ?? shiftDuration;
    const summaryNorms = savedSummary?.normsMinutes ?? normsMinutes;
    const summaryDowntime = savedSummary
      ? savedSummary.downtimes.reduce((total, item) => total + item.durationMinutes, 0)
      : totalDowntimeMinutes;
    const summaryOvertime = savedSummary?.overtimeMinutes ?? overtimeMinutesTotal;
    const summaryAvailable =
      savedSummary?.availableProductionMinutes ?? availableProductionTime;
    const summaryCycleTime = savedSummary ? savedSummary.cycleTimeMinutes : cycleTime;
    const summaryTotalQty = savedSummary?.totalQty ?? totalQty;
    const summaryIdealQty = savedSummary?.idealQty ?? idealQty;
    const summaryEfficiency = savedSummary?.efficiencyPercentage ?? efficiency;
    const summaryActualHours = savedSummary?.actualWorkHours ?? finalActualWorkHours;

  if (!validCompanyId)
    return (
      <ErrorState message="Your session does not include a company workspace. Sign in again or contact your administrator." />
    );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PRODUCTION</p>
          <h1>Work Sessions</h1>
          <p>Start and track the operator&apos;s production work.</p>
        </div>
      </div>
      <section className="panel p-4">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Start Session</h2>
            <p className="mt-1 text-sm text-slate-500">Record the work details before production begins.</p>
          </div>
          <span className="badge">Today / Recent Sessions</span>
        </div>
        <div className="mb-6 border border-slate-200 p-4">
          <p className="eyebrow">WORK SESSION DETAILS</p>
          <label className="field mt-3 max-w-md">
            Operator Name
            <input value={session.displayName} readOnly aria-readonly="true" />
          </label>
        </div>
        <div className="border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Work Details</h3>
          {lookupLoading ? (
            <LoadingSkeleton />
          ) : lookupError ? (
            <ErrorState
              message={errorText(lookupError)}
              retry={() => {
                void shifts.refetch();
                void machines.refetch();
                void components.refetch();
                void downtimeCategories.refetch();
                void activeSessionQuery.refetch();
              }}
            />
          ) : (
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <label className="field">
                Work Date
                <input type="date" required value={workDate} onChange={(event) => setWorkDate(event.target.value)} />
              </label>
              <label className="field">
                Shift
                <select required value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
                  <option value="">Select a shift</option>
                  {shifts.data?.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.shiftName}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Machine
                <select required value={machineId} onChange={(event) => setMachineId(event.target.value)}>
                  <option value="">Select a machine</option>
                  {machines.data?.map((machine) => (
                    <option key={machine.id} value={machine.id}>
                      {machine.machineName} ({machine.machineCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Component
                <select required value={componentId} onChange={(event) => setComponentId(event.target.value)}>
                  <option value="">Select a component</option>
                  {components.data?.map((component) => (
                    <option key={component.id} value={component.id}>
                      {component.componentName} ({component.componentCode})
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Cycle Time
                <input
                  value={cycleTime == null ? 'Not available' : `${cycleTime} minutes`}
                  readOnly
                  aria-readonly="true"
                />
              </label>
              <label className="field">
                In Time
                <input type="time" required value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </label>
              <label className="field">
                Out Time
                <input type="time" value={endTime} onChange={(event) => setEndTime(event.target.value)} disabled title="Completion is unavailable until the verified Work Session API contract is connected." />
              </label>
            </div>
          )}
          {!lookupLoading && !lookupError && !activeSession && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" disabled={!canStart || createSession.isPending} onClick={startSession}>
                {createSession.isPending ? 'Starting...' : 'Start Session'}
              </Button>
            </div>
          )}
          {activeSession && !sessionEnded && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" disabled={updateSession.isPending || completeSession.isPending} onClick={endSession}>
                {updateSession.isPending || completeSession.isPending ? 'Ending...' : 'End Session'}
              </Button>
            </div>
          )}
          {sessionError && <p role="alert" className="error-box mt-4">{sessionError}</p>}
        </div>
        {completedSessionQuery.error && (
          <p role="alert" className="error-box mt-4">
            Unable to load today&apos;s completed session: {errorText(completedSessionQuery.error)}
          </p>
        )}
        <div className="mt-6 border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Norms / Allowed Time</h3>
          <p className="mt-1 text-sm text-slate-500">Available Production Time = Shift Duration - Norms - Total Downtime + Overtime.</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="field">
              Norms / Allowed Time (minutes)
              <input type="number" min="0" step="any" value={norms} onChange={(event) => setNorms(event.target.value)} />
            </label>
            <CalculatedField label="Shift Duration" value={displayNumber(summaryShiftDuration, ' min')} />
            <CalculatedField label="Norms" value={displayNumber(summaryNorms, ' min')} />
            <CalculatedField label="Total Downtime" value={displayNumber(summaryDowntime, ' min')} />
            <CalculatedField label="Overtime" value={displayNumber(summaryOvertime, ' min')} />
            <CalculatedField label="Available Production Time" value={displayNumber(summaryAvailable, ' min')} />
          </div>
        </div>
        <div className="mt-6 border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Production</h3>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <NumberField label="Qty OK" value={qtyOk} onChange={setQtyOk} />
            <NumberField label="Rework" value={rework} onChange={setRework} />
            <NumberField label="Machining Rejection" value={machiningRejection} onChange={setMachiningRejection} />
            <NumberField label="Casting Rejection" value={castingRejection} onChange={setCastingRejection} />
            <CalculatedField label="Total" value={displayNumber(totalQty, ' Nos.')} />
          </div>
        </div>
        <div className="mt-6 border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Down Time</h3>
          <div className="mt-4 space-y-3">
            {downtimeCategories.data?.map((category) => (
              <LossField
                key={category.id}
                label={category.categoryName}
                value={downtime[category.id] ?? { enabled: false, minutes: '0' }}
                onChange={(update) => updateDowntime(category.id, update)}
              />
            ))}
          </div>
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <label className="field">
              Overtime (hours)
              <input type="number" min="0" step="any" value={overtimeHours} onChange={(event) => setOvertimeHours(event.target.value)} />
            </label>
            <label className="field">
              Overtime (minutes)
              <input type="number" min="0" step="any" value={overtimeMinutes} onChange={(event) => setOvertimeMinutes(event.target.value)} />
            </label>
          </div>
        </div>
        {completedSession && <div className="mt-6 border border-teal-100 bg-teal-50 p-4">
          <p className="eyebrow">LAST COMPLETED SESSION</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <CalculatedField label="Cycle Time" value={summaryCycleTime == null ? 'Not available' : displayNumber(summaryCycleTime, ' min')} />
            <CalculatedField label="Ideal Qty" value={summaryIdealQty > 0 ? displayNumber(summaryIdealQty, ' Nos.') : '—'} />
            <CalculatedField label="Total Qty" value={displayNumber(summaryTotalQty, ' Nos.')} />
            <CalculatedField label="Efficiency" value={summaryIdealQty > 0 ? displayNumber(summaryEfficiency, '%') : '—'} />
            <CalculatedField label="Actual Work Hours" value={displayNumber(summaryActualHours, ' hrs')} />
          </div>
        </div>}
      </section>
      {activeSession?.status === 'Open' && <section className="panel mt-5 p-4">
        <div className="mb-4">
          <p className="eyebrow">SESSION STATUS</p>
          <h2 className="text-xl font-semibold text-slate-900">Active Session</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <CalculatedField label="Operator" value={activeSession.operatorName} />
            <CalculatedField label="Work Date" value={activeSession.workDate} />
            <CalculatedField label="Shift" value={activeSession.shiftName} />
            <CalculatedField label="Machine" value={activeSession.machineName} />
            <CalculatedField label="Component" value={activeSession.componentName} />
            <CalculatedField label="Cycle Time" value={activeSession.cycleTimeMinutes == null ? 'Not available' : `${activeSession.cycleTimeMinutes} minutes`} />
            <CalculatedField label="In Time" value={displayDateTime(activeSession.inTime)} />
            <CalculatedField label="Out Time" value={displayDateTime(activeSession.outTime)} />
            <CalculatedField label="Status" value={activeSession.status} />
            {!sessionEnded && <CalculatedField label="Elapsed" value={formatElapsed(elapsed)} />}
        </div>
      </section>}
    </>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="field">
      {label}
      <input
        type="number"
        min="0"
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

function CalculatedField({ label, value }: { label: string; value: string }) {
  return (
    <label className="field">
      {label}
      <input value={value} readOnly aria-readonly="true" />
    </label>
  );
}

function LossField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: { enabled: boolean; minutes: string };
  onChange: (update: Partial<{ enabled: boolean; minutes: string }>) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label className="flex min-w-48 items-center gap-2 text-sm font-medium text-slate-700">
        <input type="checkbox" checked={value.enabled} onChange={(event) => onChange({ enabled: event.target.checked })} />
        {label}
      </label>
      {value.enabled && (
        <label className="field flex-1 sm:max-w-xs">
          Duration (minutes)
          <input type="number" min="0" step="any" value={value.minutes} onChange={(event) => onChange({ minutes: event.target.value })} />
        </label>
      )}
    </div>
  );
}
