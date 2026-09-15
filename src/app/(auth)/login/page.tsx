'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowUpRight, Factory, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { login } from '@/lib/api/auth';
import { errorText } from '@/lib/api/errors';
import { Button } from '@/components/ui/button';
const schema = z.object({
  username: z.string().trim().min(1, 'Enter your username'),
  password: z.string().min(1, 'Enter your password'),
});
export default function LoginPage() {
  const router = useRouter();
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: 'User',
      password: '123456',
    },
  });
  return (
    <main className="login-grid">
      <section className="login-story">
        <div className="brand">
          <Factory /> PRODVEX<span>®</span>
        </div>
        <div>
          <span className="eyebrow text-teal-200">
            YOUR SHOP FLOOR. CONNECTED.
          </span>
          <h1>
            Precision in every
            <br />
            shift. Progress in
            <br />
            <em>every part.</em>
          </h1>
          <p>
            One workspace for your people, machines,
            <br />
            and production.
          </p>
          <div className="process-strip">
            <span>01 / Plan</span>
            <span>02 / Produce</span>
            <span>03 / Improve</span>
          </div>
        </div>
        <small>BUILT FOR THE WAY MANUFACTURING WORKS</small>
      </section>
      <section className="login-form">
        <div className="w-full max-w-sm">
          <div className="mb-10 inline-flex rounded-xl bg-teal-50 p-3 text-teal-800">
            <Factory size={26} />
          </div>
          <span className="eyebrow">PRODUCTION WORKSPACE</span>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight">
            Welcome back
          </h2>
          <p className="mb-8 mt-3 text-sm text-slate-500">
            Sign in with your company account to continue.
          </p>
          <form
            onSubmit={handleSubmit(async (values) => {
              setError('');
              try {
                const result = await login(values.username, values.password);
                toast.success(result.message);
                router.replace('/dashboard');
              } catch (e) {
                setError(errorText(e));
              }
            })}
            className="space-y-5"
          >
            <label className="field">
              Username
              <input
                autoComplete="username"
                {...register('username')}
                placeholder="Your username"
                aria-invalid={!!errors.username}
              />
              {errors.username && (
                <span className="field-error">{errors.username.message}</span>
              )}
            </label>
            <label className="field">
              Password
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  {...register('password')}
                  placeholder="Your password"
                  className="pr-12"
                  aria-invalid={!!errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? 'Hide password' : 'Show password'}
                  className="absolute right-3 top-3 text-slate-500"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <span className="field-error">{errors.password.message}</span>
              )}
            </label>
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <Button className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in to workspace'}
              <ArrowUpRight size={17} />
            </Button>
          </form>
          <p className="mt-8 text-center text-xs leading-5 text-slate-400">
            Need access? Contact your company administrator.
          </p>
        </div>
        <footer>PRODVEX / MANUFACTURING INTELLIGENCE</footer>
      </section>
    </main>
  );
}
