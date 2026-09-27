export type Agency = 'rescue' | 'power' | 'logistics';
export const AGENCIES: Record<Agency, {name:string; short:string; color:string}> = {
  rescue:{name:'Rescue teams',short:'Rescue',color:'#84dcd0'},
  power:{name:'Grid engineers',short:'Power',color:'#ebca7d'},
  logistics:{name:'Relief crews',short:'Relief',color:'#a6baff'},
};
export type ScenarioId = 'storm' | 'blackout' | 'cascade';
type IncidentPlan={id:string;title:string;region:string;brief:string;at:number;rate:number;needs:Partial<Record<Agency,number>>;x:number;y:number};
export type Scenario={id:ScenarioId;title:string;difficulty:string;brief:string;duration:number;plans:IncidentPlan[]};
const incident=(id:string,title:string,region:string,at:number,needs:IncidentPlan['needs'],x:number,y:number,brief:string,rate=.8):IncidentPlan=>({id,title,region,at,needs,x,y,brief,rate});
export const SCENARIOS:Scenario[]=[
 {id:'storm',title:'Storm Watch',difficulty:'First command',brief:'A coastal storm is approaching. Restore power, move supplies, and get stranded residents to safety.',duration:150,plans:[
  incident('harbor','Harbor evacuation','Atlantic coast',0,{rescue:18,logistics:12},78,62,'Ferries are grounded. Rescue teams need relief crews to prepare a reception center.',.62),
  incident('hospital','Hospital on backup','Coastal city',9,{power:24},69,37,'Backup generators are running low. Restore the local grid before reserve power runs out.',.8),
  incident('shelters','Shelter supplies','Inland county',24,{logistics:22},45,46,'Shelters need food, blankets, and water. Send relief crews.',.65),
  incident('bridge','Flooded bridge','River valley',38,{rescue:24},53,72,'Cars are trapped above rising water. The bridge is closed to traffic.',.95),
  incident('substation','Substation failure','Northern district',53,{power:24,logistics:12},42,23,'Engineers need replacement equipment delivered to the flooded substation.',.75),
  incident('island','Island cut off','Outer coast',68,{rescue:20,logistics:16},85,28,'A small community has lost its connection to the mainland.',.85),
 ]},
 {id:'blackout',title:'Lights Out',difficulty:'Under pressure',brief:'A cascading outage has hit the region. Keep hospitals online and restore essential services.',duration:150,plans:[
  incident('grid','Regional grid down','Metro district',0,{power:30},48,35,'The grid needs a controlled restart. Assign engineers before services begin failing.',1),
  incident('rail','Trains stranded','Transit corridor',4,{rescue:22,logistics:14},66,52,'Passengers need assistance and replacement transport.',.9),
  incident('water','Water pumps offline','River district',18,{power:22,logistics:16},36,65,'Water pressure is falling. Restore pump power and supply clean water.',.9),
  incident('medical','Medical evacuation','Eastern district',28,{rescue:26},79,31,'A care facility needs a safe transfer while its cooling system is offline.',1.15),
  incident('depot','Supply depot offline','Western district',42,{power:24,logistics:18},21,42,'Food and medical supplies are stuck in a depot without power.',1),
  incident('tower','Communications outage','Highland district',54,{power:22},43,17,'Emergency calls are being rerouted. Bring the relay tower back online.',1.2),
  incident('shelter','Shelter overflow','Southern district',68,{rescue:18,logistics:22},61,77,'A second shelter must open before the current one reaches capacity.',1),
 ]},
 {id:'cascade',title:'The Long Night',difficulty:'Command test',brief:'Storm damage, blackouts, and supply shortages are unfolding together. Six teams. Eight incidents. Keep the response moving.',duration:160,plans:[
  incident('airport','Airport closure','Coastal hub',0,{rescue:22,logistics:20},81,51,'Diverted travelers need safe transport and temporary accommodation.',1),
  incident('dam','Flood warning','Upper valley',0,{rescue:25},42,21,'Residents downstream need evacuation support.',1.1),
  incident('grid','Grid instability','Central district',12,{power:32},53,44,'Several substations are offline. Prioritize a stable restart.',1.05),
  incident('clinic','Clinic on reserve','Western district',20,{power:22,logistics:18},24,42,'The clinic needs power and a delivery of replacement supplies.',1.2),
  incident('road','Mountain road blocked','Highlands',31,{rescue:23,logistics:16},28,19,'Weather has stranded a convoy. Arrange assistance and supplies.',1.15),
  incident('water','Drinking-water shortage','Southern district',43,{power:18,logistics:24},56,76,'A damaged pumping station has interrupted clean-water service.',1.05),
  incident('harbor','Harbor rescue','Outer coast',57,{rescue:28},86,26,'Coastal crews report stranded boat passengers.',1.3),
  incident('relay','Emergency relay down','Eastern district',69,{power:25,logistics:17},71,62,'Restore the relay and deliver replacement hardware.',1.15),
 ]},
];
export type Incident=IncidentPlan & {remaining:Partial<Record<Agency,number>>;severity:number;status:'pending'|'active'|'resolved'|'lost'};
export type ResponseTeam={id:string;agency:Agency;incident:string|null;travel:number;returning:number};
export type SituationState={scenario:ScenarioId;phase:'briefing'|'running'|'won'|'lost';elapsed:number;duration:number;confidence:number;score:number;resolved:number;lost:number;total:number;surges:number;surgeTime:number;incidents:Incident[];teams:ResponseTeam[];log:{at:number;text:string}[]};
export class SituationChallenge {
 state:SituationState;
 constructor(id:ScenarioId='storm'){this.state=this.initial(id);}
 private initial(id:ScenarioId):SituationState {
  const scenario=SCENARIOS.find(s=>s.id===id)??SCENARIOS[0];
  return {scenario:scenario.id,phase:'briefing',elapsed:0,duration:scenario.duration,confidence:100,score:0,resolved:0,lost:0,total:scenario.plans.length,surges:2,surgeTime:0,incidents:scenario.plans.map(p=>({...p,needs:{...p.needs},remaining:{...p.needs},severity:24,status:'pending'})),teams:(Object.keys(AGENCIES) as Agency[]).flatMap(agency=>[1,2].map(n=>({id:`${agency}-${n}`,agency,incident:null,travel:0,returning:0}))),log:[]};
 }
 reset(id:ScenarioId=this.state.scenario){this.state=this.initial(id);}
 start(){if(this.state.phase!=='briefing')return;this.state.phase='running';this.log('Watch floor online. Awaiting your dispatch orders.');this.update(.001);}
 private log(text:string){this.state.log.unshift({at:Math.floor(this.state.elapsed),text});this.state.log.length=Math.min(6,this.state.log.length);}
 dispatch(id:string,agency:Agency){
  const s=this.state,i=s.incidents.find(i=>i.id===id);
  if(s.phase!=='running'||!i||i.status!=='active'||!(i.remaining[agency]!>0))return false;
  if(s.teams.some(t=>t.incident===id&&t.agency===agency))return false;
  const team=s.teams.find(t=>t.agency===agency&&!t.incident&&t.returning<=0);if(!team)return false;
  team.incident=id;team.travel=3;this.log(`${AGENCIES[agency].short} dispatched: ${i.title}.`);return true;
 }
 surge(){if(this.state.phase!=='running'||!this.state.surges||this.state.surgeTime>0)return false;this.state.surges--;this.state.surgeTime=12;this.log('Federal surge: response speed doubled for 12 seconds.');return true;}
 update(seconds:number){
  if(this.state.phase!=='running'||!Number.isFinite(seconds)||seconds<=0)return;
  // Small fixed steps make outcomes independent of render rate and tab timing.
  let left=Math.min(seconds,this.state.duration-this.state.elapsed);while(left>1e-8&&this.state.phase==='running'){const dt=Math.min(.1,left);left-=dt;this.step(dt);}
 }
 private step(dt:number){
  const s=this.state;s.elapsed=Math.min(s.duration,s.elapsed+dt);if(s.duration-s.elapsed<1e-7)s.elapsed=s.duration;s.surgeTime=Math.max(0,s.surgeTime-dt);
  for(const i of s.incidents)if(i.status==='pending'&&i.at<=s.elapsed){i.status='active';this.log(`New incident: ${i.title}.`);}
  for(const t of s.teams){
   if(t.returning>0)t.returning=Math.max(0,t.returning-dt);
   if(!t.incident)continue;
   const i=s.incidents.find(i=>i.id===t.incident)!;
   if(i.status!=='active'){t.incident=null;t.returning=4;continue;}
   if(t.travel>0){t.travel=Math.max(0,t.travel-dt);continue;}
   i.remaining[t.agency]=Math.max(0,(i.remaining[t.agency]??0)-dt*(s.surgeTime>0?2:1));
   if(i.remaining[t.agency]===0){this.log(`${AGENCIES[t.agency].short} assignment complete: ${i.title}.`);t.incident=null;t.returning=4;}
  }
  for(const i of s.incidents){
   if(i.status!=='active')continue;
   if(Object.values(i.remaining).every(v=>v===0)){i.status='resolved';s.resolved++;s.score+=Math.round(250+(100-i.severity)*3);s.confidence=Math.min(100,s.confidence+4);this.log(`Contained: ${i.title}.`);continue;}
   const onSite=s.teams.filter(t=>t.incident===i.id&&t.travel<=0).length;
   i.severity=Math.min(100,i.severity+dt*(s.surgeTime>0?0:i.rate*(onSite?.35:1)));
   if(i.severity>=100){i.status='lost';s.lost++;s.confidence=Math.max(0,s.confidence-25);this.log(`Response window missed: ${i.title}.`);for(const t of s.teams)if(t.incident===i.id){t.incident=null;t.returning=4;}}
  }
  if(s.confidence<=0||s.elapsed>=s.duration){s.phase='lost';this.log(s.confidence<=0?'Response overwhelmed. Review your priorities and try again.':'Shift ended with incidents still open.');}
  else if(s.resolved+s.lost===s.total){s.phase=s.lost===0?'won':'lost';if(s.phase==='won')s.score+=Math.round((s.duration-s.elapsed)*10);this.log(s.phase==='won'?'All incidents contained. The country can sleep tonight.':'Shift complete. Some communities missed their response window.');}
 }
 snapshot():SituationState{return {...this.state,incidents:this.state.incidents.map(i=>({...i,needs:{...i.needs},remaining:{...i.remaining}})),teams:this.state.teams.map(t=>({...t})),log:this.state.log.map(l=>({...l}))};}
}
