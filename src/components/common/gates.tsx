'use client';
import { usePermission } from '@/hooks/use-permission';
import { useAuthStore } from '@/stores/auth-store';
import type { ReactNode } from 'react';
export function PermissionGate({
  route,
  permission = 'VIEW',
  children,
}: {
  route: string;
  permission?: string;
  children: ReactNode;
}) {
  return usePermission(route, permission) ? children : null;
}
export function SuperAdminGate({ children }: { children: ReactNode }) {
  return useAuthStore((s) => s.session?.isSuperAdmin) === true
    ? children
    : null;
}
export function RoleGate({
  roles,
  children,
}: {
  roles: string[];
  children: ReactNode;
}) {
  const role = useAuthStore((s) => s.session?.roleName);
  return role && roles.includes(role) ? children : null;
}
