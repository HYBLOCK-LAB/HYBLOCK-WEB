const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file, mocks = {}) {
  const filename = path.resolve(__dirname, '..', file);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  const ctx = { exports: {}, process: { env: {} }, console, require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name) };
  vm.runInNewContext(source, ctx, { filename });
  return ctx.exports;
}
const policy = load('lib/attendance-policy.ts');
const start = '2026-10-28T00:00:00.000Z';
for (const minutes of [0, 5, 10, 30, 180]) test(`late boundary at ${minutes} minutes is inclusive`, () => {
  const boundary = new Date(start).getTime() + minutes * 60000;
  assert.equal(policy.calculateAttendanceStatus(start, new Date(boundary), minutes), 'present');
  assert.equal(policy.calculateAttendanceStatus(start, new Date(boundary + 1), minutes), 'late');
});
test('legacy threshold is ten minutes and only whole minutes are accepted', () => {
  assert.equal(policy.calculateAttendanceStatus(start, new Date(new Date(start).getTime() + 6 * 60000)), 'present');
  for (const bad of [-1, 181, 1.5, '5', null, NaN, Infinity]) assert.equal(policy.isValidLateAfterMinutes(bad), false);
});
function fixture({ missing = false, inactive = false, scheduled = false } = {}) {
  const state = {
    attendance_session: [{ session_id: 's1', cohort: 1, title: '기본 1', session_type: 'basic', target_affiliation: null,
      status: scheduled ? 'scheduled' : 'in_progress', session_start_time: new Date(Date.now() - 6 * 60000).toISOString(),
      session_end_time: new Date(Date.now() + 15 * 60000).toISOString(), late_after_minutes: 5 }],
    member: [{ id: 1, name: '김하나', is_active: true }, { id: 2, name: '박둘', is_active: !inactive }], attendance_record: [], mutations: [],
  };
  const client = { from(table) {
    let action = 'select', payload, columns = '', filters = [];
    const q = {
      select(v) { columns = v; return q; }, eq(k, v) { filters.push(r => r[k] === v); return q; },
      in(k, v) { filters.push(r => v.includes(r[k])); return q; }, order() { return q; }, limit() { return q; },
      update(v) { action = 'update'; payload = v; return q; }, upsert(v) { action = 'upsert'; payload = v; return q; },
      insert(v) { action = 'insert'; payload = v; return q; }, delete() { action = 'delete'; return q; },
      returns() { return Promise.resolve(run(false)); }, maybeSingle() { return Promise.resolve(run(true)); },
      then(resolve, reject) { return Promise.resolve(run(false)).then(resolve, reject); },
    };
    function run(single) {
      if (missing && (columns.includes('late_after_minutes') || payload?.late_after_minutes !== undefined))
        return { data: null, error: { code: '42703', message: 'column attendance_session.late_after_minutes does not exist' } };
      const rows = state[table].filter(r => filters.every(f => f(r)));
      if (action === 'select') return { data: single ? rows[0] ?? null : rows, error: null };
      state.mutations.push({ table, action, payload });
      if (action === 'update') rows.forEach(r => Object.assign(r, payload));
      if (action === 'delete') state[table] = state[table].filter(r => !rows.includes(r));
      if (action === 'upsert' || action === 'insert') for (const row of Array.isArray(payload) ? payload : [payload]) {
        const old = state[table].find(r => r.session_id === row.session_id && r.member_id === row.member_id);
        if (old) Object.assign(old, row); else state[table].push({ ...row });
      }
      return { data: null, error: null };
    }
    return q;
  } };
  return { state, api: load('lib/supabase-attendance.ts', { '@/lib/supabase': { getSupabase: () => client }, '@/lib/attendance-policy': policy }) };
}
test('real check-in path uses saved five-minute threshold', async () => {
  const { api, state } = fixture();
  assert.equal((await api.checkInByMemberId(1, '기본 1')).status, 'late');
  assert.equal(state.attendance_record[0].status, 'late');
});
test('older DB reads and checks in with ten-minute fallback', async () => {
  const { api } = fixture({ missing: true });
  assert.equal((await api.checkInByMemberId(1, '기본 1')).status, 'present');
  assert.equal(Object.keys(await api.getEventLateAfterMinutes()).length, 0);
});
test('activation persists threshold and code together', async () => {
  const { api, state } = fixture({ scheduled: true });
  assert.match(await api.setActiveEvent('기본 1', 15), /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(state.attendance_session[0].late_after_minutes, 15);
  assert.equal(state.attendance_session[0].status, 'in_progress');
});
test('missing migration prevents activating with a silently ignored setting', async () => {
  const { api, state } = fixture({ scheduled: true, missing: true });
  await assert.rejects(api.setActiveEvent('기본 1', 15), /014/);
  assert.equal(state.attendance_session[0].status, 'scheduled');
});
test('bulk edit uses one upsert and preserves previous timestamps', async () => {
  const { api, state } = fixture();
  state.attendance_record.push({ member_id: 1, session_id: 's1', status: 'late', attended_at: start });
  await api.updateParticipantsAttendanceStatus({ eventName: '기본 1', memberIds: [1, 2, 1], status: 'present' });
  assert.equal(state.attendance_record.length, 2);
  assert.equal(state.attendance_record[0].attended_at, start);
  assert.equal(state.attendance_record[1].status, 'present');
  assert.equal(state.mutations.filter(m => m.action === 'upsert').length, 1);
});
test('absence clears timestamps; nonparticipation removes only selected records', async () => {
  const { api, state } = fixture();
  await api.updateParticipantsAttendanceStatus({ eventName: '기본 1', memberIds: [1, 2], status: 'absent' });
  assert.ok(state.attendance_record.every(r => r.attended_at === null));
  await api.updateParticipantAttendanceStatus({ eventName: '기본 1', memberId: 1, status: 'nonParticipation' });
  assert.equal(state.attendance_record.length, 1);
  assert.equal(state.attendance_record[0].member_id, 2);
});
test('inactive member rejects entire batch before writing', async () => {
  const { api, state } = fixture({ inactive: true });
  await assert.rejects(api.updateParticipantsAttendanceStatus({ eventName: '기본 1', memberIds: [1, 2], status: 'present' }));
  assert.equal(state.mutations.length, 0);
});
for (const ids of [[], [0], [1.5], Array.from({ length: 501 }, (_, i) => i + 1)]) test(`invalid selection (${ids.length} IDs) is rejected`, async () => {
  const { api, state } = fixture();
  await assert.rejects(api.updateParticipantsAttendanceStatus({ eventName: '기본 1', memberIds: ids, status: 'present' }));
  assert.equal(state.mutations.length, 0);
});
function routes(response = null) {
  const calls = [];
  const api = load('app/api/events/route.ts', {
    '@/lib/admin-auth': { requireAdminApiAccess: async () => ({ response }) }, '@/lib/attendance-policy': policy,
    '@/lib/supabase-attendance': {
      updateParticipantsAttendanceStatus: async p => calls.push(p),
      setActiveEvent: async (...args) => { calls.push(args); return 'ABCDEF'; },
      updateEventStatus: async (...args) => calls.push(args),
    },
  });
  return { api, calls };
}
const request = body => new Request('http://localhost/api/events', { method: 'POST', body: JSON.stringify(body) });
test('activation validates input and forwards zero minutes', async () => {
  const { api, calls } = routes();
  for (const v of [-1, '5', 1.5, 181]) assert.equal((await api.POST(request({ eventName: '기본 1', setActive: true, lateAfterMinutes: v }))).status, 400);
  assert.equal((await api.POST(request({ eventName: '기본 1', setActive: true, lateAfterMinutes: 0 }))).status, 200);
  assert.equal(calls[0][1], 0);
});
test('PATCH activation validates and forwards configured minutes', async () => {
  const { api, calls } = routes();
  assert.equal((await api.PATCH(request({ eventName: '기본 1', status: 'in_progress', lateAfterMinutes: -1 }))).status, 400);
  assert.equal((await api.PATCH(request({ eventName: '기본 1', status: 'in_progress', lateAfterMinutes: 7 }))).status, 200);
  assert.equal(calls[0][2], 7);
});
test('single/bulk edits stay compatible and reject invalid IDs', async () => {
  const { api, calls } = routes();
  assert.equal((await api.PATCH(request({ eventName: '기본 1', memberId: 1, attendanceStatus: 'late' }))).status, 200);
  assert.equal((await api.PATCH(request({ eventName: '기본 1', memberIds: [1, 2], attendanceStatus: 'absent' }))).status, 200);
  assert.equal((await api.PATCH(request({ eventName: '기본 1', memberIds: [1, '2'], attendanceStatus: 'absent' }))).status, 400);
  assert.equal(calls.length, 2);
});
test('mutations remain admin-only', async () => {
  const { api, calls } = routes(new Response('denied', { status: 403 }));
  assert.equal((await api.POST(request({ eventName: '기본 1', setActive: true }))).status, 403);
  assert.equal((await api.PATCH(request({ eventName: '기본 1', memberIds: [1], attendanceStatus: 'present' }))).status, 403);
  assert.equal(calls.length, 0);
});
