import type {Destination} from './world-data';

// Room relationships traced from the user's West Wing first-floor reference.
// North is -Z. Door widths and the Oval Office retain gameplay clearance.
export const WEST_BOUNDS={minX:-27,maxX:96,minZ:-40,maxZ:25};
export const WEST_FOOTPRINT=[{x:2,z:1.5,w:58,d:47},{x:57,z:-28.5,w:78,d:23}];
export function insideWest(x:number,z:number){return WEST_FOOTPRINT.some(r=>Math.abs(x-r.x)<=r.w/2-.36&&Math.abs(z-r.z)<=r.d/2-.36);}
const room=(id:string,name:string,left:number,north:number,right:number,south:number,style:string,doors:NonNullable<Destination['room']>['doors'],spawn:[number,number],description:string):Destination=>({id,name,short:name.match(/· (\d+)$/)?.[1]??({'west-lobby':'Lobby','press-hall':'Entrance','vp':'Vice President','chief':'Chief of Staff','private-dining':'Dining','study':'Study','roosevelt':'Roosevelt','cabinet':'Cabinet','press-secretary':'Press Secretary','press':'Briefing room','press-corps':'Press offices','colonnade':'West Colonnade','palm':'Palm Room','reception':'Reception'} as Record<string,string>)[id],zone:'west',x:(left+right)/2,z:(north+south)/2,spawn,description,room:{w:right-left,d:south-north,color:style==='press'?0x8cacc0:style==='corridor'?0xe7e0c8:0xc9c1ad,style,doors}});
export const westDestinations:Destination[]=[
 room('west-lobby','West Wing Lobby',-12.5,-11,0,0,'corridor',{north:[-6],south:[-9,-3],west:[-6],east:[-6]},[-6,-6],'The lobby beneath the north entrance'),
 room('press-hall','West Wing north entrance',-8,-22,-3,-11,'corridor',{north:[-5.5],south:[-5.5]},[-5.5,-18],'The north entrance leads down into the lobby'),
 room('vp','Vice President’s office',-26,-7.5,-18,8.5,'office',{east:[0]},[-20,0],'On the west side, north of the Chief of Staff'),
 room('chief','Chief of Staff',-26,10,-18,22,'office',{east:[14]},[-20,14],'The southwest corner office, beside reception'),
 room('reception','Reception area',-18,12,-10.5,22,'corridor',{north:[-14],west:[14]},[-14,14],'Reception beside the Chief of Staff'),
 room('senior-nine','Senior adviser · 9',-10.5,12,-5,22,'small-office',{north:[-7.75]},[-7.75,14],'South-side office shown as 9 on the reference'),
 room('senior-ten','Senior adviser · 10',-5,12,1.5,22,'small-office',{north:[-1.75]},[-1.75,14],'South-side office shown as 10 on the reference'),
 room('private-dining','President’s Dining Room',1.5,12,8.7,22,'dining',{north:[5],east:[16]},[5,14],'The dining room west of the study'),
 room('study','President’s Study',8.7,12,14,22,'small-office',{north:[11.3],west:[16],east:[15.6]},[11.3,14],'Connects the dining room to the Oval Office'),
 {id:'oval',name:'Oval Office',zone:'west',x:22,z:15.6,spawn:[17,10.8],description:'Southeast corner, beside the study and President’s Secretary',room:{w:16,d:17.2,color:0xf0ece1,style:'oval',doors:{}}},
 room('roosevelt','Roosevelt Room',0,-2.5,14,8.5,'meeting',{north:[7],south:[7],east:[4]},[7,-.5],'Between the lobby and the Oval Office approach'),
 room('cabinet','Cabinet Room',20,-17,30.5,1.5,'meeting',{north:[25],west:[-8],south:[25]},[22,-8],'North of the Oval Office, opening toward the colonnade'),
 room('president-secretary','President’s Secretary · 7',20,2,30.5,6.5,'corridor',{north:[25],west:[4.25]},[23,4],'The secretary’s area above the Oval Office'),
 room('press-secretary','Press Secretary',6,-22,16,-12,'office',{south:[11]},[8,-14],'Northeast corner of the main office block'),
 room('nsa','National Security Adviser · 1',-26,-22,-18,-10,'small-office',{east:[-14]},[-20,-14],'Northwest corner office'),
 room('deputy-nsa','Deputy National Security Adviser · 2',-16,-22,-9,-14,'small-office',{south:[-12.5]},[-12.5,-19],'Beside the north entrance'),
 room('deputy-comms','Deputy Communications Director · 3',-2,-22,2,-12,'small-office',{south:[0]},[0,-19],'East of the north entrance'),
 room('comms','Communications Director · 4',2,-22,6,-12,'small-office',{south:[4]},[4,-19],'Beside the Press Secretary'),
 room('deputy-chief-five','Deputy Chief of Staff · 5',-12.5,0,-6,8.5,'small-office',{north:[-9]},[-9,2],'South of the lobby'),
 room('deputy-chief-six','Deputy Chief of Staff · 6',-6,0,0,8.5,'small-office',{north:[-3]},[-3,2],'Between the lobby and Roosevelt Room'),
 room('press-staff-eleven','Press staff · 11',18,-39,22.5,-33,'small-office',{south:[20.25]},[20.25,-37],'Press staff beside the briefing room'),
 room('press-staff-twelve','Press staff · 12',22.5,-39,27,-33,'small-office',{south:[24.75]},[24.75,-37],'Press staff beside the briefing room'),
 room('press-staff-thirteen','Press staff · 13',27,-39,31.5,-33,'small-office',{south:[29.25]},[29.25,-37],'Press staff beside the briefing room'),
 room('press','Press Briefing Room',32,-39,54,-25,'press',{west:[-28],east:[-28],south:[36,48]},[36,-27],'Part of the connection between the West Wing and residence'),
 room('press-corps','Press Corps Offices',54,-39,84,-25,'press-offices',{west:[-28],east:[-28],south:[64,78]},[64,-27],'Press workspaces continuing east toward the Palm Room'),
 room('colonnade','West Colonnade',18,-25,84,-17,'corridor',{north:[25,36,48,64,78],south:[25,44],west:[-21],east:[-21]},[40,-21],'The continuous passage beside the press rooms and Rose Garden'),
 room('palm','Palm Room',84,-39,96,-17,'palm',{west:[-28,-21],east:[-23]},[89,-23],'The eastern end of the connection, at the residence'),
];
