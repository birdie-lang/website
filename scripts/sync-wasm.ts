import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { copyFile, mkdir, mkdtemp, rename, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const birdie = fileURLToPath(new URL('../../birdie/', import.meta.url));
const output = fileURLToPath(new URL('../public/wasm/', import.meta.url));
const shim = join(output, 'wasm_exec.js');
const run = promisify(execFile);

await mkdir(output, { recursive: true });
const staging = await mkdtemp(join(output, '.sync-'));
try {
  const wasm = join(staging, 'birdie.wasm');
  const nextShim = join(staging, 'wasm_exec.js');
  const { stdout: goroot } = await run('go', ['env', 'GOROOT'], { cwd: birdie });
  await run('go', ['build', '-trimpath', '-o', wasm, './cmd/wasm'], {
    cwd: birdie,
    env: { ...process.env, GOOS: 'js', GOARCH: 'wasm' },
  });
  await copyFile(join(goroot.trim(), 'lib', 'wasm', 'wasm_exec.js'), nextShim);

  const backup = join(staging, 'previous-wasm_exec.js');
  const hadShim = existsSync(shim);
  if (hadShim) await copyFile(shim, backup);
  await rename(nextShim, shim);
  try {
    await rename(wasm, join(output, 'birdie.wasm'));
  } catch (error) {
    if (hadShim) await rename(backup, shim);
    else await rm(shim, { force: true });
    throw error;
  }

  console.log('Synced birdie.wasm and wasm_exec.js to public/wasm.');
} finally {
  await rm(staging, { recursive: true, force: true });
}
