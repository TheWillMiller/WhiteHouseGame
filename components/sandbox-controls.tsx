'use client';
import type {ArcadeMode,ArcadeState} from '@/lib/arcade';
import {Crosshair,Rocket,Footprints,RotateCcw,X,Flag,MousePointer2,ChevronDown} from 'lucide-react';
import type {RaceState} from '@/lib/cart-race';
import {useState,type PointerEvent} from 'react';

export function SandboxModes({choose,teleport}:{choose:(mode:ArcadeMode)=>void;teleport:()=>void}){return <div className="sandbox-modes">
 <button onClick={()=>choose('race')}><Flag/><div><strong>Cabinet Grand Prix</strong><span>Race the estate and construction site. Jumps, boost pads, and mystery power-ups.</span></div><b>RACE</b></button>
 <button onClick={()=>choose('flight')}><Rocket/><div><strong>Gold jetpack</strong><span>Fly over the estate. Collect eight sky rings.</span></div><b>FLY</b></button>
 <button onClick={()=>choose('blaster')}><Crosshair/><div><strong>Gold rush</strong><span>A gold blaster. Moving targets. Sixty seconds.</span></div><b>PLAY</b></button>
 <button onClick={()=>choose('off')}><Footprints/><div><strong>Free roam</strong><span>Return to the South Lawn and explore.</span></div></button>
 <button onClick={teleport}><MousePointer2/><div><strong>Click to teleport</strong><span>Tap a floor or path to jump there.</span></div><b>T</b></button>
 </div>;}

export function SandboxHUD({state,choose,race,loading,recover,toggleGuide}:{state:ArcadeState;choose:(mode:ArcadeMode)=>void;race?:RaceState;loading?:boolean;recover:()=>void;toggleGuide:()=>void}){
 if(state.mode==='race')return <RaceHUD choose={choose} race={race} loading={loading} recover={recover}/>;
 const flight=state.mode==='flight',time=Math.ceil(state.seconds),accuracy=state.shots?Math.round(state.score/100/state.shots*100):0;
 return <>
 <aside className="sandbox-hud" aria-label={flight?'Jetpack challenge':'Blaster challenge'}>
  <div className="sandbox-title"><strong>{flight?'GOLD JETPACK':'GOLD RUSH'}</strong><button onClick={()=>choose(state.mode)} aria-label="Restart challenge" title="Restart"><RotateCcw size={17}/></button><button onClick={()=>choose('off')} aria-label="Exit mode" title="Return to free roam"><X size={18}/></button></div>
  <div className="sandbox-score">{flight?<><b>{state.rings}<small> / {state.totalRings} rings</small></b><span>{state.altitude} m · {time}s</span></>:<><b>{state.score}<small> pts</small></b><span>{time}s · {accuracy}% hits</span></>}</div>
  <p role="status">{state.finished?(flight?'Course complete! Keep flying or race again.':'Time! Restart to beat your score.'):flight?state.hit?'Ring cleared!':state.guided?'Hold forward. Guidance steers and adjusts height.':`Next ring · ${state.nextDistance} m away`:state.started?'Keep the targets in your sights.':'Aim at an orb. Your first shot starts the clock.'}</p>
  {flight&&<button className="mode-option" onClick={toggleGuide} aria-pressed={state.guided}>Flight guide {state.guided?'ON':'OFF'} <small>{state.guided?'Tap for manual flight':'Tap for assistance'}</small></button>}
  <small className="sandbox-keys">{flight?'WASD move · Space up · C down · Shift boost · Drag look':'Drag to aim · Hold left mouse or X to fire · WASD move'}</small>
 </aside>
 {flight&&state.next&&!state.finished&&<div className="next-ring-marker" style={{left:`${state.next.x}%`,top:`${state.next.y}%`}}><b>{state.next.behind?'↶':'◇'}</b><span>{state.next.behind?'Turn around':`RING ${state.rings+1}`}<small>{state.nextDistance} m</small></span></div>}
 {!flight&&<div className={'blaster-reticle'+(state.hit?' hit':'')} aria-hidden="true"><i/><i/><i/><i/><b/></div>}
 </>;
}

function RaceHUD({choose,race,loading,recover}:{choose:(mode:ArcadeMode)=>void;race?:RaceState;loading?:boolean;recover:()=>void}){
 const [expanded,setExpanded]=useState(false);
 const message=loading||!race?'Joining the grid…':race.finished?race.message:race.countdown?'Ready at the starting line':race.message?race.message:race.offRoad?'Off road · open options to recover':'Follow the green gates';
 return <>
  <aside className={'sandbox-hud race-hud'+(expanded?' expanded':'')} aria-label="Cabinet Grand Prix">
   <div className="sandbox-title"><strong>GRAND PRIX</strong>
    <button onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Hide race standings and options':'Show race standings and options'} aria-expanded={expanded} aria-controls="race-details" title="Standings and options"><ChevronDown size={18}/></button>
    <button onClick={()=>choose('off')} aria-label="Exit race" title="Exit race"><X size={18}/></button>
   </div>
   {race&&!loading&&<div className="race-summary"><b>{race.rank}<small> / 4</small></b><span>Lap {race.lap}/2</span><time>{Math.floor(race.seconds)}s</time></div>}
   <p className="race-hint" role="status">{message}</p>{race&&!loading&&<div className="race-boost-meter" role="progressbar" aria-label="Boost charge" aria-valuemin={0} aria-valuemax={100} aria-valuenow={race.boost}><i style={{width:race.boost+"%"}}/><span>{race.boosting?"BOOST":race.effect||"BOOST"} · {race.boost}%</span><small>{race.speed} km/h</small></div>}
   <div id="race-details" className="race-details" hidden={!expanded}>
    {race&&!loading&&<ol className="race-standings">{race.standings.map(s=><li key={s.name} className={s.name==='Donald Trump'?'you':''}><i style={{background:'#'+s.color.toString(16).padStart(6,'0')}}/>{s.name}</li>)}</ol>}
    {race&&!loading&&!race.finished&&<button className="mode-option" onClick={()=>{recover();setExpanded(false);}}>Back on track <small>+3 seconds</small></button>}
    <button className="mode-option" disabled={loading} onClick={()=>{setExpanded(false);choose('race');}}><span>Restart race</span><RotateCcw size={16}/></button>
    <p className="race-help">Two laps · {race?.length??670} m each. Gold boxes give Gold Rush speed, Executive Shield protection, or Art of the Deal to slow nearby rivals. Ramps refill boost when you land.</p><small className="sandbox-keys">W/S throttle · A/D steer · Space brake · Shift boost · X item</small>
   </div>
  </aside>
  {race&&!loading&&!race.finished&&(race.countdown>0||race.seconds<.7)&&<div className="race-countdown" aria-live="polite">{race.countdown||'GO!'}</div>}
 </>;
}

function Hold({code,label,onKey,disabled=false,title}:{code:string;label:string;onKey:(code:string,on:boolean)=>void;disabled?:boolean;title?:string}){
 const release=()=>onKey(code,false);return <button disabled={disabled} title={title} aria-label={`Hold to ${label.toLowerCase()}`} onPointerDown={(e:PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onKey(code,true);}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onKey(code,true);}}} onKeyUp={release} onBlur={release}>{label}</button>;
}
export function SandboxActions({mode,onKey,race}:{mode:ArcadeMode;onKey:(code:string,on:boolean)=>void;race?:RaceState}){return <div className={'sandbox-actions'+(mode==='race'?' race-actions':'')}>{mode==='flight'?<><Hold code="KeyC" label="Down" onKey={onKey}/><Hold code="Space" label="Up" onKey={onKey}/><Hold code="ShiftLeft" label="Boost" onKey={onKey}/></>:mode==='race'?<><Hold code="Space" label="Brake" onKey={onKey}/><Hold code="ShiftLeft" label="Boost" onKey={onKey} disabled={!race||race.finished||race.countdown>0}/><Hold code="KeyX" label={race?.itemName??'Item'} title={race?.itemDescription} disabled={!race?.item||race.finished||race.countdown>0} onKey={onKey}/></>:<Hold code="KeyX" label="Fire" onKey={onKey}/>}</div>;}
