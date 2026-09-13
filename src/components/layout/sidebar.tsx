'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Factory,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { normalizeResourceRoute } from '@/config/resources';
import { safeRoute, flattenMenus } from '@/hooks/use-permission';
import { ApiIcon } from '@/components/icons/icon-resolver';
import type { SidebarMenu } from '@/types/api';
import { Button } from '@/components/ui/button';
function MenuItem({
  menu,
  collapsed,
  onNavigate,
}: {
  menu: SidebarMenu;
  collapsed: boolean;
  onNavigate: () => void;
}) {
  const path = usePathname();
  const menuRoute = menu.route ? normalizeResourceRoute(menu.route) : null;
  const superadmin = useAuthStore((s) => s.session?.isSuperAdmin);
  if (menu.route?.startsWith('/superadmin') && !superadmin) return null;
  const children = Array.isArray(menu.children) ? menu.children : [];
  const active = path === menuRoute;
  const descendant = flattenMenus(children).some(
    (m) => normalizeResourceRoute(m.route || '') === path,
  );
  const content = (
    <>
      <ApiIcon name={menu.icon} />
      <span>{menu.displayName}</span>
    </>
  );
  return (
    <li>
      {children.length > 0 ? (
        <details
          key={`${path}-${menu.menuId}`}
          open={active || descendant || undefined}
        >
          <summary title={menu.displayName} className="nav-item">
            {content}
            <ChevronDown size={14} className="ml-auto" />
          </summary>
          {safeRoute(menuRoute) && (
            <Link
              onClick={onNavigate}
              className={`nav-item ${active ? 'active' : ''}`}
              href={menuRoute}
            >
              {menu.displayName}
            </Link>
          )}
          <ul
            className={collapsed ? '' : 'ml-4 border-l border-slate-200 pl-2'}
          >
            {[...children]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((child) => (
                <MenuItem
                  key={child.menuId}
                  menu={child}
                  collapsed={collapsed}
                  onNavigate={onNavigate}
                />
              ))}
          </ul>
        </details>
      ) : safeRoute(menuRoute) ? (
        <Link
          title={menu.displayName}
          aria-current={active ? 'page' : undefined}
          onClick={onNavigate}
          className={`nav-item ${active ? 'active' : ''}`}
          href={menuRoute}
        >
          {content}
        </Link>
      ) : (
        <div className="nav-group">{!collapsed && menu.displayName}</div>
      )}
    </li>
  );
}
export function Sidebar({
  mobile = false,
  onNavigate = () => {},
}: {
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const session = useAuthStore((s) => s.session);
  const { collapsed, toggle } = useUIStore();
  const small = collapsed && !mobile;
  return (
    <aside
      className={`sidebar ${small ? 'collapsed' : ''} ${mobile ? 'mobile-sidebar' : ''}`}
    >
      <Link
        href="/dashboard"
        onClick={onNavigate}
        className="brand text-slate-900"
      >
        <Factory className="text-teal-800" />
        {!small && 'PRODVEX'}
      </Link>
      <div className="workspace-card">
        <span className="company-symbol">
          {session?.companyName?.slice(0, 1) || 'P'}
        </span>
        {!small && (
          <div className="min-w-0">
            <strong className="block truncate text-sm">
              {session?.companyName || 'Platform workspace'}
            </strong>
            <small className="text-slate-400">Production management</small>
          </div>
        )}
      </div>
      <nav aria-label="Workspace navigation" className="flex-1 overflow-y-auto">
        {[...(session?.sidebar || [])]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((module) => (
            <section key={module.moduleId} className="mb-5">
              {!small && <h2 className="nav-group">{module.moduleName}</h2>}
              <ul>
                {[...(module.menus || [])]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((menu) => (
                    <MenuItem
                      key={menu.menuId}
                      menu={menu}
                      collapsed={small}
                      onNavigate={onNavigate}
                    />
                  ))}
              </ul>
            </section>
          ))}
        {!session?.sidebar.length && (
          <p className="p-3 text-xs text-slate-500">
            No menus assigned. Contact your administrator.
          </p>
        )}
      </nav>
      <div className="sidebar-bottom">
        {!small && (
          <small>
            PRODVEX <span className="text-slate-400">v1.0</span>
          </small>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            aria-label={small ? 'Expand navigation' : 'Collapse navigation'}
          >
            {small ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </Button>
        )}
      </div>
    </aside>
  );
}
