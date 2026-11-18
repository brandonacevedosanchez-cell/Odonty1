#!/usr/bin/env node
/**
 * Renderiza y valida los diagramas de docs/diagramas con Archify.
 *
 * Uso:
 *   node docs/diagramas/tools/render-workflows.mjs
 *   node docs/diagramas/tools/render-workflows.mjs --only odontograma
 *
 * Archify se localiza en este orden:
 *   1. variable de entorno ARCHIFY_BIN
 *   2. node_modules/archify/bin/archify.mjs
 *   3. docs/diagramas/tools/archify/bin/archify.mjs
 *   4. ../archify/archify/bin/archify.mjs
 *
 * Nunca se usan rutas absolutas de AppData ni carpetas temporales.
 */
import { existsSync, readdirSync, mkdirSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, '../../..');
const DIAGRAM_DIR = resolve(HERE, '..');
const RECEIPT_DIR = join(DIAGRAM_DIR, 'receipts');

const candidates = [
  process.env.ARCHIFY_BIN,
  join(ROOT, 'node_modules/archify/bin/archify.mjs'),
  join(DIAGRAM_DIR, 'tools/archify/bin/archify.mjs'),
  join(ROOT, '../archify/archify/bin/archify.mjs'),
].filter(Boolean);

const archify = candidates.find((candidate) => existsSync(candidate));
if (!archify) {
  console.error('No se encontró Archify. Instálalo o define ARCHIFY_BIN.');
  console.error('Pasos sugeridos (ver docs/diagramas/README.md):');
  console.error('  git clone https://github.com/tt-a1i/archify.git tools/archify');
  console.error('  npm run diagrams');
  console.error(`Buscado en:\n  ${candidates.join('\n  ')}`);
  process.exit(1);
}

const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex > -1 ? process.argv[onlyIndex + 1] : null;

const files = readdirSync(DIAGRAM_DIR)
  .filter((name) => name.endsWith('.workflow.json'))
  .filter((name) => !only || name === `${only}.workflow.json`)
  .sort();

if (files.length === 0) {
  console.error(only ? `No existe ${only}.workflow.json` : 'No hay archivos .workflow.json');
  process.exit(1);
}

mkdirSync(RECEIPT_DIR, { recursive: true });
// Los recibos son evidencia efímera: se regeneran en cada ejecución.
for (const name of readdirSync(RECEIPT_DIR)) {
  if (name.includes('.finalize') || name.includes('.browser-check') || name.includes('.delivery')) {
    rmSync(join(RECEIPT_DIR, name), { force: true });
  }
}

let failures = 0;
for (const name of files) {
  const input = join(DIAGRAM_DIR, name);
  const output = join(DIAGRAM_DIR, name.replace('.workflow.json', '.workflow.html'));
  const result = spawnSync(
    process.execPath,
    [
      archify,
      'finalize',
      'workflow',
      input,
      output,
      '--quality',
      'showcase',
      '--json',
      '--out-dir',
      RECEIPT_DIR,
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );

  const stdout = result.stdout ?? '';
  const line = stdout.trim().split(/\r?\n/).filter(Boolean).pop() ?? '';
  let report = null;
  try {
    report = JSON.parse(line);
  } catch {
    report = null;
  }

  if (!report) {
    failures += 1;
    console.error(`FALLO ${name}`);
    console.error((result.stderr || stdout || 'sin salida').trim());
    continue;
  }

  const gates = report.gates ?? {};
  const ok = report.ok === true;
  if (!ok) failures += 1;
  const gateText = Object.entries(gates).map(([gate, status]) => `${gate}=${status}`).join(' ');
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${gateText}`);

  for (const diagnostic of report.diagnostics ?? []) {
    const code = diagnostic.code ?? diagnostic.id ?? 'diagnóstico';
    const message = diagnostic.message ?? diagnostic.detail ?? '';
    console.log(`     - ${code}: ${message}`);
  }
}

console.log(`\n${files.length - failures}/${files.length} diagramas finalizados con --quality showcase.`);
if (failures > 0) process.exit(1);
