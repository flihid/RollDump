import { serve } from '@hono/node-server';
import { readFileSync } from 'fs';
import { join } from 'path';
import app from './index';

// Manual loading of .dev.vars for Node.js
const devVarsPath = join(process.cwd(), '.dev.vars');
const devVars = readFileSync(devVarsPath, 'utf-8')
  .split('\n')
  .reduce((acc: any, line) => {
    const [key, ...value] = line.split('=');
    if (key && value) {
      // Remove quotes if present
      acc[key.trim()] = value.join('=').trim().replace(/^"|"$/g, '');
    }
    return acc;
  }, {});

// Inject variables into process.env for the app to pick up
Object.assign(process.env, devVars);

const port = 8787;
console.log(`Server Rolldump (Node.js Mode) berjalan di http://localhost:${port}`);

serve({
  fetch: (req) => app.fetch(req, process.env),
  port
});
