// Run after world.test.cjs. Verify the supplied plan's critical connections.
import assert from 'node:assert/strict';
const ctx=new Proxy({},{get:()=>()=>{},set:()=>true});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {interior}=await import('../.qa/game.mjs');
const {insideWest,westDestinations}=await import('../.qa/west-layout.mjs');
const west=interior('west'),ground=interior('ground');
const blocked=(x,z)=>!insideWest(x,z)||west.solids.some(s=>Math.abs(x-s.x)<s.w/2+.36&&Math.abs(z-s.z)<s.d/2+.36);
function route(points){for(let i=1;i<points.length;i++){const [ax,az]=points[i-1],[bx,bz]=points[i];for(let t=0;t<=1;t+=.01)assert(!blocked(ax+(bx-ax)*t,az+(bz-az)*t),`Blocked connection at ${ax+(bx-ax)*t},${az+(bz-az)*t}`);}}
route([[-6,-6],[17,-6],[17,-21],[25,-21],[36,-21],[36,-32],[49,-32],[49,-28],[56,-28],[56,-32],[81,-32],[81,-28],[89,-28],[93,-23]]);
route([[25,-21],[91,-21],[91,-23]]); // Parallel West Colonnade / Palm Room route.
route([[12,15.6],[16,15.6]]); // Study to Oval Office, through the west wall.
const toResidence=west.spots.find(s=>s.id==='residence-west'),toWest=ground.spots.find(s=>s.id==='to-west');
const palm=westDestinations.find(d=>d.id==='palm');
assert(toResidence.x>palm.x-palm.room.w/2&&toResidence.zone==='ground');
assert(toWest.spawn[0]>palm.x-palm.room.w/2&&toWest.zone==='west');
assert(!insideWest(70,10),'No shortcut across the empty southeast courtyard');
const room=id=>westDestinations.find(d=>d.id===id);
assert(room('chief').z>room('vp').z&&room('chief').x<room('roosevelt').x);
assert(room('cabinet').z<room('oval').z&&room('study').x<room('oval').x);
assert(room('press').x<room('press-corps').x&&room('press-corps').x<room('palm').x);
console.log('PASS: lobby through briefing room and press offices to Palm Room, parallel colonnade route, reciprocal residence transition, study/Oval doorway and plan orientation.');
