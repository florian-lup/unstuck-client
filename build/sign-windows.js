/**
 * Custom Windows signing function for Certum USB tokens
 * Requires: proCertum CardManager installed and card initialized with PIN
 */
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execFileAsync = promisify(execFile);

export default async function sign(configuration) {
  const { path: filePath } = configuration;

  // Check if this is a Windows executable
  const ext = path.extname(filePath).toLowerCase();
  if (!['.exe', '.dll', '.node'].includes(ext)) {
    console.log(`Skipping ${path.basename(filePath)} - not a Windows executable`);
    return;
  }

  console.log(`Signing ${path.basename(filePath)} with Certum USB token...`);

  const signtoolPath = path.join(
    process.env.LOCALAPPDATA || '',
    'electron-builder',
    'Cache',
    'winCodeSign',
    'winCodeSign-2.6.0',
    'windows-10',
    'x64',
    'signtool.exe'
  );

  // Use /a for automatic selection and /n for certificate name
  const args = [
    'sign',
    '/a',                       // Automatic certificate selection
    '/n', 'Samson-Florian Lup', // Certificate subject name
    '/fd', 'sha256',            // File digest algorithm
    '/tr', 'http://timestamp.digicert.com',  // RFC 3161 timestamp
    '/td', 'sha256',            // Timestamp digest
    '/d', 'Unstuck',            // Description
    '/du', 'https://github.com/florian-lup/unstuck-client',
    '/v',                       // Verbose
    filePath,
  ];

  try {
    console.log('Please enter your USB token PIN if prompted...');
    const { stdout, stderr } = await execFileAsync(signtoolPath, args, {
      timeout: 120000,
    });
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✓ Successfully signed ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`✗ Failed to sign ${path.basename(filePath)}`);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    console.error('\n💡 Make sure:');
    console.error('   1. proCertum CardManager is installed');
    console.error('   2. USB token has been initialized with PIN/PUK');
    console.error('   3. USB token is plugged in');
    console.error('   Download CardManager: https://support.certum.eu/');
    throw error;
  }
}

