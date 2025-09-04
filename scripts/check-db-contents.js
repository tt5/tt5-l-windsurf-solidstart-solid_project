import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(process.cwd(), 'data', 'app.db');

console.log('Checking database file:', dbPath);
console.log('File exists:', fs.existsSync(dbPath));

if (fs.existsSync(dbPath)) {
  try {
    const stats = fs.statSync(dbPath);
    console.log('File size:', stats.size, 'bytes');
    
    // Read first 100 bytes
    const fd = fs.openSync(dbPath, 'r');
    const buffer = Buffer.alloc(100);
    fs.readSync(fd, buffer, 0, 100, 0);
    console.log('First 100 bytes:', buffer.toString('hex'));
    fs.closeSync(fd);
  } catch (error) {
    console.error('Error reading file:', error);
  }
} else {
  console.log('Database file does not exist');
}
