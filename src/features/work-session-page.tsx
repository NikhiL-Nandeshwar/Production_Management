'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import * as shiftApi from '@/lib/api/shifts';
import * as machineApi from '@/lib/api/machines';
import * as componentApi from '@/lib/api/components';
import { errorText } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import {
  EmptyState,
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

export function WorkSessionPage() {
  const session = useAuthStore((state) => state.session);
  const companyId = session?.companyId;
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
  const [losses, setLosses] = useState({
    machineBreakdown: { enabled: false, minutes: '0' },
    powerOff: { enabled: false, minutes: '0' },
    noLoad: { enabled: false, minutes: '0' },
    setting: { enabled: false, minutes: '0' },
    unloading: { enabled: false, minutes: '0' },
  });
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
  const lookupError = shifts.error || machines.error || components.error;
  const lookupLoading = shifts.isPending || machines.isPending || components.isPending;
  const canStart = Boolean(workDate && shiftId && machineId && componentId && startTime);
  const selectedComponent = components.data?.find(
    (component) => String(component.id) === componentId,
  );
  const selectedShift = shifts.data?.find((shift) => String(shift.id) === shiftId);
  const cycleTime = selectedComponent?.cycleTimeMinutes ?? 0;
  const shiftDuration = selectedShift
    ? timeDuration(selectedShift.startTime.slice(0, 5), selectedShift.endTime.slice(0, 5))
    : 0;
  const normsMinutes = nonNegative(norms);
  const availableProductionTime = Math.max(0, shiftDuration - normsMinutes);
  const totalQty =
    nonNegative(qtyOk) +
    nonNegative(rework) +
    nonNegative(machiningRejection) +
    nonNegative(castingRejection);
  const idealQty = cycleTime > 0 ? availableProductionTime / cycleTime : 0;
  const efficiency = idealQty > 0 ? (totalQty / idealQty) * 100 : 0;
  const machineLossMinutes = Object.values(losses).reduce(
    (total, loss) => total + (loss.enabled ? nonNegative(loss.minutes) : 0),
    0,
  );
  const overtimeMinutesTotal = nonNegative(overtimeHours) * 60 + nonNegative(overtimeMinutes);
  const finalActualWorkHours =
    (totalQty * cycleTime + machineLossMinutes + overtimeMinutesTotal) / 60;
  const updateLoss = (key: keyof typeof losses, update: Partial<(typeof losses)[typeof key]>) =>
    setLosses((current) => ({ ...current, [key]: { ...current[key], ...update } }));

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
                  value={cycleTime > 0 ? `${cycleTime} minutes` : 'Not available'}
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
          {!lookupLoading && !lookupError && (
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button type="button" disabled={!canStart} title="Starting a session is unavailable until the verified Work Session API contract is supplied.">
                Start Session
              </Button>
              <p className="notice">Starting a session is unavailable until the verified Work Session API contract is connected.</p>
            </div>
          )}
        </div>
        <div className="mt-6 border border-slate-200 p-4">
          <h3 className="font-semibold text-slate-900">Norms / Allowed Time</h3>
          <p className="mt-1 text-sm text-slate-500">Available Production Time = Shift Duration - Norms.</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2">
            <label className="field">
              Norms / Allowed Time (minutes)
              <input type="number" min="0" step="any" value={norms} onChange={(event) => setNorms(event.target.value)} />
            </label>
            <CalculatedField label="Shift Duration" value={displayNumber(shiftDuration, ' min')} />
            <CalculatedField label="Available Production Time" value={displayNumber(availableProductionTime, ' min')} />
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
          <h3 className="font-semibold text-slate-900">Machine / Time</h3>
          <div className="mt-4 space-y-3">
            <LossField label="Machine Breakdown" value={losses.machineBreakdown} onChange={(update) => updateLoss('machineBreakdown', update)} />
            <LossField label="Power Off" value={losses.powerOff} onChange={(update) => updateLoss('powerOff', update)} />
            <LossField label="No Load" value={losses.noLoad} onChange={(update) => updateLoss('noLoad', update)} />
            <LossField label="Setting" value={losses.setting} onChange={(update) => updateLoss('setting', update)} />
            <LossField label="Unloading" value={losses.unloading} onChange={(update) => updateLoss('unloading', update)} />
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
        <div className="mt-6 border border-teal-100 bg-teal-50 p-4">
          <p className="eyebrow">WORK SESSION SUMMARY</p>
          <div className="mt-4 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <CalculatedField label="Cycle Time" value={cycleTime > 0 ? displayNumber(cycleTime, ' min') : 'Not available'} />
            <CalculatedField label="Ideal Qty" value={idealQty > 0 ? displayNumber(idealQty, ' Nos.') : '—'} />
            <CalculatedField label="Total Qty" value={displayNumber(totalQty, ' Nos.')} />
            <CalculatedField label="Efficiency" value={idealQty > 0 ? displayNumber(efficiency, '%') : '—'} />
            <CalculatedField label="Actual Work Hours" value={displayNumber(finalActualWorkHours, ' hrs')} />
            <CalculatedField label="Overtime" value={displayNumber(overtimeMinutesTotal / 60, ' hrs')} />
          </div>
          <p className="mt-4 text-xs text-slate-500">These values are calculated locally for planning only and are not saved.</p>
        </div>
      </section>
      <section className="panel mt-5 p-4">
        <div className="mb-4">
          <p className="eyebrow">SESSION STATUS</p>
          <h2 className="text-xl font-semibold text-slate-900">Active Session</h2>
        </div>
        <EmptyState
          title="No active session"
          description="An active session will appear here after the verified start-session workflow is connected."
        />
      </section>
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
