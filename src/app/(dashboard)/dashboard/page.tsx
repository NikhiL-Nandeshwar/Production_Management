'use client';
import { useAuthStore } from '@/stores/auth-store';
import { DashboardWidget } from '@/components/dashboard/widget-registry';
import { EmptyState } from '@/components/common/states';
import { formatDate } from '@/utils/format';
import { format } from 'date-fns';
export default function Dashboard() {
  const session = useAuthStore((s) => s.session);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">WORKSPACE OVERVIEW</p>
          <h1>
            Good to see you, {session?.displayName?.split(' ')[0] || 'there'}.
          </h1>
          <p>Your production workspace, in one place.</p>
        </div>
        <span className="date-chip">
          {formatDate(format(new Date(), 'yyyy-MM-dd'))}
        </span>
      </div>
      <section className="overview-banner">
        <div>
          <span className="eyebrow text-teal-200">CONNECTED MANUFACTURING</span>
          <h2>Make every shift count.</h2>
          <p>Manage daily operations through your assigned modules.</p>
        </div>
        <div className="banner-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-base font-semibold">Your workspace widgets</h2>
        <span className="text-xs text-slate-400">
          Assigned by your administrator
        </span>
      </div>
      {session?.myWidgets.length ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {session.myWidgets
            .filter((w) => w && typeof w === 'object')
            .map((widget, i) => (
              <DashboardWidget key={i} widget={widget} />
            ))}
        </div>
      ) : (
        <div className="panel">
          <EmptyState
            title="Your overview starts here"
            description="No widgets are assigned to your account yet. Your administrator can configure your dashboard."
          />
        </div>
      )}
    </>
  );
}
