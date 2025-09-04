import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(process.cwd(), 'data', 'app.db');

console.log('Checking database file:', dbPath);

if (fs.existsSync(dbPath)) {
  console.log('File exists');
  
  try {
    const stats = fs.statSync(dbPath);
    console.log('File size:', stats.size, 'bytes');
    console.log('Permissions:', (stats.mode & 0o777).toString(8));
    
    // Try to read the file
    try {
      const data = fs.readFileSync(dbPath, { encoding: 'utf8' });
      console.log('First 100 characters:', data.substring(0, 100));
    } catch (readError) {
      console.error('Error reading file as text:', readError.message);
      
      // Try reading as buffer
      try {
        const buffer = fs.readFileSync(dbPath);
        console.log('First 16 bytes as hex:', buffer.subarray(0, 16).toString('hex'));
      } catch (bufferError) {
        console.error('Error reading file as buffer:', bufferError.message);
      }
    }
  } catch (statError) {
    console.error('Error getting file stats:', statError.message);
  }
} else {
  console.log('File does not exist');
}
