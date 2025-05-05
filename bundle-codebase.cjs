const fs = require('fs');
const path = require('path');

const INCLUDED_FOLDERS = [
  './src/components',
  './src/context',
  './src/hooks',
  './src/lib',
  './src/types',
  './supabase/functions',
];

const INCLUDED_FILES = [
  './App.tsx',
  './main.tsx',
  './vite-env.d.ts',
  './vite.config.ts',
  './tailwind.config.js',
  './postcss.config.js',
  './tsconfig.json',
  './tsconfig.app.json',
  './tsconfig.node.json',
  './index.css',
  './index.html',
  './.env',
  './package.json',
  './package-lock.json',
];

const OUTPUT_FILE = 'Levantini_Codebase_Master_download.txt';
const ALLOWED_EXTENSIONS = [
  '.ts',
  '.tsx',
  '.js',
  '.json',
  '.css',
  '.html',
  '.env',
];

function walk(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walk(filePath, fileList);
    } else if (ALLOWED_EXTENSIONS.includes(path.extname(file))) {
      fileList.push(filePath);
    }
  });
  return fileList;
}

function bundleFiles() {
  const output = [];

  // Include files from folders
  for (const folder of INCLUDED_FOLDERS) {
    const files = walk(folder);
    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      output.push(`=== FILE: ${file} ===\n${content}\n`);
    }
  }

  // Include top-level files
  for (const file of INCLUDED_FILES) {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      output.push(`=== FILE: ${file} ===\n${content}\n`);
    }
  }

  fs.writeFileSync(OUTPUT_FILE, output.join('\n'), 'utf8');
  console.log(`✅ All files bundled into ${OUTPUT_FILE}`);
}

bundleFiles();
