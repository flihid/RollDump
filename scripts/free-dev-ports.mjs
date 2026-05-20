/**
 * Bebaskan port dev (8788 API, 5173 Vite) sebelum `pnpm dev`.
 * Di Windows, Ctrl+C sering tidak mematikan child process Turbo — port tetap LISTENING.
 */
import { execSync } from 'node:child_process';

const PORTS = [8788, 5173];

function freePortWindows(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      windowsHide: true,
    });
    const pids = new Set();
    for (const line of output.split(/\r?\n/)) {
      if (!/LISTENING/i.test(line)) continue;
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (/^\d+$/.test(pid) && pid !== '0') pids.add(pid);
    }
    for (const pid of pids) {
      if (pid === String(process.pid)) continue;
      try {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore', windowsHide: true });
        console.log(`[dev] Port ${port} dibebaskan (PID ${pid})`);
      } catch {
        /* sudah mati */
      }
    }
  } catch {
    /* tidak ada proses di port ini */
  }
}

function freePortUnix(port) {
  try {
    execSync(`lsof -ti tcp:${port} | xargs -r kill -9`, {
      stdio: 'ignore',
      shell: true,
    });
    console.log(`[dev] Port ${port} dibebaskan`);
  } catch {
    /* tidak ada proses */
  }
}

for (const port of PORTS) {
  if (process.platform === 'win32') freePortWindows(port);
  else freePortUnix(port);
}
