/**
 * Custom Windows signing function for Certum USB tokens
 * Requires SimplySign Desktop to be running in the background
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

  // Certificate thumbprint
  const certThumbprint = 'EDDEDFF1B14FC265517FD3D3E51AEF239AF672BB';

  // Find signtool.exe
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

  // Build signtool arguments - use /s to specify store location
  const args = [
    'sign',
    '/sha1', certThumbprint,    // Use thumbprint
    '/s', 'MY',                  // Personal certificate store
    '/fd', 'sha256',             // File digest algorithm
    '/tr', 'http://timestamp.digicert.com',  // RFC 3161 timestamp server
    '/td', 'sha256',             // Timestamp digest algorithm
    '/d', 'Unstuck',             // Description
    '/du', 'https://github.com/florian-lup/unstuck-client',  // Description URL
    '/v',                        // Verbose output
    filePath,
  ];

  try {
    console.log('Please enter your USB token PIN if prompted...');
    const { stdout, stderr } = await execFileAsync(signtoolPath, args, {
      timeout: 120000, // 2 minutes for PIN entry
    });
    if (stdout) console.log(stdout);
    if (stderr) console.warn(stderr);
    console.log(`✓ Successfully signed ${path.basename(filePath)}`);
  } catch (error) {
    console.error(`✗ Failed to sign ${path.basename(filePath)}:`, error.message);
    if (error.stdout) console.log(error.stdout);
    if (error.stderr) console.error(error.stderr);
    
    // Provide helpful error message
    console.error('\n💡 Troubleshooting:');
    console.error('   1. Make sure SimplySign Desktop is running (check system tray)');
    console.error('   2. Ensure your USB token is plugged in');
    console.error('   3. Try unplugging and replugging the USB token');
    
    throw error;
  }
}

