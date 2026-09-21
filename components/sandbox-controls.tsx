'use client';
import type {ArcadeMode,ArcadeState} from '@/lib/arcade';
import {Crosshair,Rocket,Footprints,RotateCcw,X} from 'lucide-react';
import type {PointerEvent} from 'react';

export function SandboxModes({choose}:{choose:(mode:ArcadeMode)=>void}){return <div className="sandbox-modes">
 <button onClick={()=>choose('flight')}><Rocket/><div><strong>Gold jetpack</strong><span>Fly over the estate. Collect eight sky rings.</span></div><b>FLY</b></button>
 <button onClick={()=>choose('blaster')}><Crosshair/><div><strong>Gold rush</strong><span>A gold blaster. Moving targets. Sixty seconds.</span></div><b>PLAY</b></button>
 <button onClick={()=>choose('off')}><Footprints/><div><strong>Free roam</strong><span>Return to the South Lawn and explore.</span></div></button>
 </div>;}

export function SandboxHUD({state,choose}:{state:ArcadeState;choose:(mode:ArcadeMode)=>void}){
 const flight=state.mode==='flight',time=Math.ceil(state.seconds),accuracy=state.shots?Math.round(state.score/100/state.shots*100):0;
 return <>
 <aside className="sandbox-hud" aria-label={flight?'Jetpack challenge':'Blaster challenge'}>
  <div className="sandbox-title"><strong>{flight?'GOLD JETPACK':'GOLD RUSH'}</strong><button onClick={()=>choose(state.mode)} aria-label="Restart challenge" title="Restart"><RotateCcw size={17}/></button><button onClick={()=>choose('off')} aria-label="Exit mode" title="Return to free roam"><X size={18}/></button></div>
  <div className="sandbox-score">{flight?<><b>{state.rings}<small> / {state.totalRings} rings</small></b><span>{state.altitude} m · {time}s</span></>:<><b>{state.score}<small> pts</small></b><span>{time}s · {accuracy}% hits</span></>}</div>
  <p role="status">{state.finished?(flight?'Course complete! Keep flying or race again.':'Time! Restart to beat your score.'):flight?`Next cyan ring · ${state.nextDistance} m away`:state.started?'Keep the targets in your sights.':'Aim at an orb. Your first shot starts the clock.'}</p>
  <small className="sandbox-keys">{flight?'WASD move · Space up · C down · Shift boost · Drag look':'Drag to aim · Hold left mouse or X to fire · WASD move'}</small>
 </aside>
 {!flight&&<div className={'blaster-reticle'+(state.hit?' hit':'')} aria-hidden="true"><i/><i/><i/><i/><b/></div>}
 </>;
}

function Hold({code,label,onKey}:{code:string;label:string;onKey:(code:string,on:boolean)=>void}){
 const release=()=>onKey(code,false);return <button aria-label={`Hold to ${label.toLowerCase()}`} onPointerDown={(e:PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onKey(code,true);}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onKey(code,true);}}} onKeyUp={release} onBlur={release}>{label}</button>;
}
export function SandboxActions({mode,onKey}:{mode:ArcadeMode;onKey:(code:string,on:boolean)=>void}){return <div className="sandbox-actions">{mode==='flight'?<><Hold code="KeyC" label="Down" onKey={onKey}/><Hold code="Space" label="Up" onKey={onKey}/><Hold code="ShiftLeft" label="Boost" onKey={onKey}/></>:<Hold code="KeyX" label="Fire" onKey={onKey}/>}</div>;}
