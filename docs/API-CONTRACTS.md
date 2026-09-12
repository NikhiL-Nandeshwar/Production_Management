# API contract inventory and connection checklist

Source: the supplied `Pasted text(3).txt` (preserved as `original-specification.txt`). The live Swagger document could not be retrieved from the delivery environment. No controller naming convention was extrapolated into a new endpoint.

## Module route inventory

| Frontend route                 | Documented list    | Documented create/start/generate |
| ------------------------------ | ------------------ | -------------------------------- |
| `/masters/shifts`              | /Shifts/GetAll     | /Shifts/Create                   |
| `/masters/machines`            | /Machines/GetAll   | Not supplied                     |
| `/masters/components`          | Not supplied       | Not supplied                     |
| `/masters/machine-components`  | Not supplied       | Not supplied                     |
| `/masters/operators`           | Not supplied       | Not supplied                     |
| `/masters/downtime-categories` | Not supplied       | Not supplied                     |
| `/masters/rejection-types`     | Not supplied       | Not supplied                     |
| `/masters/rejection-reasons`   | Not supplied       | Not supplied                     |
| `/masters/salary-rules`        | Not supplied       | Not supplied                     |
| `/admin/roles`                 | /Roles/GetAll      | Not supplied                     |
| `/admin/users`                 | Not supplied       | /Users/Create                    |
| `/attendance`                  | /Attendance/GetAll | /Attendance/Create               |
| `/production/work-sessions`    | Not supplied       | /WorkSessions/Start              |
| `/production/entries`          | Not supplied       | /ProductionEntries/Create        |
| `/quality/rejection-entries`   | Not supplied       | /RejectionEntries/Create         |
| `/downtime/entries`            | Not supplied       | Not supplied                     |
| `/salary/overtime`             | /Overtime/GetAll   | Not supplied                     |
| `/salary/records`              | Not supplied       | /SalaryRecords/Generate          |
| `/superadmin/companies`        | Not supplied       | Not supplied                     |
| `/superadmin/modules`          | Not supplied       | Not supplied                     |
| `/superadmin/menus`            | Not supplied       | Not supplied                     |
| `/superadmin/widgets`          | Not supplied       | Not supplied                     |
| `/reports/production`          | Not supplied       | Not supplied                     |
| `/reports/productivity`        | Not supplied       | Not supplied                     |
| `/reports/efficiency`          | Not supplied       | Not supplied                     |
| `/reports/attendance`          | Not supplied       | Not supplied                     |
| `/reports/rejection`           | Not supplied       | Not supplied                     |
| `/reports/downtime`            | Not supplied       | Not supplied                     |
| `/reports/operator`            | Not supplied       | Not supplied                     |
| `/reports/machine`             | Not supplied       | Not supplied                     |
| `/reports/component`           | Not supplied       | Not supplied                     |

## Additional documented requests

| Request                                                       | Implementation/status                                                                   |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| POST `/Auth/login`                                            | Connected; validates required session envelope fields                                   |
| POST `/Auth/logout`                                           | Connected while refresh token is available in memory                                    |
| POST `/Auth/refresh`                                          | Single-flight transport included; response decoder required                             |
| PUT `/Shifts/Update`                                          | URL known, update body/ID contract missing; intentionally no update request             |
| PATCH `/Shifts/{id}/toggle-active`                            | Row action; requires verified ID mapping                                                |
| DELETE `/Shifts/{id}/Delete`                                  | Confirmed row action; requires verified ID mapping                                      |
| POST `/Roles/Create`, PUT `/Roles/Update`                     | Request fields not supplied; disabled                                                   |
| POST `/Roles/{id}/AssignMenus`                                | Typed service; UI awaits full selectable catalog and current assignments                |
| POST `/Roles/{id}/AssignWidgets`                              | Typed service; UI awaits full catalog and current assignments                           |
| POST `/WorkSessions/Complete`                                 | Typed service; list, status and ID contract required to expose UI safely                |
| POST `/WorkSessions/{id}/Cancel`                              | Typed service and conditional Open row action                                           |
| POST `/DowntimeEntries/Close`                                 | Typed service; downtime list/status/ID contract missing                                 |
| GET `/Overtime/Preview/{attendanceId}`                        | Connected using explicit attendance ID; scalar fields displayed without inventing names |
| POST `/Overtime/FromAttendance/{attendanceId}`                | Confirmation after successful preview                                                   |
| POST `/Overtime/Create`, PUT `/Overtime/Update`               | Request schemas missing; intentionally unavailable                                      |
| POST `/Overtime/{id}/Approve`, DELETE `/Overtime/{id}/Delete` | Conditional draft-only actions requiring ID mapping                                     |
| POST `/Companies/{id}/UploadLogo`                             | Connected for SuperAdmin, `FormData` field `logo`                                       |

## Connecting omitted contracts

1. Supply the actual Swagger JSON and representative sanitized response samples.
2. Update only verified URLs in `src/config/resources.ts`.
3. Configure `listContracts` in `src/config/contracts.ts`. Each adapter takes `data`, not the outer envelope, and returns `rows`; add `total` for documented pagination and `idField` for a verified identifier. Do not assume `items`, `records`, `data`, `id`, or `totalCount` without confirmation. A direct array of objects is structurally accepted; wrapped objects fail visibly.
4. Document returned fields for labels and dependent lookups. Current lookup filtering uses the explicitly referenced business fields (`isActive`, `machineId`, `componentId`, `rejectionTypeId`, `status`). Confirm their presence in response DTOs before enabling a lookup. Missing `status` never counts as Open/Draft.
5. Add verified refresh and action permission decoders. Do not map permissions from guessed role names.
6. Add update schemas with the actual immutable and identifier fields. No generic update sends an invented `{id}`.
7. Add read-only/detail DTOs for salary breakdown and downtime durations, then attach the existing typed commands to verified row-state UI.
8. Add report and widget data contracts before rendering numeric metrics or charts.

## Known gaps by area

- **Masters:** only shift endpoints and machine GET were given. Other controller URLs, GetById APIs, update bodies, IDs, nullability, uniqueness rules, validation limits and response DTOs are missing.
- **Lookups:** operator/component/machine-component/rejection/salary-rule list APIs missing; even documented shift/role lists omit their returned ID fields. Forms requiring those lookups are deliberately blocked. Attendance filtering accepts an explicitly entered operator ID because the filter parameter is documented; it does not fabricate lookup choices.
- **Roles:** complete menus/widgets catalogs and current assignments absent. Current user's sidebar is not a complete assignment catalog and must not be used to overwrite another role's permissions.
- **Users:** list/update/toggle/reset-password/delete APIs and contracts absent.
- **Attendance:** GetAll/Create known; response pagination wrapper, update/delete endpoints absent. Search filters the current server page, not all server records. Excel exports the current filtered page. Date and operator filters remain in component state while paging.
- **Work sessions:** Start/Complete/Cancel known; list/detail/filter responses absent. Open-session lookup must be authoritative before entries can be saved.
- **Quality:** rejection create payload known, but type/reason lists and response contracts absent. Cascading type/reason filtering is included but blocked until connected.
- **Downtime:** only Close payload known; list/create payload/status and duration response fields absent. Active timer UI is not fabricated.
- **Overtime:** GetAll, preview, from-attendance, approve, delete known; create/update payload and draft-status response contract missing. Unknown or Approved row statuses are read-only.
- **Salary:** Generate known; lists/edit/delete/approve APIs and calculation response absent. No salary totals are fabricated.
- **SuperAdmin:** logo upload known; company CRUD/SMTP/admin creation/module/menu assignments and platform catalog APIs absent.
- **Reports/dashboard:** no report/KPI data endpoints or widget schemas supplied. Only assigned metadata/fallbacks are displayed.
- **Company scope:** no list endpoint in the supplied excerpt explicitly documents a companyId query parameter. None is automatically sent, including for SuperAdmin. Company logo uses the specifically documented path ID, behind SuperAdmin gating.

## Validation limits

Forms enforce the specified primitive types, enum choices, nonnegative numeric values, positive IDs, time/date formats, and date ordering. Other required/optional rules inferred from examples remain provisional until DTO validation metadata is provided. The backend remains authoritative and errors are mapped into fields where the server supplies a field map. Overnight shifts are allowed; start/end clock times are not incorrectly compared as same-day datetimes.
