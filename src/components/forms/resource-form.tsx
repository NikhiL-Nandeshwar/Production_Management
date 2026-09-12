'use client';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useState } from 'react';
import { createSchema, fieldLabel, toPayload } from '@/schemas/resource';
import { resourceByKey, type ResourceConfig } from '@/config/resources';
import { listContracts } from '@/config/contracts';
import { saveRecord } from '@/lib/api/resources';
import { ApiError, errorText } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { AsyncSelect } from './async-select';
export function ResourceForm({
  resource,
  onDone,
  onBusyChange,
}: {
  resource: ResourceConfig;
  onDone: () => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const client = useQueryClient();
  const [formError, setFormError] = useState('');
  const {
    control,
    register,
    handleSubmit,
    setError,
    setValue,
    formState: { errors },
  } = useForm<Record<string, unknown>>({
    resolver: zodResolver(createSchema(resource.fields)),
    defaultValues: Object.fromEntries(
      resource.fields.map((f) => [
        f.name,
        f.type === 'boolean'
          ? true
          : f.type === 'number' && !f.nullable
            ? 0
            : f.nullable
              ? null
              : '',
      ]),
    ),
  });
  const mutation = useMutation({
    onMutate: () => onBusyChange(true),
    onSettled: () => onBusyChange(false),
    mutationFn: (values: Record<string, unknown>) =>
      saveRecord(resource.createUrl!, toPayload(values, resource.fields)),
    onSuccess: async (result) => {
      toast.success(result.message);
      await client.invalidateQueries({ queryKey: ['records', resource.key] });
      onDone();
    },
    onError: (error) => {
      setFormError(errorText(error));
      if (error instanceof ApiError)
        for (const [name, messages] of Object.entries(error.fields)) {
          const field = resource.fields.find(
            (f) =>
              f.name.toLowerCase() === name.replace(/^\$\./, '').toLowerCase(),
          );
          if (field) setError(field.name, { message: messages.join(' ') });
        }
    },
  });
  const dependencyMissing = resource.fields.some(
    (f) =>
      f.type.startsWith('lookup:') &&
      (!resourceByKey(f.type.slice(7))?.listUrl ||
        !listContracts[f.type.slice(7)]?.idField),
  );
  const values = useWatch({ control });
  return (
    <form
      className="space-y-5"
      onSubmit={handleSubmit((v) => {
        setFormError('');
        if (resource.createUrl && !dependencyMissing && !mutation.isPending)
          mutation.mutate(v);
      })}
    >
      <div className="grid gap-5 sm:grid-cols-2">
        {resource.fields.map((f) => (
          <div
            key={f.name}
            className={`field ${f.type.startsWith('textarea') ? 'sm:col-span-2' : ''}`}
          >
            <label htmlFor={f.name}>
              {fieldLabel(f.name)}
              {!f.nullable && f.type !== 'boolean' && (
                <span className="text-teal-700"> *</span>
              )}
            </label>
            {f.type === 'boolean' ? (
              <input id={f.name} type="checkbox" {...register(f.name)} />
            ) : f.type.startsWith('lookup:') ? (
              <Controller
                name={f.name}
                control={control}
                render={({ field }) => (
                  <AsyncSelect
                    id={f.name}
                    source={f.type.slice(7)}
                    value={field.value}
                    onChange={(v) => {
                      field.onChange(v);
                      if (f.name === 'rejectionTypeId')
                        setValue('rejectionReasonId', null);
                      if (['machineId', 'componentId'].includes(f.name))
                        setValue('machineComponentId', null);
                    }}
                    filter={(row) =>
                      f.name === 'rejectionReasonId'
                        ? row.rejectionTypeId === values.rejectionTypeId
                        : f.name === 'machineComponentId'
                          ? row.machineId === values.machineId &&
                            row.componentId === values.componentId
                          : f.name === 'workSessionId'
                            ? row.status === 'Open'
                            : true
                    }
                  />
                )}
              />
            ) : f.type.startsWith('select:') ? (
              <select id={f.name} {...register(f.name)}>
                <option value="">Select an option</option>
                {f.type
                  .slice(7)
                  .split(',')
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </select>
            ) : f.type === 'textarea' ? (
              <textarea id={f.name} rows={3} {...register(f.name)} />
            ) : (
              <input
                id={f.name}
                type={f.type}
                autoComplete={f.type === 'password' ? 'new-password' : 'off'}
                step={f.type === 'number' ? 'any' : undefined}
                {...register(
                  f.name,
                  f.type === 'number'
                    ? {
                        setValueAs: (v) =>
                          v === '' ? (f.nullable ? null : NaN) : Number(v),
                      }
                    : {},
                )}
                aria-invalid={!!errors[f.name]}
              />
            )}{' '}
            {errors[f.name] && (
              <span className="field-error">
                {String(errors[f.name]?.message || 'Invalid value')}
              </span>
            )}
          </div>
        ))}
      </div>
      {(!resource.createUrl || dependencyMissing) && (
        <p className="notice">
          {!resource.createUrl
            ? 'Saving is unavailable until the create endpoint is documented.'
            : 'Saving is unavailable until the required lookup contracts are connected.'}
        </p>
      )}
      {formError && (
        <p className="error-box" role="alert">
          {formError}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onDone}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={
            mutation.isPending || !resource.createUrl || dependencyMissing
          }
        >
          {mutation.isPending ? 'Saving…' : 'Save record'}
        </Button>
      </div>
    </form>
  );
}
