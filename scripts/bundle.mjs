/**
 * Post-compile step: copies .js → .mjs for ESM consumers.
 * Keeps the build simple — no bundler needed for a single-file library.
 */
import {readFileSync, writeFileSync, readdirSync, statSync} from 'fs';
import {join} from 'path';

const distDir = join(process.cwd(), 'dist');

function processDir(dir) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      processDir(full);
    } else if (entry.endsWith('.js')) {
      const content = readFileSync(full, 'utf8');
      writeFileSync(full.replace(/\.js$/, '.mjs'), content, 'utf8');
    }
  }
}

processDir(distDir);
console.log('✓ .mjs copies created');
