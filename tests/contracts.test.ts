import test from 'node:test';
import assert from 'node:assert/strict';
import { createSchema, toPayload } from '../src/schemas/resource';
import { safeExportRows } from '../src/utils/export';
import { decodeRows } from '../src/lib/api/resources';
import { safeMessage } from '../src/lib/api/errors';
import {
  decodeLogin,
  hasUsableAccessToken,
  transport,
  request,
  mutation,
} from '../src/lib/api/client';
import { useAuthStore } from '../src/stores/auth-store';
import { resources } from '../src/config/resources';
import type { AuthSession } from '../src/types/api';
import {
  decodeSalaryRecord,
  decodeSalaryRecordPage,
} from '../src/lib/api/salary-records';

test('unknown response wrappers are rejected instead of guessed', () => {
  assert.throws(() => decodeRows('shifts', { items: [] }));
  assert.deepEqual(decodeRows('shifts', []).rows, []);
});
test('salary report requires a paginated response and accepts draft approval nulls', () => {
  const record = {
    id: 4,
    companyId: 2,
    userId: 7,
    userName: 'Ramesh',
    displayName: 'Ramu',
    fromDate: '2026-09-14',
    toDate: '2026-09-16',
    periodMonth: 9,
    periodYear: 2026,
    salaryPerHourSnapshot: 150,
    totalWorkHours: 8.0833,
    totalOtHours: 1,
    baseAmount: 1212.5,
    overtimeAmount: 0,
    incentiveAmount: 0,
    deductionAmount: 0,
    finalAmount: 1212.5,
    status: 'Draft',
    approvedBy: null,
    approvedAt: null,
    createdAt: '2026-09-16T10:12:37.4235587',
  };
  assert.equal(decodeSalaryRecord(record).finalAmount, 1212.5);
  assert.deepEqual(
    decodeSalaryRecordPage({
      items: [record],
      pageNumber: 1,
      pageSize: 20,
      totalCount: 1,
    }).items,
    [record],
  );
  assert.throws(() => decodeSalaryRecordPage([record]));
});
test('Excel strips sensitive fields and neutralizes formula strings', () => {
  assert.deepEqual(
    safeExportRows([
      {
        name: '=SUM(1,2)',
        password: 'private',
        refreshToken: 'private',
        quantity: 3,
      },
    ]),
    [{ name: "'=SUM(1,2)", quantity: 3 }],
  );
});
test('time payloads retain local times and append seconds', () => {
  const r = resources.find((r) => r.key === 'shifts')!;
  const values = {
    shiftName: 'Night',
    startTime: '22:00',
    endTime: '06:00',
    breakMinutes: 30,
    isActive: true,
  };
  assert.equal(createSchema(r.fields).safeParse(values).success, true);
  assert.equal(toPayload(values, r.fields).startTime, '22:00:00');
});
test('invalid dates, negative minutes and invalid month are rejected', () => {
  const shift = resources.find((r) => r.key === 'shifts')!;
  assert.equal(
    createSchema(shift.fields).safeParse({
      shiftName: 'A',
      startTime: '29:00',
      endTime: '17:00',
      breakMinutes: -1,
      isActive: true,
    }).success,
    false,
  );
  const salary = resources.find((r) => r.key === 'salary-records')!;
  assert.equal(
    createSchema(salary.fields).safeParse({
      operatorId: 1,
      salaryRuleId: 1,
      periodMonth: 13,
      periodYear: 2026,
      incentiveAmount: 0,
      deductionAmount: 0,
    }).success,
    false,
  );
});
test('stack traces are not user-visible', () => {
  assert.notEqual(
    safeMessage('Microsoft.Data.SqlClient.SqlException: private'),
    'Microsoft.Data.SqlClient.SqlException: private',
  );
});
test('login requires tokens and backend-provided navigation', () => {
  assert.throws(() => decodeLogin({ accessToken: 'abc' }));
});
test('login rejects a missing refresh token and an expired restored access token', () => {
  const expiresSoon = new Date(Date.now() + 60_000).toISOString();
  const loginPayload = {
    userId: 1,
    username: 'admin',
    displayName: 'Company Admin',
    email: 'admin@example.test',
    companyId: 1,
    companyName: 'Acme',
    roleId: 1,
    roleName: 'Admin',
    isSuperAdmin: false,
    accessToken: 'access',
    accessTokenExpiresAt: expiresSoon,
    refreshTokenExpiresAt: expiresSoon,
    sidebar: [],
    myWidgets: [],
  };
  assert.throws(() => decodeLogin(loginPayload));
  const session = decodeLogin({ ...loginPayload, refreshToken: 'refresh' });
  assert.equal(hasUsableAccessToken(session), true);
  assert.equal(
    hasUsableAccessToken({
      ...session,
      accessTokenExpiresAt: new Date(Date.now() - 1_000).toISOString(),
    }),
    false,
  );
});
test('only documented list endpoints are configured', () => {
  assert.deepEqual(
    resources.filter((r) => r.listUrl).map((r) => r.listUrl),
    [
      '/Shifts/GetAll',
      '/Machines/GetAll',
      '/Roles/GetAll',
      '/Attendance/GetAll',
      '/Overtime/GetAll',
    ],
  );
});
test('API success false fails and company ID is not injected', async () => {
  const session = {
    accessToken: 'test-only',
    accessTokenExpiresAt: new Date(Date.now() + 3600000).toISOString(),
    userId: 1,
    companyId: 2,
  } as AuthSession;
  useAuthStore.setState({ session });
  const original = transport.defaults.adapter;
  try {
    transport.defaults.adapter = async (config) => {
      assert.equal(config.params?.companyId, undefined);
      return {
        config,
        status: 200,
        statusText: 'OK',
        headers: {},
        data: {
          success: false,
          statusCode: 422,
          message: 'Invalid request',
          data: null,
          errors: null,
        },
      };
    };
    await assert.rejects(request('GET', '/Shifts/GetAll'), /Invalid request/);
    await assert.rejects(
      mutation('POST', '/Shifts/Create', {}),
      /Invalid request/,
    );
  } finally {
    transport.defaults.adapter = original;
    useAuthStore.setState({ session: null });
  }
});
