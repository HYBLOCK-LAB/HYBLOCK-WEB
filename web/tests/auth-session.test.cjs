const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const crypto = require('node:crypto');
const ts = require('typescript');
const { privateKeyToAccount } = require('viem/accounts');
const { RequestCookiesAdapter } = require('next/dist/server/web/spec-extension/adapters/request-cookies');
const { RequestCookies } = require('next/dist/compiled/@edge-runtime/cookies');

function load(relativePath, mocks, extras = {}) {
  const filename = path.resolve(__dirname, '..', relativePath);
  const source = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const context = { exports: {}, Buffer, crypto, process: { env: { WALLET_SESSION_SECRET: 'test-secret' } },
    require: (name) => Object.hasOwn(mocks, name) ? mocks[name] : require(name), ...extras };
  vm.runInNewContext(source, context, { filename });
  return context.exports;
}

const account = privateKeyToAccount(`0x${'11'.repeat(32)}`);
const otherAddress = `0x${'22'.repeat(20)}`;
const member = { id: 1, wallet_address: account.address.toLowerCase(), is_active: true, is_admin: true };
function signed(payload) {
  const raw = JSON.stringify(payload);
  return Buffer.from(raw).toString('base64url') + '.' + crypto.createHmac('sha256', 'test-secret').update(raw).digest('base64url');
}
function fixture({ payload, raw, activeMember = member, readOnly = true } = {}) {
  const jar = new Map();
  if (raw !== undefined || payload !== undefined) jar.set('hyblock_wallet_session', raw ?? signed(payload));
  let lookups = 0;
  const writable = {
    get: (name) => jar.has(name) ? { value: jar.get(name) } : undefined,
    set: (name, value) => jar.set(name, value),
    delete: (name) => jar.delete(name),
  };
  const cookie = readOnly
    ? RequestCookiesAdapter.seal(new RequestCookies(new Headers({ cookie: [...jar].map(([k,v]) => `${k}=${v}`).join('; ') })))
    : writable;
  const api = load('lib/wallet-session.ts', {
    'next/headers': { cookies: async () => cookie },
    '@/lib/supabase-member': { getMemberByWallet: async () => { lookups++; return activeMember; } },
  });
  return { api, jar, lookups: () => lookups };
}
const validPayload = () => ({ address: account.address.toLowerCase(), memberId: 1, expiresAt: Date.now() + 60000 });

test('valid signed session resolves member using read-only page cookies', async () => {
  const { api } = fixture({ payload: validPayload() });
  assert.equal((await api.getWalletSessionMember()).id, 1);
});
for (const [label, payload] of [
  ['expired', () => ({ ...validPayload(), expiresAt: Date.now() - 1 })],
  ['missing expiry', () => ({ address: account.address, memberId: 1 })],
  ['invalid address', () => ({ ...validPayload(), address: 'bad' })],
  ['wrong member ID', () => ({ ...validPayload(), memberId: 2 })],
]) {
  test(`${label} session returns null without mutating page cookies`, async () => {
    const { api } = fixture({ payload: payload() });
    assert.equal(await api.getWalletSessionMember(), null);
  });
}
test('inactive member is denied with read-only page cookies', async () => {
  const { api } = fixture({ payload: validPayload(), activeMember: { ...member, is_active: false } });
  assert.equal(await api.getWalletSessionMember(), null);
});
for (const raw of ['garbage', signed(validPayload()) + '.extra', signed(validPayload()).slice(0, -5)]) {
  test(`malformed or tampered cookie is denied: ${raw.slice(0, 12)}`, async () => {
    const { api, lookups } = fixture({ raw });
    assert.equal(await api.getWalletSessionMember(), null);
    assert.equal(lookups(), 0);
  });
}
test('real wallet signature issues session, consumes nonce, logout clears cookies', async () => {
  const { api, jar } = fixture({ readOnly: false });
  const { message } = await api.createWalletNonce(account.address);
  const signature = await account.signMessage({ message });
  await api.verifyWalletLogin({ address: account.address, message, signature });
  assert.equal(jar.has('hyblock_wallet_nonce'), false);
  assert.equal((await api.getWalletSessionMember()).id, 1);
  await assert.rejects(api.verifyWalletLogin({ address: account.address, message, signature }));
  await api.clearWalletSession();
  assert.equal(await api.getWalletSessionMember(), null);
});

function sessionRoute(current) {
  let cleared = false;
  const api = load('app/api/auth/wallet/session/route.ts', {
    '@/lib/wallet-session': {
      getWalletSession: async () => current,
      clearWalletSession: async () => { cleared = true; },
    },
  });
  return { api, cleared: () => cleared };
}
for (const [label, body, keep] of [
  ['same wallet', { address: account.address }, true],
  ['different wallet', { address: otherAddress }, false],
  ['initial disconnected browser', { address: null }, true],
  ['explicit disconnect', { address: null, disconnected: true }, false],
]) {
  test(`session reconciliation: ${label}`, async () => {
    const { api, cleared } = sessionRoute({ member, expiresAt: Date.now() + 60000 });
    const response = await api.POST(new Request('http://localhost', { method: 'POST', body: JSON.stringify(body) }));
    assert.equal(response.status, 200);
    assert.equal(Boolean((await response.json()).session), keep);
    assert.equal(cleared(), !keep);
    assert.equal(response.headers.get('cache-control'), 'no-store');
  });
}
test('invalid session reconciliation input is rejected', async () => {
  const { api } = sessionRoute(null);
  for (const body of ['null', '{', JSON.stringify({ address: 'bad' })]) {
    const response = await api.POST(new Request('http://localhost', { method: 'POST', body }));
    assert.equal(response.status, 400);
  }
});
test('attendance cannot act as the cookie account after wallet switch', async () => {
  let checkedIn = false;
  const { POST } = load('app/api/attendance/self-check-in/route.ts', {
    '@/lib/wallet-session': { getWalletSessionMember: async () => member },
    '@/lib/supabase-auth': {}, '@/lib/supabase-member': {}, '@/lib/utils': {},
    '@/lib/supabase-attendance': { checkInByMemberId: async () => { checkedIn = true; } },
  });
  const response = await POST(new Request('http://localhost', {
    method: 'POST', headers: { 'x-wallet-address': otherAddress }, body: JSON.stringify({ code: 'ABCDEF' }),
  }));
  assert.equal(response.status, 401);
  assert.equal(checkedIn, false);
});
test('cookie mutations are serialized even after a failed request', async () => {
  const { withWalletSessionLock } = load('lib/auth/wallet-session-client.ts', {});
  const order = [];
  const first = withWalletSessionLock(async () => { order.push(1); throw new Error('failure'); });
  const second = withWalletSessionLock(async () => { order.push(2); return 'ok'; });
  await assert.rejects(first);
  assert.equal(await second, 'ok');
  assert.deepEqual(order, [1, 2]);
});

test('SBT mint cannot act as the cookie account after wallet switch', async () => {
  const { POST } = load('app/api/certificates/mint-sbt/route.ts', {
    '@/lib/wallet-session': { getWalletSessionMember: async () => member },
    '@/lib/eas': {}, '@/lib/supabase-certificate': {},
  });
  const response = await POST(new Request('http://localhost', {
    method: 'POST', headers: { 'x-wallet-address': otherAddress },
  }));
  assert.equal(response.status, 401);
});

test('disconnect clears cookies even if the member database is unavailable', async () => {
  let cleared = false;
  const { POST } = load('app/api/auth/wallet/session/route.ts', {
    '@/lib/wallet-session': {
      getWalletSession: async () => { throw new Error('database unavailable'); },
      clearWalletSession: async () => { cleared = true; },
    },
  });
  const response = await POST(new Request('http://localhost', {
    method: 'POST', body: JSON.stringify({ address: null, disconnected: true }),
  }));
  assert.equal(response.status, 200);
  assert.equal(cleared, true);
});
