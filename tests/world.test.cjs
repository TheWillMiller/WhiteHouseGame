// Geometry and navigation checks run without launching a browser or WebGL.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const ts = require('typescript');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.qa');
fs.mkdirSync(output, { recursive: true });
for (const file of ['world-data', 'visuals', 'player-model', 'game', 'webmcp']) {
 const source = fs.readFileSync(path.join(root, 'lib', file + '.ts'), 'utf8').replace("new T.WebGLRenderer({antialias:true,powerPreference:'high-performance'})", 'globalThis.__testRenderer()');
 const built = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText.replace(/from ['"]\.\/(world-data|visuals|player-model)['"]/g, (_, name) => "from './" + name + ".mjs'");
 fs.writeFileSync(path.join(output, file + '.mjs'), built);
}
const ctx = new Proxy({}, { get: () => () => {}, set: () => true });
global.document = Object.assign(new EventTarget(), { createElement: () => ({ width: 0, height: 0, getContext: () => ctx }) });
global.window = Object.assign(new EventTarget(), { devicePixelRatio: 1 });
global.ResizeObserver = class { constructor(fn){this.fn=fn;} observe(){this.fn();} disconnect(){} };
global.requestAnimationFrame=()=>1;global.cancelAnimationFrame=()=>{};
global.__testRenderer=()=>({domElement:Object.assign(new EventTarget(),{setAttribute(){},focus(){},remove(){}}),shadowMap:{},setPixelRatio(){},setSize(){},dispose(){},render(scene,camera){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);}});
(async () => {
 const { grounds, interior, Game } = await import(pathToFileURL(path.join(output, 'game.mjs')));
 const { destinations, npcs, floors } = await import(pathToFileURL(path.join(output, 'world-data.mjs')));
 assert.equal(new Set(destinations.map(d => d.id)).size, destinations.length, 'unique destination IDs');
 assert.equal(new Set(npcs.map(d => d.id)).size, npcs.length, 'unique NPC IDs');
 let count = 0;
 for (const { id: zone } of floors) {
 const world = zone === 'grounds' ? grounds() : interior(zone);
 assert(world.group.children.some(o=>o.isMesh),'world has rendered geometry');
  const minX = zone === 'grounds' ? -98 : -28.5, maxX = -minX;
  const minZ = zone === 'grounds' ? -95 : -18.5, maxZ = zone === 'grounds' ? 126 : 18.5;
  const step = .5, width = Math.round((maxX-minX)/step)+1, height = Math.round((maxZ-minZ)/step)+1;
  const blocked = new Uint8Array(width*height), reached = new Uint8Array(width*height);
  const index = (x,z) => Math.round((z-minZ)/step)*width+Math.round((x-minX)/step);
  const blockedAt=(x,z)=>world.solids.some(o=>Math.abs(x-o.x)<o.w/2+.36&&Math.abs(z-o.z)<o.d/2+.36);
  for (const o of world.solids) {
   for(let j=Math.max(0,Math.ceil((o.z-o.d/2-.36-minZ)/step));j<=Math.min(height-1,Math.floor((o.z+o.d/2+.36-minZ)/step));j++)
    for(let i=Math.max(0,Math.ceil((o.x-o.w/2-.36-minX)/step));i<=Math.min(width-1,Math.floor((o.x+o.w/2+.36-minX)/step));i++) blocked[j*width+i]=1;
  }
  const start=index(0,zone==='grounds'?38:0), queue=[start];assert(!blocked[start],zone+' starting point is clear');reached[start]=1;
  for(let n=0;n<queue.length;n++){const cell=queue[n],x=cell%width,z=Math.floor(cell/width);for(const [dx,dz] of [[0,1],[0,-1],[1,0],[-1,0]]){const nx=x+dx,nz=z+dz,next=nz*width+nx;if(nx>=0&&nx<width&&nz>=0&&nz<height&&!blocked[next]&&!reached[next]){reached[next]=1;queue.push(next);}}}
  for(const d of destinations.filter(d=>d.zone===zone)){
   const x=d.x,z=d.room?(d.z>2?d.z-d.room.d/2+1.6:d.z<-2?d.z+d.room.d/2-1.6:d.z):d.z;
   assert(!blockedAt(x,z),`${zone}: travel spawn for ${d.id} intersects a solid`);
   assert(reached[index(x,z)],`${zone}: ${d.id} cannot be reached on foot from the corridor`);count++;
  }
  for(const p of [...world.spots,...npcs.filter(n=>n.zone===zone)]){
   let accessible=false;for(let dz=-2.5;dz<=2.5;dz+=.5)for(let dx=-2.5;dx<=2.5;dx+=.5){if(Math.hypot(dx,dz)>3)continue;const x=p.x+dx,z=p.z+dz;if(x>=minX&&x<=maxX&&z>=minZ&&z<=maxZ&&reached[index(x,z)])accessible=true;}
   assert(accessible,`${zone}: cannot approach ${p.id} closely enough to interact`);
   if(p.target)assert(destinations.some(d=>d.id===p.target),'door has a valid target');
  }
  world.group.traverse(obj=>{if(obj.geometry){const vertices=obj.geometry.getAttribute('position');for(let i=0;i<vertices.count;i++)assert(Number.isFinite(vertices.getX(i))&&Number.isFinite(vertices.getY(i))&&Number.isFinite(vertices.getZ(i)),'finite geometry');}});
  console.log(`${zone}: ${queue.length} walkable cells, ${world.spots.length} entrances/stairs; destinations and people reachable`);
 }
 // Validate conversation branches and ordinary movement guards.
 npcs.forEach(n=>{assert(n.greeting&&n.topics.length>=2);n.topics.forEach(t=>assert(t.question&&t.answer));});
 const guard={zone:'grounds',world:{solids:[{x:0,z:0,w:4,d:4}]}};
 assert(Game.prototype.blocked.call(guard,0,0));assert(Game.prototype.blocked.call(guard,101,0));assert(!Game.prototype.blocked.call(guard,4,4));
 const mount={appendChild(){},clientWidth:1280,clientHeight:800};let snapshot,talking;const game=new Game(mount,s=>snapshot=s,id=>talking=id,()=>{});
 game.loop(1000);const startZ=game.player.position.z;game.key('KeyW',true);for(let i=1;i<=60;i++)game.loop(1000+i*16.67);game.key('KeyW',false);assert(game.player.position.z<startZ-3,'walking moves the player');
 game.pause(true);const pausedZ=game.player.position.z;game.key('KeyW',true);game.loop(2100);assert.equal(game.player.position.z,pausedZ,'modal pauses movement');game.pause(false);
 game.jump();game.loop(2116);assert(game.player.position.y>0,'jump leaves the ground');for(let i=0;i<80;i++)game.loop(2133+i*16.67);assert.equal(game.player.position.y,0,'jump lands');
 for(const d of destinations){game.travel(d.id);game.loop(4000+count++*16.67);assert.equal(game.zone,d.zone);assert(Number.isFinite(game.camera.position.x),'camera stays finite after travel');}
 for(const npc of npcs){game.change(npc.zone,npc.x,npc.z+1.2);game.loop(6000+count++*16.67);assert.equal(game.nearby?.id,npc.id,`interaction target for ${npc.id}`);game.interact();assert.equal(talking,npc.id);assert(game.met.has(npc.id));}
 const before=game.zone;assert.throws(()=>game.travel('not-a-destination'));assert.equal(game.zone,before,'invalid travel preserves state');assert(snapshot);game.dispose();
 console.log(`PASS: ${destinations.length} travel destinations, ${npcs.length} NPC conversations, finite geometry, walking connectivity, movement, jump/landing, pause, travel, camera calculations and interaction state. Renderer stubbed; no visual QA.`);
})().catch(error=>{console.error(error.message);process.exitCode=1;});
