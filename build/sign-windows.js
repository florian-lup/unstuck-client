/**
 * Custom Windows signing function for Certum USB tokens
 * Uses Certum's SmartSign tool which properly handles USB token certificates
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export default async function sign(configuration) {
  const { path: filePath } = configuration;

  // Check if this is a Windows executable
  const ext = path.extname(filePath).toLowerCase();
  if (!['.exe', '.dll', '.node'].includes(ext)) {
    console.log(`Skipping ${path.basename(filePath)} - not a Windows executable`);
    return;
  }

  console.log(`Signing ${path.basename(filePath)} with Certum SmartSign...`);

  // Certum SmartSign paths
  const smartSignPath = 'C:\\Program Files\\Certum\\SimplySign Desktop\\proCertum SmartSign\\proCertumSmartSign.exe';

  // Check if SmartSign is available
  if (!fs.existsSync(smartSignPath)) {
    console.error('✗ Certum SmartSign not found. Please install SimplySign Desktop.');
    throw new Error('Certum SmartSign not installed');
  }

  // SmartSign uses signtool internally but handles USB token access properly
  const args = [
    'sign',
    '/fd', 'sha256',
    '/tr', 'http://timestamp.digicert.com',
    '/td', 'sha256',
    '/d', 'Unstuck',
    filePath,
  ];

  try {
    console.log('Please unlock your USB token if prompted...');
    const { stdout, stderr } = await execFileAsync(smartSignPath, args, {
      timeout: 120000, // 2 minutes for PIN entry
    });
    if (stdout) console.log(stdout);
    if (stderr && !stderr.includes('Successfully signed')) console.warn(stderr);
    console.log(`✓ Successfully signed ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`✗ Failed to sign ${path.basename(filePath)}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

