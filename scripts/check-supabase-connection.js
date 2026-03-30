import { readFileSync } from 'node:fs';

function readEnv(path) {
  const text = readFileSync(path, 'utf8');
  const env = {};

  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    env[match[1]] = match[2].replace(/^"|"$/g, '');
  }

  return env;
}

async function main() {
  const env = readEnv('.env');
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    process.exit(1);
  }

  const endpoint = `${url}/rest/v1/parking_lots?select=*&limit=1`;
  console.log('Probing:', endpoint);

  try {
    const response = await fetch(endpoint, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
    });

    const body = await response.text();
    console.log('status:', response.status);
    console.log('body:', body.slice(0, 500));
  } catch (error) {
    console.error('fetch_error:', error.message);
    process.exit(1);
  }
}

main();
