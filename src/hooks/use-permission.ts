import { useAuthStore } from '@/stores/auth-store';
import { decodeActionPermission } from '@/config/contracts';
import type { SidebarMenu } from '@/types/api';
export const safeRoute = (route: unknown): route is string =>
  typeof route === 'string' &&
  /^\/(?![\/\\])/.test(route) &&
  !/[\\\x00-\x1f]/.test(route);
export function flattenMenus(menus: SidebarMenu[]): SidebarMenu[] {
  return menus.flatMap((menu) => [
    menu,
    ...flattenMenus(Array.isArray(menu.children) ? menu.children : []),
  ]);
}
export function usePermission(route: string, action = 'VIEW') {
  const session = useAuthStore((s) => s.session);
  if (!session) return false;
  if (route.startsWith('/superadmin') && !session.isSuperAdmin) return false;
  const canView =
    route === '/dashboard' ||
    session.sidebar.some((module) =>
      flattenMenus(module.menus || []).some((menu) => menu.route === route),
    );
  if (!canView) return false;
  return decodeActionPermission?.(route, action, session) ?? true;
}
