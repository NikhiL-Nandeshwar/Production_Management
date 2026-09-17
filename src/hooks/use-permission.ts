import { useAuthStore } from '@/stores/auth-store';
import { decodeActionPermission } from '@/config/contracts';
import { normalizeResourceRoute } from '@/config/resources';
import type { SidebarMenu } from '@/types/api';
export const safeRoute = (route: unknown): route is string =>
  typeof route === 'string' &&
  /^\/(?![\/\\])/.test(route) &&
  !/[\\\x00-\x1f]/.test(route);
export const canonicalFrontendRoute = (route: string) =>
  route === '/salary/records' ? '/reports/salary' : route;
export function flattenMenus(menus: SidebarMenu[]): SidebarMenu[] {
  return menus.flatMap((menu) => [
    menu,
    ...flattenMenus(Array.isArray(menu.children) ? menu.children : []),
  ]);
}
export function usePermission(route: string, action = 'VIEW') {
  const session = useAuthStore((s) => s.session);
  if (!session) return false;
  const canonicalRoute = canonicalFrontendRoute(normalizeResourceRoute(route));
  if (canonicalRoute.startsWith('/superadmin') && !session.isSuperAdmin)
    return false;
  const canView =
    canonicalRoute === '/dashboard' ||
    session.sidebar.some((module) =>
      flattenMenus(module.menus || []).some(
        (menu) =>
          canonicalFrontendRoute(normalizeResourceRoute(menu.route || '')) ===
          canonicalRoute,
      ),
    );
  if (!canView) return false;
  return decodeActionPermission?.(canonicalRoute, action, session) ?? true;
}
