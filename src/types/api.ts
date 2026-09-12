export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  errors: string[] | Record<string, string[]> | null;
  timestamp?: string;
}
export type DataRow = Record<string, unknown>;
export interface SidebarMenu {
  menuId: number;
  menuCode: string;
  displayName: string;
  parentMenuId?: number | null;
  icon?: string;
  route?: string | null;
  sortOrder: number;
  children: SidebarMenu[];
}
export interface SidebarModule {
  moduleId: number;
  moduleCode: string;
  moduleName: string;
  icon?: string;
  sortOrder: number;
  menus: SidebarMenu[];
}
// Widget response fields are undocumented; only runtime-confirmed metadata is displayed.
export type Widget = Record<string, unknown>;
export interface AuthSession {
  userId: number;
  username: string;
  displayName: string;
  email: string;
  companyId: number | null;
  companyName: string;
  roleId: number;
  roleName: string;
  isSuperAdmin: boolean;
  accessToken: string;
  refreshToken?: string;
  accessTokenExpiresAt: string;
  refreshTokenExpiresAt?: string;
  sidebar: SidebarModule[];
  myWidgets: Widget[];
}
export type ActionPermission =
  | 'VIEW'
  | 'ADD'
  | 'EDIT'
  | 'DELETE'
  | 'EXPORT'
  | 'IMPORT'
  | 'APPROVE'
  | 'REJECT';
