#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import { glob } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CLASS_ATTR_PATTERNS, CLASS_MAPPINGS } from './codemod-mappings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const args = process.argv.slice(2);
const flags = {
  dryRun: args.includes('--dry-run'),
  verbose: args.includes('--verbose'),
  help: args.includes('--help') || args.includes('-h'),
};

const globArg = args.find((arg) => !arg.startsWith('--')) || 'src/**/*.{tsx,ts,jsx,js}';

if (flags.help) {
  console.log(`
Uso: node scripts/codemod-theme.mjs [glob] [opciones]

Ejemplos:
  node scripts/codemod-theme.mjs
  node scripts/codemod-theme.mjs "src/components/**/*.tsx"
  node scripts/codemod-theme.mjs --dry-run
  node scripts/codemod-theme.mjs --verbose

Opciones:
  --dry-run    Muestra qué cambiaría sin escribir archivos
  --verbose    Imprime cada línea modificada
  --help, -h   Muestra esta ayuda
`);
  process.exit(0);
}

const transformClasses = (classString) => {
  let output = classString;
  let changed = false;

  for (const [regex, replacement] of CLASS_MAPPINGS) {
    const before = output;
    output = output.replace(regex, replacement);
    if (output !== before) changed = true;
  }

  return { output, changed };
};

const transformFile = (source) => {
  let result = source;
  let totalChanges = 0;
  const changedLines = [];

  for (const pattern of CLASS_ATTR_PATTERNS) {
    result = result.replace(pattern, (match, inner) => {
      const { output, changed } = transformClasses(inner);
      if (changed) {
        totalChanges++;
        if (flags.verbose) {
          changedLines.push({ from: inner, to: output });
        }
      }
      return match.replace(inner, output);
    });
  }

  return { output: result, totalChanges, changedLines };
};

const main = async () => {
  console.log(`\n🔍 Buscando archivos: ${globArg}`);
  console.log(`📁 Root: ${ROOT}\n`);

  const files = [];
  for await (const file of glob(globArg, { cwd: ROOT })) {
    files.push(path.resolve(ROOT, file));
  }

  if (files.length === 0) {
    console.log('⚠️  No se encontraron archivos.\n');
    return;
  }

  console.log(`📦 ${files.length} archivo(s) encontrado(s)\n`);

  let totalFilesChanged = 0;
  let totalChanges = 0;

  for (const file of files) {
    const source = await readFile(file, 'utf8');
    const { output, totalChanges: fileChanges, changedLines } = transformFile(source);

    if (fileChanges === 0) continue;

    totalFilesChanged++;
    totalChanges += fileChanges;

    const relPath = path.relative(ROOT, file);
    console.log(`✏️  ${relPath}  (${fileChanges} cambio(s))`);

    if (flags.verbose) {
      for (const { from, to } of changedLines) {
        console.log(`    ${from}`);
        console.log(`  → ${to}\n`);
      }
    }

    if (!flags.dryRun) {
      await writeFile(file, output, 'utf8');
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Archivos modificados: ${totalFilesChanged}`);
  console.log(`✅ Total de cambios: ${totalChanges}`);
  if (flags.dryRun) {
    console.log('ℹ️  Modo dry-run: no se escribió ningún archivo.');
    console.log('   Quita --dry-run para aplicar los cambios.');
  }
  console.log('─'.repeat(60) + '\n');
};

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
