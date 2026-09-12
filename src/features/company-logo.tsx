'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { uploadLogo } from '@/lib/api/resources';
import { errorText } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
import { SuperAdminGate } from '@/components/common/gates';
const schema = z.object({ companyId: z.coerce.number().int().positive() });
export function CompanyLogo() {
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema) });
  return (
    <SuperAdminGate>
      <section className="panel mb-6 p-5 no-print">
        <h2 className="font-semibold">Company logo</h2>
        <p className="mt-2 text-sm text-slate-500">
          Upload a logo for a known company ID.
        </p>
        <form
          onSubmit={handleSubmit(async (values) => {
            const input = document.getElementById(
              'company-logo',
            ) as HTMLInputElement;
            const file = input.files?.[0];
            if (!file) {
              toast.error('Choose a logo file.');
              return;
            }
            if (
              !['image/png', 'image/jpeg', 'image/webp'].includes(file.type)
            ) {
              toast.error('Choose a PNG, JPEG, or WebP image.');
              return;
            }
            try {
              const result = await uploadLogo(values.companyId, file);
              toast.success(result.message);
              input.value = '';
            } catch (e) {
              toast.error(errorText(e));
            }
          })}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="field">
            Company ID
            <input type="number" min="1" {...register('companyId')} />
            {errors.companyId && (
              <span className="field-error">Enter a valid company ID</span>
            )}
          </label>
          <label className="field">
            Logo
            <input
              id="company-logo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              required
            />
          </label>
          <Button disabled={isSubmitting}>
            {isSubmitting ? 'Uploading…' : 'Upload logo'}
          </Button>
        </form>
      </section>
    </SuperAdminGate>
  );
}
