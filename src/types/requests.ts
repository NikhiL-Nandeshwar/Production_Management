export interface ShiftsCreateRequest {
  shiftName: string;
  startTime: string;
  endTime: string;
  breakMinutes: number;
  isActive: boolean;
}
export interface ShiftsUpdateRequest extends ShiftsCreateRequest {
  id: number;
}

export interface MachinesCreateRequest {
  machineCode: string;
  machineName: string;
  machineType: string;
  location: string;
  isActive: boolean;
}
export interface MachinesUpdateRequest {
  id: number;
  machineName: string;
  machineType: string;
  location: string;
  isActive: boolean;
}

export interface ComponentsCreateRequest {
  componentCode: string;
  componentName: string;
  drawingNumber: string;
  unitOfMeasure: string;
  cycleTimeMinutes: number;
  isActive: boolean;
}
export interface ComponentsUpdateRequest {
  id: number;
  componentName: string;
  drawingNumber: string;
  unitOfMeasure: string;
  cycleTimeMinutes: number;
  isActive: boolean;
}

export interface MachineComponentsCreateRequest {
  machineId: number;
  componentId: number;
  cycleTimeMinutes: number;
  componentRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

export interface OperatorsCreateRequest {
  operatorCode: string;
  fullName: string;
  phone: string;
  email: string;
  dateOfJoining: string;
  designationOrTrade: string;
  userId: number | null;
  isActive: boolean;
}

export interface DowntimeCategoriesCreateRequest {
  categoryName: string;
  isActive: boolean;
}
export interface DowntimeCategoriesUpdateRequest extends DowntimeCategoriesCreateRequest {
  id: number;
}

export interface RejectionTypesCreateRequest {
  typeName: string;
  isActive: boolean;
}

export interface RejectionReasonsCreateRequest {
  rejectionTypeId: number;
  reasonName: string;
  isActive: boolean;
}

export interface SalaryRulesCreateRequest {
  ruleName: string;
  salaryType: 'Hourly' | 'Daily' | 'Monthly';
  baseRate: number;
  overtimeRate: number;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
}

export interface UsersCreateRequest {
  roleId: number;
  username: string;
  email: string;
  displayName: string;
  password: string;
  isActive: boolean;
}
export interface UsersUpdateRequest {
  id: number;
  roleId: number;
  email: string;
  displayName: string;
  isActive: boolean;
}

export interface AttendanceCreateRequest {
  operatorId: number;
  shiftId: number;
  attendanceDate: string;
  inTime: string;
  outTime: string;
  status: 'Present' | 'Absent' | 'HalfDay' | 'Leave' | 'Holiday';
  workingMinutes: number | null;
  overtimeMinutes: number;
  remarks: string | null;
}

export interface WorkSessionsCreateRequest {
  workDate: string;
  shiftId: number;
  operatorId: number;
  machineId: number;
  componentId: number;
  machineComponentId: number;
  startTime: string;
  remarks: string | null;
}

export interface ProductionEntriesCreateRequest {
  workSessionId: number;
  producedQuantity: number;
  entryTime: string | null;
  remarks: string | null;
}

export interface RejectionEntriesCreateRequest {
  workSessionId: number;
  rejectionTypeId: number;
  rejectionReasonId: number;
  rejectedQuantity: number;
  entryTime: string | null;
  remarks: string | null;
}

export interface SalaryRecordsCreateRequest {
  operatorId: number;
  salaryRuleId: number;
  periodMonth: number;
  periodYear: number;
  incentiveAmount: number;
  deductionAmount: number;
}
export interface CompleteWorkSessionRequest {
  id: number;
  endTime: string;
  remarks: string;
}
export interface CloseDowntimeRequest {
  id: number;
  endTime: string;
  remarks: string;
}
export interface AssignMenusRequest {
  menuIds: number[];
}
export interface AssignWidgetsRequest {
  widgetIds: number[];
}
export interface RoleCreateRequest {
  roleName: string;
  description: string;
  isActive: boolean;
}
export interface RoleUpdateRequest extends RoleCreateRequest {
  id: number;
}
