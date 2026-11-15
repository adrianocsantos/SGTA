import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import {
  createBinaryUpdateSession,
  applyBinaryUpdate,
  rollbackBinaryUpdate,
  requestBinaryUpdate,
  completePendingBinaryUpdate,
  validateExecutableBuffer
} from '../backend/binaryUpdate.js';

test('cria sessão de atualização com backup do binário atual', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgta-update-'));
  const binaryPath = path.join(dir, 'sgta-server');
  const original = Buffer.from('server-v1');
  fs.writeFileSync(binaryPath, original);

  const session = createBinaryUpdateSession({
    targetPath: binaryPath,
    stagedContent: Buffer.from('server-v2'),
    label: 'server'
  });

  assert.equal(session.status, 'staged');
  assert.equal(fs.existsSync(`${binaryPath}.bkp`), true);
  assert.equal(fs.readFileSync(session.stagedPath, 'utf8'), 'server-v2');
  assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'server-v1');

  const applied = await applyBinaryUpdate(session.id);
  assert.equal(applied.status, 'applied');
  assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'server-v2');
  assert.equal(fs.existsSync(`${binaryPath}.bkp`), true);

  const rollback = await rollbackBinaryUpdate(session.id);
  assert.equal(rollback.status, 'rolled_back');
  assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'server-v1');
});

test('supervisor aplica atualização solicitada após o worker encerrar', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sgta-supervised-update-'));
  const binaryPath = path.join(dir, 'sgta-server');
  fs.writeFileSync(binaryPath, 'server-v1', { mode: 0o755 });

  const session = createBinaryUpdateSession({
    targetPath: binaryPath,
    stagedContent: Buffer.from('server-v2'),
    label: 'server'
  });
  requestBinaryUpdate(session.id);

  assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'server-v1');
  const applied = completePendingBinaryUpdate(binaryPath);
  assert.equal(applied.status, 'applied');
  assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'server-v2');
  assert.equal(fs.statSync(binaryPath).mode & 0o111, 0o111);

  requestBinaryUpdate(session.id, 'rollback');
  const rolledBack = completePendingBinaryUpdate(binaryPath);
  assert.equal(rolledBack.status, 'rolled_back');
  assert.equal(fs.readFileSync(binaryPath, 'utf8'), 'server-v1');
});

test('valida binários Windows e Linux e rejeita arquivos comuns', () => {
  assert.equal(validateExecutableBuffer(Buffer.from([0x4d, 0x5a, 0x00]), 'win32')[0], 0x4d);
  assert.equal(validateExecutableBuffer(Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x00]), 'linux')[0], 0x7f);
  assert.throws(() => validateExecutableBuffer(Buffer.from('not-an-executable'), 'linux'), /Linux ELF/);
  assert.throws(() => validateExecutableBuffer(Buffer.from('not-an-executable'), 'win32'), /Windows PE/);
});
