'use client';
import type {ArcadeMode,ArcadeState} from '@/lib/arcade';
import {Crosshair,Rocket,Footprints,RotateCcw,X,Flag,MousePointer2} from 'lucide-react';
import type {RaceState} from '@/lib/cart-race';
import type {PointerEvent} from 'react';

export function SandboxModes({choose,teleport}:{choose:(mode:ArcadeMode)=>void;teleport:()=>void}){return <div className="sandbox-modes">
 <button onClick={()=>choose('race')}><Flag/><div><strong>Cabinet Grand Prix</strong><span>Two laps against Rubio, Bessent, and Burgum.</span></div><b>RACE</b></button>
 <button onClick={()=>choose('flight')}><Rocket/><div><strong>Gold jetpack</strong><span>Fly over the estate. Collect eight sky rings.</span></div><b>FLY</b></button>
 <button onClick={()=>choose('blaster')}><Crosshair/><div><strong>Gold rush</strong><span>A gold blaster. Moving targets. Sixty seconds.</span></div><b>PLAY</b></button>
 <button onClick={()=>choose('off')}><Footprints/><div><strong>Free roam</strong><span>Return to the South Lawn and explore.</span></div></button>
 <button onClick={teleport}><MousePointer2/><div><strong>Click to teleport</strong><span>Tap a floor or path to jump there.</span></div><b>T</b></button>
 </div>;}

export function SandboxHUD({state,choose,race,loading,recover,toggleGuide}:{state:ArcadeState;choose:(mode:ArcadeMode)=>void;race?:RaceState;loading?:boolean;recover:()=>void;toggleGuide:()=>void}){
 if(state.mode==='race')return <><aside className="sandbox-hud race-hud"><div className="sandbox-title"><strong>CABINET GRAND PRIX</strong><button onClick={()=>choose('race')} aria-label="Restart race"><RotateCcw size={17}/></button><button onClick={()=>choose('off')} aria-label="Exit race"><X size={18}/></button></div>{loading||!race?<p role="status">Cabinet members are joining the grid…</p>:<><div className="sandbox-score"><b>{race.rank}<small> / 4 place</small></b><span>Lap {race.lap} / 2 · {Math.floor(race.seconds)}s</span></div><p role="status">{race.finished?race.message:race.countdown?'Get ready. Follow the mint-green gates.':race.offRoad?'Off the drive — return to the cones.':'Follow the green gate. Pass every checkpoint.'}</p><ol className="race-standings">{race.standings.map(s=><li key={s.name} className={s.name==='Donald Trump'?'you':''}><i style={{background:'#'+s.color.toString(16).padStart(6,'0')}}/>{s.name}</li>)}</ol>{!race.finished&&<button className="mode-option" onClick={recover}>Back on track <small>+3 seconds</small></button>}<small className="sandbox-keys">W/S throttle · A/D steer · Space brake</small></>}</aside>{race&&!loading&&!race.finished&&(race.countdown>0||race.seconds<.7)&&<div className="race-countdown" aria-live="polite">{race.countdown||'GO!'}</div>}</>;
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

function Hold({code,label,onKey}:{code:string;label:string;onKey:(code:string,on:boolean)=>void}){
 const release=()=>onKey(code,false);return <button aria-label={`Hold to ${label.toLowerCase()}`} onPointerDown={(e:PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onKey(code,true);}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onKey(code,true);}}} onKeyUp={release} onBlur={release}>{label}</button>;
}
export function SandboxActions({mode,onKey}:{mode:ArcadeMode;onKey:(code:string,on:boolean)=>void}){return <div className="sandbox-actions">{mode==='flight'?<><Hold code="KeyC" label="Down" onKey={onKey}/><Hold code="Space" label="Up" onKey={onKey}/><Hold code="ShiftLeft" label="Boost" onKey={onKey}/></>:mode==='race'?<Hold code="Space" label="Brake" onKey={onKey}/>:<Hold code="KeyX" label="Fire" onKey={onKey}/>}</div>;}
