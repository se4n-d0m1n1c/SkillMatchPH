import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';

// Exercise the real Edge handlers with isolated Auth/database boundaries.
async function handler(file, clients) {
  let serve;
  const source = (await readFile(new URL(`../supabase/functions/${file}/index.ts`, import.meta.url), 'utf8'))
    .replace(/^import .*createClient.*;\n/, '');
  vm.runInNewContext(stripTypeScriptTypes(source), {
    Request, Response, console,
    createClient: () => {
      assert.ok(clients.length, 'unexpected client creation');
      return clients.shift();
    },
    Deno: { env: { get: () => 'configured' }, serve: (fn) => { serve = fn; } },
  });
  return async (body) => {
    const response = await serve(new Request('https://example.test', {
      method: 'POST', headers: { Authorization: 'Bearer caller-session' },
      body: JSON.stringify(body),
    }));
    return { status: response.status, body: await response.json() };
  };
}

function profileResult(role) {
  return { select: () => ({ eq: (_field, id) => {
    assert.equal(id, 'email-owner');
    return { single: async () => ({ data: role ? { role } : null, error: null }) };
  } }) };
}

async function tokenHandler(role, { invalid = false, rpcError = null } = {}) {
  const calls = [];
  const run = await handler('complete-account-recovery', [
    { auth: { verifyOtp: async (input) => {
      assert.equal(input.type, 'recovery');
      return invalid ? { data: {}, error: new Error('invalid') } : {
        data: { user: { id: 'email-owner' }, session: { access_token: 'recovery-session' } }, error: null,
      };
    } } },
    { from: () => profileResult(role),
      rpc: async (name, args) => {
        calls.push({ name, args });
        return { data: [{ username: args.requested_username }], error: rpcError };
      },
      auth: { admin: {
        updateUserById: async (id, attrs) => { calls.push({ id, attrs }); return { error: null }; },
        signOut: async (token, scope) => { calls.push({ token, scope }); return { error: null }; },
      } },
    },
  ]);
  return { run, calls };
}

for (const role of ['admin', 'student']) {
  test(`${role}: email link changes only the token owner's password`, async () => {
    const { run, calls } = await tokenHandler(role);
    const result = await run({ token_hash: 'valid', action: 'password', password: 'new-password', target_user_id: 'another-user' });
    assert.equal(result.status, 200);
    assert.equal(result.body.success, true);
    assert.equal(calls[0].id, 'email-owner');
    assert.equal(calls[0].attrs.password, 'new-password');
    assert.deepEqual(calls[1], { token: 'recovery-session', scope: 'local' });
  });
  test(`${role}: email link changes username through the restricted RPC`, async () => {
    const { run, calls } = await tokenHandler(role);
    const result = await run({ token_hash: 'valid', action: 'username', username: ' New.Name ' });
    assert.equal(result.status, 200);
    assert.equal(calls[0].name, 'recover_account_username');
    assert.equal(calls[0].args.target_user_id, 'email-owner');
    assert.equal(calls[0].args.requested_username, 'new.name');
    assert.equal(calls.at(-1).token, 'recovery-session');
  });
}

test('invalid/reused email token cannot update credentials', async () => {
  const { run, calls } = await tokenHandler('admin', { invalid: true });
  const result = await run({ token_hash: 'expired', action: 'password', password: 'new-password' });
  assert.equal(result.status, 401);
  assert.equal(result.body.code, 'invalid_recovery_link');
  assert.equal(calls.length, 0);
});

for (const role of [null, 'unsupported']) {
  test(`missing or unsupported profile (${role}) cannot recover`, async () => {
    const { run, calls } = await tokenHandler(role);
    const result = await run({ token_hash: 'valid', action: 'password', password: 'new-password' });
    assert.equal(result.status, 403);
    assert.equal(result.body.tokenConsumed, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].token, 'recovery-session');
  });
}

test('duplicate username gives a safe error and cleans up the recovery session', async () => {
  const { run, calls } = await tokenHandler('admin', { rpcError: { message: 'That username is already in use' } });
  const result = await run({ token_hash: 'valid', action: 'username', username: 'taken' });
  assert.equal(result.status, 400);
  assert.equal(result.body.error, 'That username is already in use');
  assert.equal(result.body.tokenConsumed, true);
  assert.equal(calls.at(-1).token, 'recovery-session');
});

for (const role of ['admin', 'student']) {
  for (const correctPassword of [true, false]) {
    test(`legacy session: ${role} username change with ${correctPassword ? 'correct' : 'incorrect'} password`, async () => {
      const calls = [];
      const caller = {
        auth: { getUser: async () => ({ data: { user: { id: 'email-owner', email: 'owner@example.test' } } }) },
        rpc: async (name, args) => { calls.push({ name, args }); return { data: 'new.name', error: null }; },
      };
      const verifier = { auth: { signInWithPassword: async (credentials) => {
        assert.equal(credentials.email, 'owner@example.test');
        return { error: correctPassword ? null : new Error('wrong password') };
      } } };
      const admin = { from: () => profileResult(role), rpc: async (name, args) => {
        calls.push({ name, args }); return { data: [{ username: 'new.name' }], error: null };
      } };
      const run = await handler('change-student-username', [caller, verifier, admin]);
      const result = await run({ username: 'new.name', password: 'current-password' });
      assert.equal(result.status, correctPassword ? 200 : 401);
      if (!correctPassword) return assert.equal(calls.length, 0);
      assert.equal(result.body.username, 'new.name');
      assert.equal(calls[0].name, role === 'admin' ? 'update_own_admin_username' : 'change_student_username_after_verification');
      if (role === 'student') assert.equal(calls[0].args.target_user_id, 'email-owner');
      else assert.equal(calls[0].args.target_user_id, undefined);
    });
  }
}
