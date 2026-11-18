#!/usr/bin/env node
/**
 * Exporta un diagrama de docs/diagramas a PNG, SVG y PDF para diapositivas.
 *
 * Uso:
 *   node docs/diagramas/tools/export-slides.mjs
 *   node docs/diagramas/tools/export-slides.mjs navegacion-odonty-resumen
 *   node docs/diagramas/tools/export-slides.mjs --width 1800
 *
 * Requiere un Chrome o Edge instalado. Se puede indicar la ruta con BROWSER_BIN.
 * Los archivos se escriben en docs/diagramas/export/.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const DIAGRAM_DIR = resolve(HERE, '..');
const EXPORT_DIR = join(DIAGRAM_DIR, 'export');

const args = process.argv.slice(2);
const readOption = (option, fallback) => {
  const index = args.indexOf(option);
  return index > -1 && args[index + 1] ? args[index + 1] : fallback;
};
const optionsWithValue = new Set(['--width', '--height', '--scale']);
const name =
  args.find((arg, index) => !arg.startsWith('-') && !optionsWithValue.has(args[index - 1])) ??
  'navegacion-odonty-resumen';
const width = Number(readOption('--width', 1500));
const scale = Number(readOption('--scale', 1.5));

const browsers = [
  process.env.BROWSER_BIN,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
].filter(Boolean);
const browser = browsers.find((candidate) => existsSync(candidate));

if (!browser) {
  console.error('No se encontró Chrome ni Edge. Define BROWSER_BIN con la ruta del ejecutable.');
  process.exit(1);
}

const htmlPath = join(DIAGRAM_DIR, `${name}.workflow.html`);
if (!existsSync(htmlPath)) {
  console.error(`No existe ${htmlPath}. Ejecuta antes npm run diagrams.`);
  process.exit(1);
}

const html = readFileSync(htmlPath, 'utf8');
const viewBox = html.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
if (!viewBox) {
  console.error('El HTML no contiene un SVG con viewBox reconocible.');
  process.exit(1);
}
const [, svgWidth, svgHeight] = viewBox.map(Number);
const height = Number(readOption('--height', Math.round((width * svgHeight) / svgWidth) + 60));

mkdirSync(EXPORT_DIR, { recursive: true });

const run = (flags, target) => {
  const result = spawnSync(browser, flags, { encoding: 'utf8' });
  if (!existsSync(target)) {
    console.error(result.stderr || result.stdout || `No se generó ${target}`);
    process.exitCode = 1;
    return false;
  }
  const size = readFileSync(target).length;
  console.log(`ok ${target} (${Math.round(size / 1024)} KB)`);
  return true;
};

const url = `${pathToFileURL(htmlPath).href}?theme=light&embed=1`;
const base = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--virtual-time-budget=4000'];

run(
  [...base, `--window-size=${width},${height}`, `--force-device-scale-factor=${scale}`, `--screenshot=${join(EXPORT_DIR, `${name}.png`)}`, url],
  join(EXPORT_DIR, `${name}.png`),
);

run(
  [...base, '--no-pdf-header-footer', `--print-to-pdf=${join(EXPORT_DIR, `${name}.pdf`)}`, url],
  join(EXPORT_DIR, `${name}.pdf`),
);

// SVG: se extrae el SVG del HTML y se le añaden los estilos del documento.
const styles = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)]
  .map((match) => match[1])
  .join('\n')
  .replaceAll(']]>', ']]]]><![CDATA[>');
const start = html.indexOf('<svg');
const end = html.indexOf('</svg>', start);
let svg = html.slice(start, end + 6);
const rootAttrs = html.match(/<html([^>]*)>/)?.[1] ?? '';
const preset = rootAttrs.match(/data-preset="([^"]+)"/)?.[1];
const openEnd = svg.indexOf('>') + 1;
let open = svg.slice(0, openEnd).replace(/\sdata-theme="[^"]*"/g, '').replace(/\sdata-preset="[^"]*"/g, '');
if (!/xmlns=/.test(open)) open = open.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
// La exportación siempre usa el tema claro de las diapositivas; el HTML de
// origen arranca en oscuro y resuelve el tema por JavaScript.
open = open.replace(/^<svg/, `<svg data-theme="light"${preset ? ` data-preset="${preset}"` : ''}`);
svg = open + svg.slice(openEnd);
svg = svg.replace(/(<svg[^>]*>)/, `$1\n<style><![CDATA[${styles}]]></style>`);
const svgPath = join(EXPORT_DIR, `${name}.svg`);
writeFileSync(svgPath, `${svg}\n`, 'utf8');
console.log(`ok ${svgPath}`);

console.log(`\nExportación de "${name}" en docs/diagramas/export/`);
