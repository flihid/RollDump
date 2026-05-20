import { serve } from '@hono/node-server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import type { Server } from 'node:http';
import app from './index';

const devVarsPath = join(process.cwd(), '.dev.vars');
if (existsSync(devVarsPath)) {
  const devVars = readFileSync(devVarsPath, 'utf-8')
    .split('\n')
    .reduce((acc: Record<string, string>, line) => {
      const [key, ...value] = line.split('=');
      if (key && value.length) {
        acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
      }
      return acc;
    }, {});
  Object.assign(process.env, devVars);
}

const port = Number(process.env.PORT) || 8788;

let server: Server | undefined;

try {
  server = serve({
    fetch: (req) => app.fetch(req, process.env),
    port,
  }) as Server;

  console.log(`Server Rolldump (Node.js Mode) berjalan di http://localhost:${port}`);
} catch (err: unknown) {
  const code = err && typeof err === 'object' && 'code' in err ? (err as NodeJS.ErrnoException).code : '';
  if (code === 'EADDRINUSE') {
    console.error(
      `\n[api] Port ${port} masih dipakai (biasanya sisa proses setelah Ctrl+C).\n` +
        `      Jalankan lagi: pnpm dev   (otomatis membersihkan port)\n` +
        `      Atau manual: pnpm dev:clean\n`,
    );
  }
  throw err;
}

server?.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[api] Port ${port} sudah dipakai. Coba: pnpm dev:clean lalu pnpm dev\n`,
    );
    process.exit(1);
  }
  throw err;
});

let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(`\n[api] ${signal} — menutup server…`);

  if (server && typeof server.close === 'function') {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  } else {
    process.exit(0);
  }
}

for (const sig of ['SIGINT', 'SIGTERM', 'SIGBREAK'] as const) {
  process.on(sig, () => shutdown(sig));
}
