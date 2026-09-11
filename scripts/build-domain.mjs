import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const result = spawnSync(process.execPath, ['--import', './scripts/windows-shutdown.mjs', '--import', './scripts/prerender-base-path.mjs', 'node_modules/vinext/dist/cli.js', 'build'], {
  stdio: 'inherit', env: { ...process.env, GAME_BASE_PATH: '/trumpgame' },
});
if (result.status !== 0) process.exit(result.status || 1);
mkdirSync('.qa', { recursive: true });
const assets = mkdtempSync(resolve('.qa/domain-assets-'));
if (!existsSync('dist/client/index.html')) throw new Error('Static game HTML was not generated.');
cpSync('dist/client/trumpgame', resolve(assets, 'trumpgame'), { recursive: true });
for (const entry of readdirSync('dist/client', { withFileTypes: true })) {
  if (entry.name !== 'trumpgame' && entry.name !== 'vinext-client-entry-manifest.json' && !entry.name.startsWith('.')) {
    cpSync(resolve('dist/client', entry.name), resolve(assets, 'trumpgame', entry.name), { recursive: true });
  }
}
writeFileSync('wrangler.trumpgame.jsonc', JSON.stringify({
  $schema: './node_modules/wrangler/config-schema.json',
  name: 'white-house-game',
  account_id: '7bb150aa42a30ebf44b92edd7860e6b1',
  compatibility_date: '2026-09-10',
  workers_dev: false,
  assets: { directory: assets, html_handling: 'auto-trailing-slash', not_found_handling: '404-page' },
  routes: ['thewillmiller.com/trumpgame', 'thewillmiller.com/trumpgame/*', 'www.thewillmiller.com/trumpgame', 'www.thewillmiller.com/trumpgame/*'].map(pattern => ({ pattern, zone_name: 'thewillmiller.com' })),
}, null, 2) + '\n');
console.log('Domain assets staged at', assets);
