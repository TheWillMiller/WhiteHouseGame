export type ControllerStatus={state:'unavailable'|'none'|'unmapped'|'release'|'ready';name:string;axes:number[];buttons:number[]};
export type ControllerCommand='menu'|'map'|'back'|'accept'|'next'|'previous';
type Pad=Pick<Gamepad,'id'|'index'|'connected'|'mapping'|'axes'|'buttons'>;
export type ControllerFrame={x:number;y:number;lookX:number;lookY:number;gas:number;reverse:number;held:boolean[];pressed:boolean[];navigate:number};
export const emptyControllerFrame=():ControllerFrame=>({x:0,y:0,lookX:0,lookY:0,gas:0,reverse:0,held:[],pressed:[],navigate:0});
const clamp=(n:number)=>Number.isFinite(n)?Math.max(-1,Math.min(1,n)):0;
export function stickDeadzone(x:number,y:number,dead=.18){x=clamp(x);y=clamp(y);const length=Math.hypot(x,y);if(length<=dead)return [0,0];const strength=Math.min(1,(length-dead)/(1-dead));return [x/length*strength,y/length*strength];}

/** One active standard-mapped pad. Never retain stale browser Gamepad objects. */
export class ControllerInput{
 status:ControllerStatus={state:'none',name:'',axes:[],buttons:[]};
 private index=-1;private identity='';private previous:boolean[]=[];private needsNeutral=true;private menu=false;private direction=0;private repeat=0;
 reset(){this.needsNeutral=true;this.previous=[];this.direction=0;this.repeat=0;}
 poll(dt:number,menu:boolean,enabled=true,pads?:readonly (Pad|null)[]):ControllerFrame{
  const empty=emptyControllerFrame();
  if(!enabled){this.reset();return empty;}
  if(pads===undefined){try{if(typeof navigator==='undefined'||typeof navigator.getGamepads!=='function'){this.status={state:'unavailable',name:'',axes:[],buttons:[]};this.reset();return empty;}pads=Array.from(navigator.getGamepads());}catch{this.status={state:'unavailable',name:'',axes:[],buttons:[]};this.reset();return empty;}}
  const connected=pads.filter((p):p is Pad=>!!p&&p.connected);
  const pad=connected.find(p=>p.index===this.index&&p.id===this.identity&&p.mapping==='standard')??connected.find(p=>p.mapping==='standard')??connected[0];
  if(!pad){this.index=-1;this.identity='';this.status={state:'none',name:'',axes:[],buttons:[]};this.reset();return empty;}
  if(this.index!==pad.index||this.identity!==pad.id||menu!==this.menu){this.reset();this.index=pad.index;this.identity=pad.id;this.menu=menu;}
  const held=Array.from(pad.buttons,b=>b.pressed||b.value>.5),axes=Array.from(pad.axes,clamp);
  this.status={state:'ready',name:pad.id,axes:axes.slice(0,4),buttons:held.flatMap((v,i)=>v?[i]:[])};
  if(pad.mapping!=='standard'){this.status.state='unmapped';this.reset();return empty;}
  const [x,y]=stickDeadzone(axes[0]??0,axes[1]??0),[lookX,lookY]=stickDeadzone(axes[2]??0,axes[3]??0);
  const trigger=(i:number)=>Math.max(0,(Math.max(0,clamp(pad.buttons[i]?.value??0))-.06)/.94),gas=trigger(7),reverse=trigger(6);
  if(this.needsNeutral){this.previous=held;if(held.some(Boolean)||Math.hypot(x,y,lookX,lookY)>.01||gas>.01||reverse>.01){this.status.state='release';return empty;}this.needsNeutral=false;}
  const pressed=held.map((v,i)=>v&&!this.previous[i]);this.previous=held;
  let navigate=0;const direction=held[13]||held[15]||y>.55||x>.55?1:held[12]||held[14]||y<-.55||x<-.55?-1:0;
  if(menu&&direction){this.repeat-=Math.max(0,dt);if(direction!==this.direction){navigate=direction;this.repeat=.36;}else if(this.repeat<=0){navigate=direction;this.repeat=.14;}}else this.repeat=0;this.direction=direction;
  return {x,y:-y,lookX,lookY,gas,reverse,held,pressed,navigate};
 }
}

/** Navigate existing dialog controls, preserving their normal click behavior. */
export function controllerMenu(command:ControllerCommand){
 if(!['accept','next','previous'].includes(command))return;
 const dialogs=Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]')).filter(el=>el.getClientRects().length);
 const dialog=dialogs.at(-1);if(!dialog)return;
 const controls=Array.from(dialog.querySelectorAll<HTMLElement>('button,a[href],[role="tab"]')).filter(el=>!el.matches(':disabled,[aria-disabled="true"],[data-disabled]')&&el.getClientRects().length);
 if(!controls.length)return;const index=controls.indexOf(document.activeElement as HTMLElement);
 if(command==='accept'&&index>=0){controls[index].click();return;}
 const next=command==='previous'?(index<0?controls.length-1:(index-1+controls.length)%controls.length):index<0?0:(index+1)%controls.length;
 controls[next].focus({preventScroll:true});controls[next].scrollIntoView({block:'nearest'});
}
