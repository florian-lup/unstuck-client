/**
 * Custom Windows signing function for Certum USB tokens
 * This script is needed because Certum tokens require specifying the CSP explicitly
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

  // Certificate thumbprint for Certum USB token
  const certThumbprint = 'EDDEDFF1B14FC265517FD3D3E51AEF239AF672BB';
  
  // Certum's Cryptographic Service Provider
  const csp = 'cryptoCertum3 CSP';

  // Find signtool.exe (electron-builder provides this in the cache)
  const signtoolPath = configuration.computeSignToolArgs
    ? path.join(
        process.env.LOCALAPPDATA || '',
        'electron-builder',
        'Cache',
        'winCodeSign',
        'winCodeSign-2.6.0',
        'windows-10',
        'x64',
        'signtool.exe'
      )
    : 'signtool.exe'; // Fallback to PATH

  // Build signtool arguments
  const args = [
    'sign',
    '/sha1', certThumbprint,
    '/fd', 'sha256',
    '/td', 'sha256',
    '/tr', 'http://timestamp.digicert.com',
    '/csp', csp,
    '/d', 'Unstuck',
    '/du', 'https://github.com/florian-lup/unstuck-client',
    filePath,
  ];

  try {
    const { stdout, stderr } = await execFileAsync(signtoolPath, args);
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✓ Successfully signed ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`✗ Failed to sign ${path.basename(filePath)}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    throw error;
  }
}

