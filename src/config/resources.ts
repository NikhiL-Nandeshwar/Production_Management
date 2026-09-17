export interface FieldConfig {
  name: string;
  type: string;
  nullable: boolean;
}
export interface ResourceConfig {
  key: string;
  route: string;
  title: string;
  description: string;
  listUrl: string | null;
  createUrl: string | null;
  fields: FieldConfig[];
}
const routeAliases: Record<string, string> = {
  '/shifts': '/masters/shifts',
  '/machines': '/masters/machines',
  '/components': '/masters/components',
  '/downtime/categories': '/masters/downtime-categories',
};
export function normalizeResourceRoute(route: string) {
  return routeAliases[route] || route;
}
export const resources: ResourceConfig[] = [
  {
    key: 'shifts',
    route: '/masters/shifts',
    title: 'Shifts',
    description: 'Set the working rhythm of your shop floor.',
    listUrl: '/Shifts/GetAll',
    createUrl: '/Shifts/Create',
    fields: [
      {
        name: 'shiftName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'startTime',
        type: 'time',
        nullable: false,
      },
      {
        name: 'endTime',
        type: 'time',
        nullable: false,
      },
      {
        name: 'breakMinutes',
        type: 'number',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'machines',
    route: '/masters/machines',
    title: 'Machines',
    description: 'Manage the equipment behind every production run.',
    listUrl: '/Machines/GetAll',
    createUrl: null,
    fields: [
      {
        name: 'machineCode',
        type: 'text',
        nullable: false,
      },
      {
        name: 'machineName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'machineType',
        type: 'text',
        nullable: false,
      },
      {
        name: 'location',
        type: 'text',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'components',
    route: '/masters/components',
    title: 'Components',
    description: 'Maintain your part catalogue and drawing references.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'componentCode',
        type: 'text',
        nullable: false,
      },
      {
        name: 'componentName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'drawingNumber',
        type: 'text',
        nullable: false,
      },
      {
        name: 'unitOfMeasure',
        type: 'text',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'machine-components',
    route: '/masters/machine-components',
    title: 'Machine components',
    description: 'Configure cycle times, rates, and effective dates.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'machineId',
        type: 'lookup:machines',
        nullable: false,
      },
      {
        name: 'componentId',
        type: 'lookup:components',
        nullable: false,
      },
      {
        name: 'cycleTimeMinutes',
        type: 'number',
        nullable: false,
      },
      {
        name: 'componentRate',
        type: 'number',
        nullable: false,
      },
      {
        name: 'effectiveFrom',
        type: 'date',
        nullable: false,
      },
      {
        name: 'effectiveTo',
        type: 'date',
        nullable: true,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'operators',
    route: '/masters/operators',
    title: 'Operators',
    description: 'Keep your production team information organised.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'operatorCode',
        type: 'text',
        nullable: false,
      },
      {
        name: 'fullName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'phone',
        type: 'text',
        nullable: false,
      },
      {
        name: 'email',
        type: 'email',
        nullable: false,
      },
      {
        name: 'dateOfJoining',
        type: 'date',
        nullable: false,
      },
      {
        name: 'designationOrTrade',
        type: 'text',
        nullable: false,
      },
      {
        name: 'userId',
        type: 'number',
        nullable: true,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'downtime-categories',
    route: '/masters/downtime-categories',
    title: 'Downtime categories',
    description: 'Classify interruptions consistently.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'categoryName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'rejection-types',
    route: '/masters/rejection-types',
    title: 'Rejection types',
    description: 'Organise your quality classifications.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'typeName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'rejection-reasons',
    route: '/masters/rejection-reasons',
    title: 'Rejection reasons',
    description: 'Connect each rejection reason to its type.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'rejectionTypeId',
        type: 'lookup:rejection-types',
        nullable: false,
      },
      {
        name: 'reasonName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'salary-rules',
    route: '/masters/salary-rules',
    title: 'Salary rules',
    description: 'Define compensation rates and validity periods.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'ruleName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'salaryType',
        type: 'select:Hourly,Daily,Monthly',
        nullable: false,
      },
      {
        name: 'baseRate',
        type: 'number',
        nullable: false,
      },
      {
        name: 'overtimeRate',
        type: 'number',
        nullable: false,
      },
      {
        name: 'effectiveFrom',
        type: 'date',
        nullable: false,
      },
      {
        name: 'effectiveTo',
        type: 'date',
        nullable: true,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'roles',
    route: '/admin/roles',
    title: 'Roles & permissions',
    description: 'Manage roles and their menu and widget access.',
    listUrl: '/Roles/GetAll',
    createUrl: null,
    fields: [],
  },
  {
    key: 'users',
    route: '/admin/users',
    title: 'Users',
    description: 'Manage access to your company workspace.',
    listUrl: null,
    createUrl: '/Users/Create',
    fields: [
      {
        name: 'roleId',
        type: 'lookup:roles',
        nullable: false,
      },
      {
        name: 'username',
        type: 'text',
        nullable: false,
      },
      {
        name: 'email',
        type: 'email',
        nullable: false,
      },
      {
        name: 'displayName',
        type: 'text',
        nullable: false,
      },
      {
        name: 'password',
        type: 'password',
        nullable: false,
      },
      {
        name: 'isActive',
        type: 'boolean',
        nullable: false,
      },
    ],
  },
  {
    key: 'attendance',
    route: '/attendance',
    title: 'Attendance',
    description: 'Record attendance before starting production.',
    listUrl: '/Attendance/GetAll',
    createUrl: '/Attendance/Create',
    fields: [
      {
        name: 'operatorId',
        type: 'lookup:operators',
        nullable: false,
      },
      {
        name: 'shiftId',
        type: 'lookup:shifts',
        nullable: false,
      },
      {
        name: 'attendanceDate',
        type: 'date',
        nullable: false,
      },
      {
        name: 'inTime',
        type: 'datetime-local',
        nullable: false,
      },
      {
        name: 'outTime',
        type: 'datetime-local',
        nullable: false,
      },
      {
        name: 'status',
        type: 'select:Present,Absent,HalfDay,Leave,Holiday',
        nullable: false,
      },
      {
        name: 'workingMinutes',
        type: 'number',
        nullable: true,
      },
      {
        name: 'overtimeMinutes',
        type: 'number',
        nullable: false,
      },
      {
        name: 'remarks',
        type: 'textarea',
        nullable: true,
      },
    ],
  },
  {
    key: 'work-sessions',
    route: '/production/work-sessions',
    title: 'Work sessions',
    description: 'Start, track, and complete each production session.',
    listUrl: null,
    createUrl: '/WorkSessions/Start',
    fields: [
      {
        name: 'workDate',
        type: 'date',
        nullable: false,
      },
      {
        name: 'shiftId',
        type: 'lookup:shifts',
        nullable: false,
      },
      {
        name: 'operatorId',
        type: 'lookup:operators',
        nullable: false,
      },
      {
        name: 'machineId',
        type: 'lookup:machines',
        nullable: false,
      },
      {
        name: 'componentId',
        type: 'lookup:components',
        nullable: false,
      },
      {
        name: 'machineComponentId',
        type: 'lookup:machine-components',
        nullable: false,
      },
      {
        name: 'startTime',
        type: 'datetime-local',
        nullable: false,
      },
      {
        name: 'remarks',
        type: 'textarea',
        nullable: true,
      },
    ],
  },
  {
    key: 'production-entries',
    route: '/production/entries',
    title: 'Production entries',
    description: 'Record production against an open work session.',
    listUrl: null,
    createUrl: '/ProductionEntries/Create',
    fields: [
      {
        name: 'workSessionId',
        type: 'lookup:work-sessions',
        nullable: false,
      },
      {
        name: 'producedQuantity',
        type: 'number',
        nullable: false,
      },
      {
        name: 'entryTime',
        type: 'datetime-local',
        nullable: true,
      },
      {
        name: 'remarks',
        type: 'textarea',
        nullable: true,
      },
    ],
  },
  {
    key: 'rejection-entries',
    route: '/quality/rejection-entries',
    title: 'Rejection entries',
    description: 'Capture defects and their root causes.',
    listUrl: null,
    createUrl: '/RejectionEntries/Create',
    fields: [
      {
        name: 'workSessionId',
        type: 'lookup:work-sessions',
        nullable: false,
      },
      {
        name: 'rejectionTypeId',
        type: 'lookup:rejection-types',
        nullable: false,
      },
      {
        name: 'rejectionReasonId',
        type: 'lookup:rejection-reasons',
        nullable: false,
      },
      {
        name: 'rejectedQuantity',
        type: 'number',
        nullable: false,
      },
      {
        name: 'entryTime',
        type: 'datetime-local',
        nullable: true,
      },
      {
        name: 'remarks',
        type: 'textarea',
        nullable: true,
      },
    ],
  },
  {
    key: 'downtime-entries',
    route: '/downtime/entries',
    title: 'Downtime',
    description: 'Track production interruptions and recovery.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'overtime',
    route: '/salary/overtime',
    title: 'Overtime',
    description: 'Review attendance-based overtime and approve drafts.',
    listUrl: '/Overtime/GetAll',
    createUrl: null,
    fields: [],
  },
  {
    key: 'salary-records',
    route: '/reports/salary',
    title: 'Salary Report',
    description: 'Review and generate salary records from verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [
      {
        name: 'operatorId',
        type: 'lookup:operators',
        nullable: false,
      },
      {
        name: 'salaryRuleId',
        type: 'lookup:salary-rules',
        nullable: false,
      },
      {
        name: 'periodMonth',
        type: 'number',
        nullable: false,
      },
      {
        name: 'periodYear',
        type: 'number',
        nullable: false,
      },
      {
        name: 'incentiveAmount',
        type: 'number',
        nullable: false,
      },
      {
        name: 'deductionAmount',
        type: 'number',
        nullable: false,
      },
    ],
  },
  {
    key: 'companies',
    route: '/superadmin/companies',
    title: 'Companies',
    description: 'Platform configuration and company management.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'modules',
    route: '/superadmin/modules',
    title: 'Platform modules',
    description: 'Platform configuration and company management.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'menus',
    route: '/superadmin/menus',
    title: 'Platform menus',
    description: 'Platform configuration and company management.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'widgets',
    route: '/superadmin/widgets',
    title: 'Platform widgets',
    description: 'Platform configuration and company management.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-production',
    route: '/reports/production',
    title: 'Production report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-productivity',
    route: '/reports/productivity',
    title: 'Productivity report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-efficiency',
    route: '/reports/efficiency',
    title: 'Efficiency report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-attendance',
    route: '/reports/attendance',
    title: 'Attendance report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-rejection',
    route: '/reports/rejection',
    title: 'Rejection report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-downtime',
    route: '/reports/downtime',
    title: 'Downtime report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-operator',
    route: '/reports/operator',
    title: 'Operator report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-machine',
    route: '/reports/machine',
    title: 'Machine report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
  {
    key: 'report-component',
    route: '/reports/component',
    title: 'Component report',
    description: 'Review performance with verified backend data.',
    listUrl: null,
    createUrl: null,
    fields: [],
  },
];
export const resourceByKey = (key: string) =>
  resources.find((resource) => resource.key === key);
