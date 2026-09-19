import * as T from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { material, detailedFlag, deskDetails, lamp } from './visuals';

// Coordinates are local to the office. South is +Z; every seat faces local -Z.
// Keep the floor, shell, openings and collision samples on the same ellipse.
export const OVAL = { rx: 8, rz: 8.6, height: 5.4, thickness: .24,
  door: [3.70, 4.16] as const, studyDoor: [2.96,3.32] as const, windows: [1.21, Math.PI / 2, Math.PI - 1.21], windowHalf: .112 };
export const OVAL_SEATS = [
  { name: 'West inward-facing sofa', x: -3.45, z: -1.45, rotation: -Math.PI / 2, kind: 'sofa' },
  { name: 'East inward-facing sofa', x: 3.45, z: -1.45, rotation: Math.PI / 2, kind: 'sofa' },
  { name: 'West fireplace armchair', x: -1.05, z: -5.4, rotation: Math.PI, kind: 'wing' },
  { name: 'East fireplace armchair', x: 1.05, z: -5.4, rotation: Math.PI, kind: 'wing' },
  { name: 'West desk guest chair', x: -.65, z: 1.55, rotation: Math.PI, kind: 'guest' },
  { name: 'East desk guest chair', x: .65, z: 1.55, rotation: Math.PI, kind: 'guest' },
  { name: 'President chair', x: 0, z: 5.25, rotation: 0, kind: 'president' },
] as const;
type Solid = { x: number; z: number; w: number; d: number };
const C = { wall: 0xf0ece1, white: 0xf5f0df, gold: 0xd9b458, darkGold: 0xa78340,
  cream: 0xe8dfc6, cushion: 0xf0e7d0, walnut: 0x69412d, mahogany: 0x815434 };
export function ovalDoor(a: number) { return [OVAL.door,OVAL.studyDoor].some(([start,end])=>a>start&&a<end); }
function windowAt(a: number) { return OVAL.windows.some(w => Math.abs(a - w) < OVAL.windowHalf); }
function surfaceMaterials() {
  const n = 128, cloth = new Uint8Array(n * n * 4), paper = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const i = (y * n + x) * 4, u = x / n * Math.PI * 4, v = y / n * Math.PI * 4;
    const weave = 241 + ((x % 3 === 0 || y % 3 === 0) ? -8 : 6);
    // Delicate repeating leaf motif. Low contrast keeps the wall ivory.
    const leaf = Math.pow(Math.max(0, Math.cos(u + .7 * Math.sin(v)) * Math.sin(v)), 6);
    for (let c = 0; c < 3; c++) { cloth[i + c] = weave; paper[i + c] = 252 - leaf * 15; }
    cloth[i + 3] = paper[i + 3] = 255;
  }
  const make = (data: Uint8Array, repeat: number) => { const tx = new T.DataTexture(data, n, n); tx.colorSpace = T.SRGBColorSpace; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.repeat.set(repeat, repeat); tx.magFilter = T.LinearFilter; tx.minFilter = T.LinearMipmapLinearFilter; tx.generateMipmaps = true; tx.needsUpdate = true; return tx; };
  const fabric = make(cloth, 3), wallpaper = make(paper, 1);
  for (const color of [C.cream, C.cushion, 0xe7d49d, 0xc7b185]) { const m = material(color); m.map = fabric; m.roughness = .94; }
  material(C.wall).map = wallpaper;
}
function mesh(g: T.Group, geo: T.BufferGeometry, color: number | T.Material, x = 0, y = 0, z = 0) {
  const m = new T.Mesh(geo, typeof color === 'number' ? material(color) : color);
  m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; g.add(m); return m;
}
function box(g: T.Group, x: number, y: number, z: number, w: number, h: number, d: number, color: number, round = 0) {
  return mesh(g, round ? new RoundedBoxGeometry(w, h, d, 2, Math.min(round, w / 3, h / 3, d / 3)) : new T.BoxGeometry(w, h, d), color, x, y, z);
}
function cyl(g: T.Group, x: number, y: number, z: number, r: number, h: number, color: number, top = r) {
  return mesh(g, new T.CylinderGeometry(top, r, h, 20), color, x, y, z);
}
function orb(g: T.Group, x: number, y: number, z: number, sx: number, sy: number, sz: number, color: number) {
  const m = mesh(g, new T.SphereGeometry(1, 12, 8), color, x, y, z); m.scale.set(sx, sy, sz); return m;
}
// Local -Z points into the room; local X lies on the ellipse tangent.
function anchor(g: T.Group, a: number, inset = .1) {
  const p = new T.Group(); p.position.set((OVAL.rx - inset) * Math.cos(a), 0, (OVAL.rz - inset) * Math.sin(a));
  p.rotation.y = Math.atan2(Math.cos(a) / OVAL.rx, Math.sin(a) / OVAL.rz); g.add(p); return p;
}
function arcBand(g: T.Group, a: number, b: number, y: number, h: number, inset: number, depth: number, color: number) {
  const shape = new T.Shape(), n = Math.max(2, Math.ceil((b - a) * 48));
  // Shape X/Y becomes room X/Z after rotation; extrusion spans exactly y..y+h.
  for (let i = 0; i <= n; i++) { const t = a + (b - a) * i / n, x = (OVAL.rx - inset) * Math.cos(t), z = (OVAL.rz - inset) * Math.sin(t); if (i) shape.lineTo(x, -z); else shape.moveTo(x, -z); }
  for (let i = n; i >= 0; i--) { const t = a + (b - a) * i / n; shape.lineTo((OVAL.rx - inset + depth) * Math.cos(t), -(OVAL.rz - inset + depth) * Math.sin(t)); }
  shape.closePath(); const m = mesh(g, new T.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: n }), color, 0, y, 0); m.rotation.x = -Math.PI / 2; m.userData.cameraBlocker = true; return m;
}
function frame(g: T.Group, x: number, y: number, z: number, w: number, h: number, gold = true) {
  for (const [border, depth, color] of [[.11, .12, gold ? C.darkGold : C.walnut], [.07, .17, gold ? C.gold : C.mahogany], [.025, .20, 0xf0d99d]]) {
    for (const side of [-1, 1]) { box(g, x + side * (w / 2 + border / 2), y, z - depth / 2, border, h + border * 2, depth, color); box(g, x, y + side * (h / 2 + border / 2), z - depth / 2, w, border, depth, color); }
  }
}
function portrait(g: T.Group, file: string, w: number, h: number, y: number) {
  frame(g, 0, y, -.035, w, h);
  const paint = new T.MeshStandardMaterial({ color: 0xffffff, roughness: .91 });
  // No network during scene geometry tests; production loads bundled public-domain art.
  if (typeof window !== 'undefined' && window.location) {
    const base = window.location.pathname.startsWith('/trumpgame') ? '/trumpgame/' : '/';
    paint.map = new T.TextureLoader().load(base + 'art/' + file + '.jpg'); paint.map.colorSpace = T.SRGBColorSpace; paint.map.anisotropy = 4;
  } else paint.color.setHex(0x424b42);
  const picture = mesh(g, new T.PlaneGeometry(w, h), paint, 0, y, -.06); picture.rotation.y = Math.PI;
  picture.name = 'Portrait: ' + file;
}
function floor(g: T.Group) {
  const shape = new T.Shape(); shape.absellipse(0, 0, OVAL.rx, OVAL.rz, 0, Math.PI * 2, false, 0);
  const geo = new T.ShapeGeometry(shape, 128), uv = geo.getAttribute('uv');
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) + OVAL.rx) / 2, (uv.getY(i) + OVAL.rz) / 2);
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512; const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#674833'; ctx.fillRect(0, 0, 512, 512);
  // Alternating quarter-turn parquet blocks with fine grain and recessed seams.
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
    ctx.save(); ctx.translate(col * 128 + 64, row * 128 + 64); ctx.rotate((row + col) % 2 * Math.PI / 2);
    for (let strip = 0; strip < 4; strip++) {
      ctx.fillStyle = ['#af865b', '#bf9569', '#9c744f', '#c7a177'][(strip + row + col) % 4]; ctx.fillRect(-63 + strip * 32, -63, 30, 126);
      for (let grain = 0; grain < 8; grain++) { ctx.strokeStyle = grain % 2 ? '#ffffff0b' : '#38211012'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(-62 + strip * 32 + grain * 4, -62); ctx.bezierCurveTo(-64 + strip * 32 + grain * 4, -20, -59 + strip * 32 + grain * 4, 20, -62 + strip * 32 + grain * 4, 63); ctx.stroke(); }
    } ctx.restore();
  }
  const tx = new T.CanvasTexture(canvas); tx.colorSpace = T.SRGBColorSpace; tx.wrapS = tx.wrapT = T.RepeatWrapping; tx.anisotropy = 8;
  const parquet = mesh(g, geo, new T.MeshStandardMaterial({ map: tx, roughness: .61 }), 0, .052, 0); parquet.rotation.x = -Math.PI / 2;
  // Cream oval rug and restrained rust/gold border, following the supplied photos.
  for (const [rx, rz, y, color] of [[4.95, 5.25, .072, 0xb58855], [4.86, 5.16, .079, 0xe7dbc1], [4.62, 4.91, .086, 0xc49567], [4.53, 4.82, .093, 0xeee3ca]]) {
    const r = cyl(g, 0, y, 0, rx, .012, color); r.geometry.dispose(); r.geometry = new T.CylinderGeometry(rx, rx, .012, 128); r.scale.set(1.24, 1, rz / rx * 1.24);
  }
  for (let i = 0; i < 64; i++) { const a = i * Math.PI / 32; const leaf = orb(g, Math.cos(a) * 4.74 * 1.24, .106, Math.sin(a) * 5.04 * 1.24, .12, .008, .045, 0xbfa371); leaf.rotation.y = -a; }
  const medallion = cyl(g, 0, .105, 0, 1.32, .01, 0xc39561); medallion.scale.z = 1.05; cyl(g, 0, .112, 0, 1.25, .01, 0xebd8b4);
}
function shell(g: T.Group, solids: Solid[]) {
  const cuts = [0, ...OVAL.door, ...OVAL.studyDoor, ...OVAL.windows.flatMap(a => [a - OVAL.windowHalf, a + OVAL.windowHalf]), Math.PI * 2].sort((a, b) => a - b);
  for (let i = 0; i < cuts.length - 1; i++) {
    const a = cuts[i], b = cuts[i + 1], mid = (a + b) / 2;
    if (ovalDoor(mid)) arcBand(g, a, b, 3.8, OVAL.height - 3.8, 0, OVAL.thickness, C.wall);
    else if (windowAt(mid)) { arcBand(g, a, b, 0, .35, 0, OVAL.thickness, C.wall); arcBand(g, a, b, 4.75, .65, 0, OVAL.thickness, C.wall); }
    else { arcBand(g, a, b, 0, OVAL.height, 0, OVAL.thickness, C.wall); arcBand(g, a, b, .12, 1.07, .042, .12, C.white); }
    if (!ovalDoor(mid)) for (const [y, h, inset, color] of [[.02, .16, .12, C.white], [1.18, .095, .09, C.white], [1.285, .018, .105, C.gold]]) arcBand(g, a, b, y, h, inset, .10, color);
  }
  for (const [y, h, inset, color] of [[4.88, .035, .06, C.gold], [4.96, .11, .12, C.white], [5.08, .045, .16, C.gold], [5.14, .14, .22, C.white], [5.29, .045, .26, C.gold], [5.34, .06, .3, C.white]]) arcBand(g, 0, Math.PI * 2, y, h, inset, .35, color);
  // Small collision tiles cover the continuous wall; windows remain solid at foot level.
  const n = 384; for (let i = 0; i < n; i++) { const a = (i + .5) / n * Math.PI * 2; if (!ovalDoor(a)) solids.push({ x: (OVAL.rx + .08) * Math.cos(a), z: (OVAL.rz + .08) * Math.sin(a), w: .28, d: .28 }); }
  // Wainscot panels follow the wall tangent, instead of cutting through the ellipse.
  for (let i = 0; i < 48; i++) { const a = (i + .5) / 48 * Math.PI * 2; if (ovalDoor(a) || windowAt(a) || Math.abs(a - .10) < .20 || a > 6.17 || Math.abs(a - 2.96) < .20 || Math.abs(a - Math.PI * 1.5) < .25) continue; const p = anchor(g, a, .20); frame(p, 0, .66, -.01, .56, .69, false); p.children.forEach(m => { if (m instanceof T.Mesh) m.material = material(C.white); }); }
  for (let i = 0; i < 100; i++) { const p = anchor(g, i / 100 * Math.PI * 2, .16); box(p, 0, 5.02, 0, .11, .09, .1, C.gold); }
  // Northwest lobby entry and the west study connection.
  for (const a of [...OVAL.door,...OVAL.studyDoor]) { const p = anchor(g, a, .08); box(p, 0, 1.9, 0, .13, 3.8, .33, C.white); box(p, 0, 1.9, -.19, .035, 3.8, .035, C.gold); }
  for(const [start,end] of [OVAL.door,OVAL.studyDoor])arcBand(g,start,end,3.79,.1,.1,.16,C.white);
}
function windows(g: T.Group) {
  for (const a of OVAL.windows) {
    const p = anchor(g, a, -.025), width = 1.79;
    const glass = mesh(p, new T.PlaneGeometry(width, 4.4), new T.MeshStandardMaterial({ color: 0x9db8b9, emissive: 0x9bb4aa, emissiveIntensity: .22, roughness: .2 }), 0, 2.53, -.03); glass.rotation.y = Math.PI; glass.userData.cameraBlocker = true;
    for (const side of [-1, 1]) box(p, side * width / 2, 2.53, -.10, .105, 4.5, .12, C.white);
    for (let row = 0; row <= 5; row++) box(p, 0, .33 + row * .88, -.12, width, .055, .13, C.white);
    box(p, 0, 2.53, -.12, .065, 4.4, .13, C.white); box(p, 0, .32, -.13, width + .22, .13, .4, C.white);
    // Long pleated curtains, with actual scalloped fabric rather than rigid poles.
    for (const side of [-1, 1]) {
      const geo = new T.PlaneGeometry(.55, 4.42, 18, 8), pos = geo.getAttribute('position');
      for (let i = 0; i < pos.count; i++) pos.setZ(i, Math.cos((pos.getX(i) + .275) * Math.PI * 18) * .065); geo.computeVertexNormals();
      const curtain = mesh(p, geo, new T.MeshStandardMaterial({ color: 0xd9b768, side: T.DoubleSide, roughness: .95 }), side * 1.02, 2.52, -.28); curtain.name = 'Pleated gold drape'; curtain.userData.cameraBlocker = true;
      box(p, side * 1.02, .35, -.30, .58, .035, .13, 0x7c7c63);
    }
    const swag = new T.PlaneGeometry(2.4, .65, 36, 8), pos = swag.getAttribute('position');
    for (let i = 0; i < pos.count; i++) { const u = (pos.getX(i) + 1.2) / 2.4, v = (pos.getY(i) + .325) / .65; pos.setY(i, -.65 * Math.sin(u * Math.PI) * (1 - v)); pos.setZ(i, -.09 * Math.sin(u * Math.PI) + .035 * Math.cos(u * 45)); } swag.computeVertexNormals();
    mesh(p, swag, new T.MeshStandardMaterial({ color: 0xe5c47c, side: T.DoubleSide, roughness: .9 }), 0, 4.95, -.36);
    const curve = new T.CatmullRomCurve3(Array.from({ length: 33 }, (_, i) => new T.Vector3(-1.2 + i * 2.4 / 32, 4.95 - .65 * Math.sin(i / 32 * Math.PI), -.40)));
    mesh(p, new T.TubeGeometry(curve, 40, .032, 5, false), C.gold);
  }
}
function seating(g: T.Group, solids: Solid[]) {
  for (const seat of OVAL_SEATS) {
    const s = new T.Group(); s.name = seat.name; s.position.set(seat.x, 0, seat.z); s.rotation.y = seat.rotation; g.add(s);
    if (seat.kind === 'sofa') {
      box(s, 0, .43, 0, 3.1, .52, 1.12, C.cream, .13); box(s, 0, 1.0, .45, 2.94, 1.10, .38, C.cream, .13);
      for (const side of [-1, 1]) { box(s, side * 1.44, .69, -.02, .34, .7, 1.2, C.cream, .14); const arm = cyl(s, side * 1.43, 1.03, -.04, .20, 1.05, C.cushion); arm.rotation.x = Math.PI / 2; }
      for (const x of [-.94, 0, .94]) { box(s, x, .77, -.13, .90, .21, .93, C.cushion, .09); const cushion = box(s, x, 1.19, .21, .91, .68, .26, C.cushion, .08); cushion.rotation.x = -.13; }
      for (const side of [-1, 1]) { const pillow = box(s, side * 1.05, 1.00, -.15, .5, .51, .19, 0xd5c7a7, .10); pillow.rotation.set(-.24, side * .3, side * .22); }
      for (const x of [-1.25, 1.25]) for (const z of [-.38, .4]) cyl(s, x, .16, z, .06, .27, C.walnut);
      solids.push({ x: seat.x, z: seat.z, w: 1.22, d: 3.2 });
    } else {
      const wing = seat.kind === 'wing', president = seat.kind === 'president', leather = president ? 0x553d32 : wing ? 0xe7d49d : 0xc7b185;
      box(s, 0, .64, 0, .94, .19, .92, C.walnut, .035); box(s, 0, .77, -.03, .84, .17, .83, leather, .07);
      box(s, 0, 1.32, .40, 1.00, 1.13, .20, C.walnut, .065); box(s, 0, 1.33, .265, .88, 1.02, .16, leather, .065);
      for (const side of [-1, 1]) { box(s, side * .5, 1.0, -.04, .115, .12, .9, wing ? leather : C.walnut, .04); cyl(s, side * .48, .83, -.34, .037, .36, C.walnut); if (wing) box(s, side * .46, 1.37, .25, .16, 1.08, .35, leather, .065); }
      for (const x of [-.38, .38]) for (const z of [-.31, .32]) { const leg = cyl(s, x, .31, z, .04, .60, C.walnut, .05); leg.rotation.x = z * .15; }
      if (president) for (const x of [-.28, 0, .28]) for (const y of [1.03, 1.33, 1.63]) orb(s, x, y, .172, .025, .025, .012, 0x2c211c);
      solids.push({ x: seat.x, z: seat.z, w: 1.04, d: 1.01 });
    }
  }
}
function coffeeTable(g: T.Group, solids: Solid[]) {
  box(g, 0, .63, -.75, 1.55, .12, 2.15, C.mahogany, .035); box(g, 0, .55, -.75, 1.36, .16, 1.95, C.walnut);
  for (const x of [-.57, .57]) for (const z of [-1.58, .08]) cyl(g, x, .29, z, .055, .54, C.walnut, .075);
  solids.push({ x: 0, z: -.75, w: 1.55, d: 2.15 });
  const vase = cyl(g, 0, .85, -.75, .24, .30, C.white, .3);
  for (let i = 0; i < 19; i++) { const a = i * 2.399, r = .34 * Math.sqrt(i / 19), x = Math.cos(a) * r, z = -.75 + Math.sin(a) * r; orb(g, x, 1.03 + .10 * (1 - r), z, .14, .10, .13, i % 3 ? 0xf1ecdc : 0x6687ba); }
  vase.name = 'Flower arrangement';
}
function resoluteDesk(g: T.Group, solids: Solid[]) {
  const z = 3.25;
  box(g, 0, 1.17, z, 4.55, .19, 1.67, C.walnut, .03); box(g, 0, 1.28, z, 4.65, .09, 1.75, C.mahogany, .025);
  for (const side of [-1, 1]) { box(g, side * 1.66, .62, z, 1.0, 1.08, 1.48, C.walnut); for (const dx of [-.39, .39]) { cyl(g, side * 1.66 + dx, .64, z - .79, .065, .90, C.mahogany); for (const y of [.20, 1.07]) box(g, side * 1.66 + dx, y, z - .80, .17, .09, .15, C.mahogany); } }
  deskDetails(g, 0, z, 4.75, 1.67, true); solids.push({ x: 0, z, w: 4.65, d: 1.75 });
}
function fireplace(g: T.Group, solids: Solid[]) {
  const p = anchor(g, Math.PI * 1.5, .18); p.name = 'North centered fireplace';
  box(p, 0, .77, -.14, 2.7, 1.54, .52, C.white); box(p, 0, .70, -.415, 1.64, 1.18, .035, 0x27241e);
  for (const side of [-1, 1]) { box(p, side * 1.01, .75, -.44, .22, 1.37, .22, 0xe6d6b1); for (const dx of [-.065, .065]) cyl(p, side * 1.01 + dx, .76, -.575, .017, 1.12, C.gold); }
  box(p, 0, 1.43, -.47, 2.62, .16, .25, 0xe5d0a1); box(p, 0, 1.56, -.22, 2.98, .13, .85, C.white); box(p, 0, 1.64, -.24, 2.97, .035, .87, C.gold);
  for (const side of [-1, 1]) { cyl(p, side * .50, .15, -.49, .06, .27, C.gold); orb(p, side * .5, .35, -.49, .12, .12, .09, C.gold); }
  for (let i = 0; i < 5; i++) { cyl(p, -.93 + i * .46, 1.78, -.25, .055, .27, C.gold); cyl(p, -.93 + i * .46, 1.94, -.25, .13, .14, C.gold, .17); }
  portrait(p, 'washington', 1.38, 2.22, 3.04); solids.push({ x: 0, z: -OVAL.rz + .5, w: 3.0, d: .8 });
  for (const side of [-1, 1]) { const table = new T.Group(); table.position.set(side * 2.4, 0, -6.5); g.add(table); box(table, 0, .97, 0, 1.03, .12, .82, C.mahogany); for (const x of [-.4, .4]) for (const z of [-.3, .3]) cyl(table, x, .47, z, .04, .91, C.walnut); lamp(table, 0, 1.04, 0); solids.push({ x: side * 2.4, z: -6.5, w: 1.03, d: .82 }); }
}
function wallDecor(g: T.Group) {
  portrait(anchor(g, 4.39, .17), 'franklin', .93, 1.14, 3.14);
  portrait(anchor(g, 5.05, .17), 'jefferson', .89, 1.18, 3.12);
  portrait(anchor(g, 3.32, .17), 'adams', 1.09, 1.34, 3.22);
  portrait(anchor(g, 2.52, .17), 'lincoln', 1.0, 1.34, 3.08);
  portrait(anchor(g, .62, .17), 'jackson', 1.0, 1.34, 3.08);
  // Recessed panel doors stay within the tangent wall, with visible hardware.
  for (const a of [.10, 2.96]) { const p = anchor(g, a, .08); box(p, 0, 1.67, -.005, 1.42, 3.31, .09, C.white); frame(p, 0, 1.69, -.055, 1.50, 3.40, false); for (const y of [.68, 1.73, 2.76]) frame(p, 0, y, -.07, 1.06, .70, false); p.traverse(o => { if (o instanceof T.Mesh) o.material = material(C.white); }); orb(p, .56, 1.47, -.20, .06, .06, .065, C.gold); }
  const clock = anchor(g, 5.78, .52); clock.name = 'Grandfather clock'; box(clock, 0, 1.53, 0, .80, 3.06, .42, C.walnut, .025); box(clock, 0, 1.38, -.23, .55, 1.76, .035, 0x302d24); box(clock, 0, .15, -.01, .94, .30, .55, C.mahogany); box(clock, 0, 3.03, -.01, 1.01, .16, .59, C.mahogany);
  const face = cyl(clock, 0, 2.54, -.26, .32, .04, 0xf0dfb2); face.rotation.x = Math.PI / 2; for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; box(clock, Math.sin(a) * .26, 2.54 + Math.cos(a) * .26, -.29, .025, .04, .015, 0x40382b); } box(clock, 0, 2.63, -.30, .026, .19, .01, 0x302d24); const hand = box(clock, .06, 2.54, -.305, .14, .025, .01, 0x302d24); hand.rotation.z = -.45; cyl(clock, 0, 1.36, -.26, .018, 1.16, C.gold); const pendulum = cyl(clock, 0, .82, -.27, .14, .035, C.gold); pendulum.rotation.x = Math.PI / 2;
}
export function buildOvalOffice(parent: T.Group, cx: number, cz: number): Solid[] {
  if (!material(C.wall).map) surfaceMaterials();
  const g = new T.Group(); g.name = 'Oval Office — continuous shell'; g.position.set(cx, 0, cz); parent.add(g);
  const solids: Solid[] = []; floor(g); shell(g, solids); windows(g); fireplace(g, solids); seating(g, solids); coffeeTable(g, solids); resoluteDesk(g, solids); wallDecor(g);
  solids.push({ x: (OVAL.rx - .52) * Math.cos(5.78), z: (OVAL.rz - .52) * Math.sin(5.78), w: .88, d: .88 });
  for (const side of [-1, 1]) { const flag = new T.Group(); flag.position.set(side * 4.65, 0, 6.1); flag.rotation.y = side < 0 ? -.35 : Math.PI + .35; g.add(flag); detailedFlag(flag, 0, 0, 0, .70, side > 0); solids.push({ x: side * 4.65, z: 6.1, w: .42, d: .42 }); }
  return solids.map(s => ({ ...s, x: cx + s.x, z: cz + s.z }));
}
