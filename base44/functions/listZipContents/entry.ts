import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';
import JSZip from 'npm:jszip@3.10.1';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { zipUrl } = await req.json();

  const res = await fetch(zipUrl);
  if (!res.ok) return Response.json({ error: `Failed to fetch ZIP: ${res.status}` }, { status: 500 });

  const buffer = await res.arrayBuffer();
  const zip = await JSZip.loadAsync(buffer);

  // Extract unique top-level folder names inside Enemy Pack
  const enemies = new Set();
  Object.keys(zip.files).forEach(name => {
    const match = name.match(/Enemy Pack\/([^\/]+)\//);
    if (match && match[1] !== 'Enemy Avatars') enemies.add(match[1]);
  });

  // Get all PNG files grouped by enemy
  const byEnemy = {};
  Object.keys(zip.files).forEach(name => {
    if (!name.endsWith('.png')) return;
    const match = name.match(/Enemy Pack\/([^\/]+)\/(.+)/);
    if (!match) return;
    const [, enemy, file] = match;
    if (!byEnemy[enemy]) byEnemy[enemy] = [];
    byEnemy[enemy].push(file);
  });

  return Response.json({ enemies: Object.fromEntries(Object.entries(byEnemy).sort()) });
});