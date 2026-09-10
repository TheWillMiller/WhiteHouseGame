# White House · Free Roam

Play: https://thewillmiller.com/trumpgame/

Source: https://github.com/TheWillMiller/WhiteHouseGame

An unofficial browser game inspired by the supplied low-poly reference images. Play as Donald Trump, freely explore the modeled grounds, visit 32 furnished interior destinations on five floor maps, and talk to 14 NPCs. The grounds include the north and south lawns, gardens, pool, putting green, colonnades, and an illustrative East Wing ballroom construction site.

## Run

Use Node 22.13 or newer. Run `npm install`, then `npm run dev`. `npm run build` creates the static export in `dist/client`. The site does not require a server database, API key, or external game assets. Audio is synthesized locally and begins muted.

WASD / arrows move; Shift runs; Space jumps; drag looks around; Q / R turn; E interacts; M opens the map. Touch controls are available on phones and tablets. Use the map to travel directly to any modeled destination. Progress counters are per session.

## Custom-domain deployment

`npm run build:domain` exports the game for `/trumpgame` and stages its static assets in an ignored `.qa` folder. It generates `wrangler.trumpgame.jsonc`. With Cloudflare authentication configured, run `npm run deploy:domain` to rebuild and deploy the `white-house-game` static-assets Worker. The four routes cover `/trumpgame` and `/trumpgame/*` on both the apex and `www` hostnames. No server runtime, database, or paid API is required. Normal `npm run build` still produces the root-path export for Sites.

The domain build includes a narrowly scoped workaround for vinext beta.5's missing base path in loopback prerender requests. It fails if the game HTML is missing. Generated credentials, staging files, and local configuration are excluded from Git.

## Scope and sources

This is a public-plan adaptation, not a current measured blueprint. Major room relationships use the NPS brochure and the publicly archived West Wing tour plan. Rooms, scale, openings, furnishings, and upper floors are simplified or imagined for game navigation. The construction scene represents an illustrative stage, not live site progress. There are no claims to exact private layouts, security infrastructure, or full reproduction of every real White House room. All NPC conversations are fictional. The cast includes selected current and former second-administration figures; Karoline Leavitt is explicitly identified as a former press secretary.

- NPS rooms and grounds: https://www.nps.gov/whho/planyourvisit/park-brochure.htm
- Archived West Wing floor plan: https://obamawhitehouse.archives.gov/sites/default/files/docs/west-wing-tour-booklet.pdf
- Second floor history: https://www.whitehousehistory.org/white-house-tour/the-second-floor
- Ballroom proposal: https://www.ncpc.gov/projects/8733/
- Cabinet roster checked September 10, 2026: https://www.whitehouse.gov/administration/cabinet/
- Leavitt tenure: https://www.whitehouse.gov/releases/2026/08/never-surrender-karoline-leavitts-historic-tenure-as-white-house-press-secretary/

## Verification

`node tests/world.test.cjs` assembles every zone, validates finite mesh geometry, checks collision-free travel positions, flood-fills the walkable world to confirm every destination is connected, checks every NPC and entrance can be approached, and validates dialogue branches. `npx tsc --noEmit` checks TypeScript. The production build is checked before deployment.

No browser interaction or screenshot QA was requested. Optional WebMCP read/travel tools are feature-detected; a supported native WebMCP verification context was unavailable, so native registration has not been verified. The regular game controls do not depend on WebMCP.
