'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import * as Dialog from '@radix-ui/react-dialog';
import * as Dropdown from '@radix-ui/react-dropdown-menu';
import { Menu, X, Bell, LogOut, ChevronDown } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { usePermission } from '@/hooks/use-permission';
import { logout } from '@/lib/api/auth';
import { errorText } from '@/lib/api/errors';
import { toast } from 'sonner';
import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton, EmptyState } from '@/components/common/states';
export function Shell({ children }: { children: React.ReactNode }) {
  const session = useAuthStore((s) => s.session);
  const collapsed = useUIStore((s) => s.collapsed);
  const router = useRouter();
  const path = usePathname();
  const allowed = usePermission(path);
  const [mobile, setMobile] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!session) router.replace('/login');
  }, [session, router]);
  if (!session) return <LoadingSkeleton />;
  return (
    <div className={`app-shell ${collapsed ? 'is-collapsed' : ''}`}>
      <div className="desktop-nav">
        <Sidebar />
      </div>
      <div className="workspace-main">
        <header className="topbar no-print">
          <Dialog.Root open={mobile} onOpenChange={setMobile}>
            <Dialog.Trigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                aria-label="Open navigation"
              >
                <Menu size={20} />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 z-40 bg-slate-950/40" />
              <Dialog.Content className="fixed inset-y-0 left-0 z-50 w-72 bg-white">
                <Dialog.Title className="sr-only">
                  Workspace navigation
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Your assigned modules and pages
                </Dialog.Description>
                <Sidebar mobile onNavigate={() => setMobile(false)} />
                <Dialog.Close
                  aria-label="Close navigation"
                  className="absolute right-3 top-6"
                >
                  <X size={18} />
                </Dialog.Close>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <span className="text-sm text-slate-500 truncate">
            {session.companyName || 'Platform administration'}
          </span>
          <div className="ml-auto flex items-center gap-4">
            <span className="hidden items-center gap-2 text-xs text-slate-500 sm:flex">
              <span className="size-1.5 rounded-full bg-teal-600" />
              Company workspace
            </span>
            <Dropdown.Root>
              <Dropdown.Trigger asChild>
                <Button variant="ghost" size="icon" aria-label="Notifications">
                  <Bell size={18} />
                </Button>
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content className="popover">
                  <p className="font-medium">Notifications</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Notifications are not available yet.
                  </p>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
            <Dropdown.Root>
              <Dropdown.Trigger className="flex items-center gap-3 rounded-lg p-1 focus-visible:outline-teal-600">
                <span className="avatar">
                  {session.displayName?.slice(0, 2).toUpperCase() || 'PV'}
                </span>
                <span className="hidden text-left sm:block">
                  <strong className="block text-xs">
                    {session.displayName}
                  </strong>
                  <span className="text-[11px] text-slate-400">
                    {session.roleName}
                  </span>
                </span>
                <ChevronDown size={14} />
              </Dropdown.Trigger>
              <Dropdown.Portal>
                <Dropdown.Content align="end" className="popover">
                  <Dropdown.Label className="text-sm font-semibold">
                    {session.displayName}
                  </Dropdown.Label>
                  <p className="mb-4 text-xs text-slate-500">{session.email}</p>
                  <Dropdown.Separator className="mb-2 border-t border-slate-100" />
                  <Dropdown.Item
                    disabled={busy}
                    onSelect={async () => {
                      setBusy(true);
                      try {
                        await logout();
                      } catch (e) {
                        toast.error(errorText(e));
                      } finally {
                        setBusy(false);
                      }
                    }}
                    className="flex cursor-pointer items-center gap-2 rounded p-2 text-sm text-red-700 outline-none focus:bg-red-50"
                  >
                    <LogOut size={16} />
                    {busy ? 'Signing out…' : 'Sign out'}
                  </Dropdown.Item>
                </Dropdown.Content>
              </Dropdown.Portal>
            </Dropdown.Root>
          </div>
        </header>
        <main className="page-container">
          {path.startsWith('/superadmin') && (
            <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
              Platform administration · SuperAdmin workspace
            </div>
          )}
          {allowed ? (
            children
          ) : (
            <EmptyState
              title="Access not assigned"
              description="This page is not included in your assigned navigation. Contact your administrator."
            />
          )}
        </main>
        <footer className="workspace-footer no-print">
          <span>PRODVEX / Production workspace</span>
          <span>v1.0.0</span>
        </footer>
      </div>
    </div>
  );
}
