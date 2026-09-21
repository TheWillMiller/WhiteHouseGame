import * as T from 'three';
import type { Destination } from './world-data';
import { material } from './visuals';

const surfaces = new Map<string, T.MeshStandardMaterial>();
/** A repeating 4.8 x 4.8 world-unit sample, never stretched to a room's size. */
function finish(kind: 'oak' | 'stone' | 'carpet' | 'hall-carpet') {
  if (surfaces.has(kind)) return surfaces.get(kind)!;
  const n = 512, data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const row = Math.floor(y / 32), end = (x + (row % 2) * 128) % 256;
    const hash = (Math.imul(x + y * n, 1664525) >>> 0) / 4294967296;
    const variation = Math.sin(row * 13.1 + Math.floor((x + row % 2 * 128) / 256) * 4.2);
    const joint = kind === 'oak' ? (y % 32 === 0 || end === 0) : kind === 'stone' ? (x % 128 === 0 || y % 128 === 0) : false;
    const grain = Math.sin(y * 1.9 + Math.sin(x * .021) * 1.7) * 1.5;
    const base = kind === 'oak' ? [158, 119, 79] : kind === 'stone' ? [205, 203, 190] : kind==='hall-carpet' ? [151,140,117] : [86, 101, 102];
    const diamond=kind==='hall-carpet'&&((x+y)%32<2||(x-y+512)%32<2)?-11:0;
    for (let c = 0; c < 3; c++) data[(y * n + x) * 4 + c] = base[c] + diamond + (joint ? -13 : variation * 5 + grain + hash * 3);
    data[(y * n + x) * 4 + 3] = 255;
  }
  const texture = new T.DataTexture(data, n, n); texture.colorSpace = T.SRGBColorSpace;
  texture.wrapS = texture.wrapT = T.RepeatWrapping; texture.generateMipmaps = true;
  texture.minFilter = T.LinearMipmapLinearFilter; texture.magFilter = T.LinearFilter; texture.anisotropy = 4; texture.needsUpdate = true;
  const mat = new T.MeshStandardMaterial({ map: texture, roughness: kind === 'oak' ? .66 : .9 });
  surfaces.set(kind, mat); return mat;
}
export function clearRoomFinishes() { surfaces.forEach(m => { m.map?.dispose(); m.dispose(); }); surfaces.clear(); }
export function circulationFloor(g:T.Group,x:number,z:number,w:number,d:number){const geo=new T.PlaneGeometry(w,d);geo.rotateX(-Math.PI/2);const uv=geo.getAttribute('uv'),pos=geo.getAttribute('position');for(let i=0;i<uv.count;i++)uv.setXY(i,(pos.getX(i)+x)/4.8,(pos.getZ(i)+z)/4.8);const floor=new T.Mesh(geo,finish('hall-carpet'));floor.position.set(x,.029,z);floor.receiveShadow=true;floor.name='Continuous corridor carpet';g.add(floor);}
export function floorFinish(g: T.Group, d: Destination) {
  const r = d.room!, kind = ['west-lobby','press-hall','reception','president-secretary'].includes(d.id)?'hall-carpet':['press','press-offices'].includes(r.style) ? 'carpet' : ['corridor','palm','hall','kitchen','flowers'].includes(r.style) ? 'stone' : 'oak';
  const geo = new T.PlaneGeometry(r.w, r.d); geo.rotateX(-Math.PI / 2);
  const uv = geo.getAttribute('uv'), pos = geo.getAttribute('position');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (pos.getX(i) + d.x) / 4.8, (pos.getZ(i) + d.z) / 4.8);
  const floor = new T.Mesh(geo, finish(kind)); floor.position.set(d.x, .055, d.z); floor.receiveShadow = true; floor.name = `${d.id}: continuous floor`; g.add(floor);
}
export function ceiling(g: T.Group, x: number, z: number, w: number, d: number, oval?: {x:number;z:number;rx:number;rz:number}) {
  const shape = new T.Shape(); shape.moveTo(-w/2,-d/2); shape.lineTo(w/2,-d/2); shape.lineTo(w/2,d/2); shape.lineTo(-w/2,d/2); shape.closePath();
  if(oval){const hole=new T.Path();hole.absellipse(oval.x-x,oval.z-z,oval.rx,oval.rz,0,Math.PI*2,true,0);shape.holes.push(hole);}
  const geo = new T.ShapeGeometry(shape,64); geo.rotateX(Math.PI / 2);
  const mesh = new T.Mesh(geo, material(0xeeeae0)); mesh.position.set(x, 4.62, z);
  mesh.name = 'Ceiling'; mesh.userData.dynamic = true; mesh.castShadow = false; g.add(mesh);
  if(oval){const dome=new T.Shape();dome.absellipse(0,0,oval.rx,oval.rz,0,Math.PI*2,false,0);const top=new T.Mesh(new T.ShapeGeometry(dome,64),material(0xeeeae0));top.rotation.x=Math.PI/2;top.position.set(oval.x,5.42,oval.z);top.userData.dynamic=true;top.name='Oval Office ceiling';g.add(top);}
}
/** Surface details live on the inside face of each room, clear of openings. */
export function wallPanels(g: T.Group, x: number, z: number, length: number, vertical: boolean, inward: number, color: number) {
  const add = (a: number, y: number, offset: number, w: number, h: number, depth: number, c: number) => {
    const mesh = new T.Mesh(new T.BoxGeometry(vertical ? depth : w, h, vertical ? w : depth), material(c));
    mesh.position.set(x + (vertical ? inward * offset : a), y, z + (vertical ? a : inward * offset)); g.add(mesh); return mesh;
  };
  add(0, 2.3, .12, length, 4.6, .018, color);
  add(0, .66, .15, length, 1.2, .025, 0xeeeae0);
  add(0, .14, .19, length, .18, .07, 0xe0dccb);
  add(0, 1.29, .19, length, .065, .07, 0xe0dccb);
  add(0, 4.44, .21, length, .16, .12, 0xf5f0df);
  add(0, 4.56, .27, length, .08, .20, 0xf5f0df);
  const count = Math.floor(length / 1.8), panelWidth = length / Math.max(1, count) - .35;
  for (let i = 0; i < count; i++) {
    const a = -length / 2 + (i + .5) * length / count;
    for (const y of [.34, 1.07]) add(a, y, .174, panelWidth, .025, .022, 0xd7d2c4);
    for (const side of [-1, 1]) add(a + side * panelWidth / 2, .705, .174, .025, .73, .022, 0xd7d2c4);
  }
}
