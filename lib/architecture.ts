import * as T from 'three';
import {material} from './visuals';

// Shared exterior dimensions: north is -Z. The portico is an open colonnade
// around a smaller curved wall, rather than a solid cylinder hiding the columns.
export function residenceExterior(g:T.Group){
  const white=0xf5f0df,trim=0xe0dccb,glass=0x384e58;
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,c=white)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),material(c));m.position.set(x,y,z);g.add(m);return m;};
  const column=(x:number,y:number,z:number,r:number,h:number)=>{const m=new T.Mesh(new T.CylinderGeometry(r*.88,r,h,24),material(white));m.position.set(x,y,z);g.add(m);return m;};
  const ellipse=(y:number,rx:number,rz:number,h:number,c=white)=>{const m=new T.Mesh(new T.CylinderGeometry(rx,rx,h,80),material(c));m.scale.z=rz/rx;m.position.set(0,y,-8.1);g.add(m);return m;};
  box(0,7.6,-23,50,15.2,30);
  for(const y of [.65,4.2,10.0,14.6,15.1])box(0,y,-23,50.4,y===4.2?.3:.18,30.4,trim);
  // Two principal stories over the rusticated ground floor.
  function window(x:number,y:number,z:number,h:number,face:number){
    box(x,y,z,1.62,h,.12,glass);
    for(const side of [-1,1])box(x+side*.9,y,z+face*.10,.16,h+.3,.25,trim);
    box(x,y+h/2+.17,z+face*.15,2.08,.18,.36);box(x,y-h/2-.1,z+face*.19,2.15,.17,.46);
    for(const dx of [-.27,.27])box(x+dx,y,z+face*.13,.055,h,.13);
    for(const dy of [-h/6,h/6])box(x,y+dy,z+face*.13,1.62,.055,.13);
    if(y>5){box(x,y+h/2+.38,z+face*.12,2.3,.12,.35);}
  }
  for(let i=-5;i<=5;i++)for(const face of [-1,1]){
    const x=i*4.2,z=-23+face*15.03;
    if(face<0||Math.abs(x)>6.5){window(x,2.35,z,2.35,face);window(x,7.0,z,3.25,face);window(x,11.95,z,3.2,face);}
  }
  for(const x of [-25.05,25.05])for(let z=-34;z<=-12;z+=5.5)for(const y of [2.35,7,11.95]){box(x,y,z,.12,2.9,1.65,glass);box(x,y,z,.2,2.9,.06);for(const dy of [-.48,.48])box(x,y+dy,z,.2,.06,1.65);}
  // Fluted pilasters and restrained limestone coursing.
  for(const x of [-24,-20,-16,-12,12,16,20,24]){box(x,9.4,-7.75,.40,9.5,.36);box(x,14.12,-7.75,.8,.25,.55);box(x,4.75,-7.75,.7,.25,.55);}
  for(let y=.35;y<4;y+=.47){box(0,y,-7.92,50,.027,.1,0xc7c9c1);box(0,y,-38.08,50,.027,.1,0xc7c9c1);}
  // Smaller curved rear wall leaves a visible gallery behind the six columns.
  ellipse(7.3,6.45,5.35,14.6);
  for(const y of [4.3,14.8])ellipse(y,10.1,8.65,.44,trim);
  for(let i=0;i<6;i++){
    const a=(i+.5)*Math.PI/6,x=Math.cos(a)*9.2,z=-8.1+Math.sin(a)*7.75;
    column(x,9.55,z,.51,10.05);column(x,4.48,z,.74,.32);column(x,14.62,z,.76,.34);
    column(x,2.0,z,.55,4.0);column(x,.18,z,.75,.36);
    for(let k=0;k<12;k++){const b=k*Math.PI/6;column(x+Math.cos(b)*.44,9.5,z+Math.sin(b)*.44,.035,9.6);}
  }
  for(const side of [-1,1])for(let step=0;step<18;step++){
    const t=step/17,a=.10+t*.72,y=4.12*(1-t),stair=box(side*Math.cos(a)*11.6,y/2,-8.1+Math.sin(a)*10.1,3.0,Math.max(.12,y),.78,trim);stair.rotation.y=-side*a;
  }
  box(0,1.65,-2.67,1.9,3.3,.23,0x25373a);
  for(let i=0;i<5;i++){
    const a=(i+1)*Math.PI/6,x=Math.cos(a)*6.5,z=-8.1+Math.sin(a)*5.4;
    for(const y of [2,7.15,11.95]){const group=new T.Group(),pane=new T.Mesh(new T.BoxGeometry(1.6,3.0,.16),material(glass));group.add(pane);for(const dx of [-.9,0,.9]){const m=new T.Mesh(new T.BoxGeometry(.09,3.2,.24),material(white));m.position.x=dx;group.add(m);}for(const dy of [-1.6,0,1.6]){const m=new T.Mesh(new T.BoxGeometry(1.9,.09,.24),material(white));m.position.y=dy;group.add(m);}group.position.set(x,y,z);group.rotation.y=Math.PI/2-a;g.add(group);}
  }
  // Truman Balcony, roof parapet and balusters follow the curved projection.
  ellipse(9.28,7.9,6.75,.28,trim);
  for(const y of [9.95,15.6])for(let i=0;i<=36;i++){const a=i*Math.PI/36,rx=y<12?7.8:9.8,rz=y<12?6.65:8.35;column(Math.cos(a)*rx,y,-8.1+Math.sin(a)*rz,.065,.95);}
  for(const y of [10.45,16.1]){const path=new T.EllipseCurve(0,0,y<12?7.9:9.95,y<12?6.75:8.5,0,Math.PI,false,0).getPoints(64).map(p=>new T.Vector3(p.x,y,p.y-8.1));g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(path),64,.11,6,false),material(white)));}
  // North portico: four columns and a proper triangular pediment.
  box(0,4,-41,19,.42,7,trim);box(0,14.8,-41,20,.55,7.8,trim);
  for(const x of [-8,-3,3,8]){column(x,9.5,-43.8,.56,10.3);column(x,4.3,-43.8,.78,.3);column(x,14.55,-43.8,.8,.3);}
  const tri=new T.Shape();tri.moveTo(-10,0);tri.lineTo(10,0);tri.lineTo(0,3.1);tri.closePath();
  const pediment=new T.Mesh(new T.ExtrudeGeometry(tri,{depth:.6,bevelEnabled:false}),material(white));pediment.position.set(0,15.1,-45);g.add(pediment);
  box(0,2,-38.3,3.1,4,.2,0x24363c);
  // Recessed attic, roof terraces, complete parapet, chimneys.
  box(0,15.48,-23,51.2,.6,31.2,trim);box(0,16.4,-24,36,1.5,19,0xe5e4dc);box(0,17.18,-24,37,.25,20,0xb0b5b0);
  for(let x=-24;x<=24;x+=1.1)for(const z of [-38.1,-7.9])column(x,16.4,z,.07,1.1);
  for(let z=-37;z<=-9;z+=1.1)for(const x of [-24.8,24.8])column(x,16.4,z,.07,1.1);
  for(const z of [-38.1,-7.9])box(0,17,z,50.4,.22,.48);for(const x of [-24.8,24.8])box(x,17,-23,.48,.22,30.6);
  for(const x of [-17,-9,9,17])for(const z of [-30,-16]){box(x,17.5,z,.85,2.0,1.1);box(x,18.55,z,1.25,.22,1.45,trim);}
  for(let x=-16;x<=16;x+=4)box(x,16.42,-14.44,1.9,.68,.14,glass);
  g.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});
}
