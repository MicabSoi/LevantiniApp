const fs = require('fs');
const path = require('path');

const INPUT_FILE = 'Levantini_Codebase_Master_upload.txt';
const FILE_START_REGEX = /^\s*={3,}\s*FILE:\s*(.+?)\s*={3,}\s*$/i;

if (!fs.existsSync(INPUT_FILE)) {
  console.error(`❌ Cannot find ${INPUT_FILE}`);
  process.exit(1);
}

console.log(`📄 Reading: ${INPUT_FILE}`);
const content = fs.readFileSync(INPUT_FILE, 'utf8');
const lines = content.split('\n');

let currentPath = null;
let buffer = [];
let fileCount = 0;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const match = line.match(FILE_START_REGEX);

  if (match) {
    if (currentPath && buffer.length > 0) {
      const filePath = path.resolve('.', currentPath);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, buffer.join('\n'), 'utf8');
      console.log(`✅ Wrote: ${filePath}`);
      fileCount++;
    }

    currentPath = match[1].trim().replace(/^\/+/, ''); // Remove any leading slashes
    console.log(`📂 Detected FILE block: ${currentPath}`);
    buffer = [];
  } else {
    buffer.push(line);
  }
}

if (currentPath && buffer.length > 0) {
  const filePath = path.resolve('.', currentPath);
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, buffer.join('\n'), 'utf8');
  console.log(`✅ Wrote: ${filePath}`);
  fileCount++;
}

if (fileCount === 0) {
  console.warn(
    '⚠️ No files were updated. Check your === FILE: ... === headers.'
  );
} else {
  console.log(`🎉 Done. ${fileCount} files written.`);
}
