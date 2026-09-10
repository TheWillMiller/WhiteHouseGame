import type { Game } from './game';
import { destinations } from './world-data';
type Context={registerTool:(tool:{name:string;description:string;inputSchema:object;annotations:{readOnlyHint:boolean;untrustedContentHint:boolean};execute:(input:unknown)=>unknown},options:{signal:AbortSignal})=>unknown};
export function registerGameTools(game:Game,travel:(id:string)=>void){
 const context=(document as Document&{modelContext?:Context}).modelContext;
 const lifecycle=new AbortController();
 if(context?.registerTool){
  const tools=[
   {name:'read_white_house_game',description:'Read the current player location and the available game destinations.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true,untrustedContentHint:false},execute:()=>({zone:game.zone,position:{x:game.player.position.x,z:game.player.position.z},visited:[...game.visited],met:[...game.met],destinations:destinations.map(({id,name,zone})=>({id,name,zone}))})},
   {name:'travel_white_house',description:'Move the player to a named destination and close the game map or conversation.',inputSchema:{type:'object',properties:{destinationId:{type:'string',enum:destinations.map(d=>d.id)}},required:['destinationId'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:async(input:unknown)=>{if(!input||typeof input!=='object'||Object.keys(input).some(k=>k!=='destinationId')||!('destinationId'in input)||typeof input.destinationId!=='string'||!destinations.some(d=>d.id===input.destinationId))throw new Error('Choose an available destinationId.');travel(input.destinationId);await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));return{destinationId:input.destinationId,zone:game.zone};}},
  ];
  for(const tool of tools){try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>{});}catch{/* Progressive enhancement; ordinary play remains available. */}}
 }
 return()=>lifecycle.abort();
}
