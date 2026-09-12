# PRODVEX frontend

Editable Next.js App Router / TypeScript frontend for the existing PRODVEX API.

## Run in VS Code (Windows)

1. Install Node.js 20.9 or newer (Node 22 LTS is suitable).
2. Extract the ZIP. Open the **prodvex** folder containing `package.json` in VS Code.
3. Open **Terminal → New Terminal** and run:

```powershell
npm ci
Copy-Item .env.example .env.local
npm run dev
```

Open http://localhost:3000 and sign in with your **actual backend account**.
No demo credentials, fake records, or replacement backend are included.
Save an edited source file to see the change through Next.js Fast Refresh.

macOS/Linux: replace `Copy-Item .env.example .env.local` with `cp .env.example .env.local`.
If port 3000 is occupied: `npm run dev -- --port 3001`.

## API configuration

`.env.example` contains:

```env
NEXT_PUBLIC_API_BASE_URL=https://prodvex.runasp.net/api/v1
```

Restart the development server after changing environment variables. Your existing ASP.NET backend must allow the actual development origin (such as `http://localhost:3000`) through CORS and accept Authorization headers, JSON, and its documented HTTP methods. No backend changes are included.

## What is implemented

- Responsive login, protected route group, company/user shell, mobile Radix Sheet navigation, profile menu, and logout.
- Zustand session and sidebar preferences, Axios transport, envelope checks, global 401 handling, safe errors, and TanStack Query isolation between accounts/companies.
- Navigation generated from login `sidebar`, nested menu sorting, icon resolver, route safety checks, active states, and SuperAdmin gating.
- Dynamic dashboard widget registry driven by `myWidgets`; no fabricated metrics.
- 31 configured module/report screens, reusable validated form builder, filtered table, Excel download, browser print styles, dialogs, status badges, loading/error/empty states.
- Documented list integrations for shifts, machines, roles, attendance, and overtime. Array responses are checked at runtime; undocumented wrapper responses are rejected until adapted.
- Shift creation, overtime preview/create-from-attendance, and SuperAdmin logo upload.
- User/attendance/session/production/rejection/salary request forms and typed services. Their saves remain disabled until required lookup contracts can be verified.
- Shift toggle/delete and overtime draft approve/delete actions become available with a verified row ID mapping; unknown statuses remain read-only.
- Documented work-session complete/cancel, downtime close, and role assignment service methods.

## Important: integration is not fully complete

The supplied specification omits many endpoints, response DTOs, update bodies, permission fields, and lookup contracts. It explicitly prohibits guessing them. This project therefore includes **visible unavailable states and disabled dependent forms**, not invented integrations. See **[docs/API-CONTRACTS.md](docs/API-CONTRACTS.md)** for every gap and the files to edit.

Unconnected items include most master CRUD operations, role creation/editing and permission assignment UI, user management beyond its create form, production/downtime lists, salary approval/edit/delete, reports, most SuperAdmin management, and live KPI data. These are not represented as tested or completed API integrations.

## Authentication design

Access token and profile persist in **sessionStorage**, limited to the current browser tab. Refresh tokens stay in memory and are not persisted. Browser script storage cannot protect tokens from XSS; there is no claim of HttpOnly protection in this frontend-only architecture. No credentials are logged or hardcoded.

Refresh request is documented, but its response contract is not. `decodeRefresh` in `src/config/contracts.ts` is intentionally null. Until supplied, an expired session returns to login. Once a verified decoder is provided, the transport performs one shared pre-expiry refresh and prevents refresh loops. Reloading removes the in-memory refresh token, so the next access-token expiry requires login.

A 401 always clears the local session. Logout calls the documented endpoint when the refresh token is in memory, then clears local state even if the network fails. After a reload, only local logout is possible because the refresh token was deliberately not retained. The backend must enforce token expiry/revocation.

Sidebar membership controls page access. Action permissions are not in the supplied response schema: the adapter returns unknown by default and the backend authorizes documented commands. Connect `decodeActionPermission` when the actual permission contract is available. Frontend gates never replace backend authorization.

## Where to make changes

| Change                                         | File/folder                                        |
| ---------------------------------------------- | -------------------------------------------------- |
| Colours, spacing, mobile/print CSS             | `src/app/globals.css`                              |
| Login screen                                   | `src/app/(auth)/login/page.tsx`                    |
| Sidebar and top bar                            | `src/components/layout/`                           |
| Module routes, labels, fields, documented URLs | `src/config/resources.ts`                          |
| Response, ID, refresh, permission adapters     | `src/config/contracts.ts`                          |
| Shared module page                             | `src/features/resource-page.tsx`                   |
| Forms and validation                           | `src/components/forms/`, `src/schemas/resource.ts` |
| API transport and services                     | `src/lib/api/`                                     |
| Dashboard widget renderers                     | `src/components/dashboard/widget-registry.tsx`     |
| Request DTOs                                   | `src/types/requests.ts`                            |

Unknown assigned routes render a clean unavailable state. Navigation is never replaced with a hardcoded module list. If your backend returns different routes, change the route mapping to the verified values.

## Verification and production build

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm start
```

See `docs/VERIFICATION.md` for the actual checks performed in the delivery environment. Authenticated live-backend testing needs your real credentials; none were supplied. Full CRUD, session workflows, and approval rules cannot be validated against the live backend until the omitted contracts are provided.

Dependencies and the lockfile are included; `node_modules`, `.next`, personal credentials, and `.env.local` are excluded from the ZIP. The project uses locally authored shadcn-style Radix primitives and includes `components.json` for extending the component library.
