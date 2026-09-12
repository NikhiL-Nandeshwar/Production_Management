import { Activity, PlugZap } from 'lucide-react';
import type { Widget } from '@/types/api';
type WidgetProps = { widget: Widget };
export function widgetTitle(widget: Widget) {
  for (const key of ['displayName', 'widgetName', 'widgetCode', 'widgetType'])
    if (typeof widget[key] === 'string')
      return String(widget[key]).replaceAll('_', ' ');
  return 'Assigned widget';
}
function MetadataWidget({ widget }: WidgetProps) {
  return (
    <article className="widget-card">
      <div className="flex items-center justify-between">
        <h3>{widgetTitle(widget)}</h3>
        <Activity size={16} className="text-slate-400" />
      </div>
      <div className="my-7 text-3xl font-semibold text-slate-300">—</div>
      <p className="text-xs text-slate-500">
        Assigned to your workspace. Metrics are awaiting a data connection.
      </p>
    </article>
  );
}
function UnknownWidget({ widget }: WidgetProps) {
  return (
    <article className="widget-card">
      <PlugZap size={20} className="mb-4 text-slate-400" />
      <h3>{widgetTitle(widget)}</h3>
      <p className="mt-3 text-xs text-slate-500">
        This assigned widget does not have a supported renderer yet.
      </p>
    </article>
  );
}
export const widgetRegistry: Record<
  string,
  React.ComponentType<WidgetProps>
> = Object.fromEntries(
  [
    'TODAY_PRODUCTION',
    'PRODUCTIVITY',
    'EFFICIENCY',
    'ATTENDANCE_TODAY',
    'MACHINE_STATUS',
    'ACTIVE_WORK_SESSIONS',
    'TODAY_REJECTION',
    'TODAY_DOWNTIME',
    'TOP_OPERATORS',
    'MACHINE_PERFORMANCE',
    'PRODUCTION_TREND',
    'QUALITY_DOWNTIME_TREND',
  ].map((code) => [code, MetadataWidget]),
);
export function DashboardWidget({ widget }: WidgetProps) {
  const Renderer =
    widgetRegistry[String(widget.widgetCode || widget.widgetType || '')] ||
    UnknownWidget;
  return <Renderer widget={widget} />;
}
