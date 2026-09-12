import { Inbox, AlertCircle, PlugZap } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function EmptyState({
  title = 'No records found',
  description = 'Try changing your filters or add the first record.',
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="state">
      <Inbox size={28} />
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
}
export function UnavailableState({
  description = 'This feature needs additional backend API documentation before it can be connected.',
}: {
  description?: string;
}) {
  return (
    <div className="state">
      <PlugZap size={28} />
      <h3>Awaiting API integration</h3>
      <p>{description}</p>
    </div>
  );
}
export function ErrorState({
  message,
  retry,
}: {
  message: string;
  retry?: () => void;
}) {
  return (
    <div role="alert" className="state">
      <AlertCircle size={28} />
      <h3>Unable to load data</h3>
      <p>{message}</p>
      {retry && (
        <Button variant="outline" onClick={retry}>
          Try again
        </Button>
      )}
    </div>
  );
}
export function LoadingSkeleton() {
  return (
    <div aria-label="Loading" role="status" className="space-y-4 p-6">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-slate-100" />
      ))}
    </div>
  );
}
export function StatusBadge({ value }: { value: unknown }) {
  const text =
    typeof value === 'boolean'
      ? value
        ? 'Active'
        : 'Inactive'
      : String(value ?? '—');
  return (
    <span
      className={`badge ${['Active', 'Open', 'Present', 'Approved', 'Completed'].includes(text) ? 'badge-green' : ['Cancelled', 'Absent', 'Inactive'].includes(text) ? 'badge-red' : ''}`}
    >
      {text}
    </span>
  );
}
