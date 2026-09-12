import { z } from 'zod';
import type { FieldConfig } from '@/config/resources';
export const fieldLabel = (name: string) =>
  name.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
export function createSchema(fields: FieldConfig[]) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const f of fields) {
    let schema: z.ZodTypeAny;
    if (f.type === 'boolean') schema = z.boolean();
    else if (f.type === 'number' || f.type.startsWith('lookup:')) {
      let n = z
        .number()
        .finite()
        .min(f.type.startsWith('lookup:') ? 1 : 0);
      if (
        f.type.startsWith('lookup:') ||
        [
          'periodMonth',
          'periodYear',
          'breakMinutes',
          'overtimeMinutes',
          'workingMinutes',
        ].includes(f.name)
      )
        n = n.int();
      if (f.name === 'periodMonth') n = n.min(1).max(12);
      if (f.name === 'periodYear') n = n.min(1).max(9999);
      schema = n;
    } else if (f.type.startsWith('select:'))
      schema = z.enum(f.type.slice(7).split(',') as [string, ...string[]]);
    else if (f.type === 'email')
      schema = z.string().email('Enter a valid email address');
    else if (f.type === 'date')
      schema = z
        .string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'Select a date')
        .refine(
          (v) =>
            !Number.isNaN(Date.parse(v)) &&
            new Date(v + 'T00:00:00Z').toISOString().slice(0, 10) === v,
          'Select a valid date',
        );
    else if (f.type === 'time')
      schema = z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'Enter a valid time');
    else if (f.type === 'datetime-local')
      schema = z
        .string()
        .refine(
          (v) =>
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v) &&
            !Number.isNaN(Date.parse(v)),
          'Select a date and time',
        );
    else schema = z.string().min(1, `${fieldLabel(f.name)} is required`);
    shape[f.name] = f.nullable
      ? z.preprocess(
          (v) => (v === '' || v == null ? null : v),
          schema.nullable(),
        )
      : schema;
  }
  return z.object(shape).superRefine((v, ctx) => {
    for (const [start, end] of [
      ['effectiveFrom', 'effectiveTo'],
      ['inTime', 'outTime'],
    ])
      if (v[start] && v[end] && String(v[end]) < String(v[start]))
        ctx.addIssue({
          code: 'custom',
          path: [end],
          message: 'End must be on or after start',
        });
  });
}
export function toPayload(
  values: Record<string, unknown>,
  fields: FieldConfig[],
) {
  return Object.fromEntries(
    fields.map((f) => {
      let value = values[f.name];
      if (f.nullable && (value === '' || value == null)) value = null;
      if (
        value &&
        ['time', 'datetime-local'].includes(f.type) &&
        typeof value === 'string' &&
        (value.length === 5 || value.length === 16)
      )
        value += ':00';
      return [f.name, value];
    }),
  );
}
