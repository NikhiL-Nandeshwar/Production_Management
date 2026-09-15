export interface ApiResponse<T> {
  success: boolean;
  message: string;
  statusCode: number;
  data: T;
  errors: string[] | Record<string, string[]> | null;
  traceId: string | null;
  timestamp: string;
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
export interface Role {
  id: number;
  companyId: number;
  roleName: string;
  description: string;
  isSystemRole: boolean;
  isActive: boolean;
  totalUsers: number;
  createdAt: string;
  updatedAt?: string | null;
}
export interface User {
  id: number;
  roleId: number;
  username: string;
  email: string;
  displayName: string;
  isActive: boolean;
}
export interface CompanyMenu {
  id: number;
  menuId: number;
  menuCode: string;
  displayName: string;
  moduleId: number;
  isEnabled: boolean;
  sortOrder: number;
}
export interface CompanyWidget {
  id: number;
  widgetId: number;
  widgetCode: string;
  widgetName: string;
  widgetType: string;
  isEnabled: boolean;
}
export interface AssignedMenu {
  menuId: number;
  menuCode: string;
  displayName: string;
  moduleId: number;
  isVisible: boolean;
}
export interface AssignedWidget {
  widgetId: number;
  widgetCode: string;
  widgetName: string;
  isVisible: boolean;
  sortOrder: number;
}
export interface Shift {
  id: number;
  companyId: number;
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isActive: boolean;
  createdAt: string;
}
export interface Machine {
  id: number;
  companyId: number;
  machineCode: string;
  machineName: string;
  machineType: string;
  location: string;
  isActive: boolean;
  createdAt: string;
}
export interface Component {
  id: number;
  companyId: number;
  componentCode: string;
  componentName: string;
  drawingNumber: string;
  unitOfMeasure: string;
  cycleTimeMinutes: number | null;
  isActive: boolean;
  createdAt: string;
}
export interface DowntimeCategory {
  id: number;
  companyId: number;
  categoryName: string;
  isActive: boolean;
  createdAt: string;
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
