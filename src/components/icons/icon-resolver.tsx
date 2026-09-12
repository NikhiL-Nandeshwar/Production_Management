import {
  Factory,
  LayoutDashboard,
  Users,
  Settings,
  Clock,
  Cog,
  Package,
  ChartNoAxesCombined,
  ShieldCheck,
  Circle,
  ClipboardList,
  Wallet,
  Wrench,
  Layers,
  Activity,
} from 'lucide-react';
const icons: Record<string, typeof Circle> = {
  factory: Factory,
  layoutdashboard: LayoutDashboard,
  users: Users,
  settings: Settings,
  clock: Clock,
  cog: Cog,
  package: Package,
  chartnoaxescombined: ChartNoAxesCombined,
  shieldcheck: ShieldCheck,
  clipboardlist: ClipboardList,
  wallet: Wallet,
  wrench: Wrench,
  layers: Layers,
  activity: Activity,
};
export function ApiIcon({ name, size = 18 }: { name?: string; size?: number }) {
  const Icon =
    icons[(name || '').replace(/[-_ ]/g, '').toLowerCase()] || Circle;
  return <Icon size={size} aria-hidden="true" />;
}
