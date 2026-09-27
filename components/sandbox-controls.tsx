'use client';
import type {ArcadeMode,ArcadeState} from '@/lib/arcade';
import {Crosshair,Rocket,Footprints,RotateCcw,X,Flag,MousePointer2,ChevronDown} from 'lucide-react';
import type {RaceState} from '@/lib/cart-race';
import {useState,type PointerEvent} from 'react';

export function SandboxModes({choose,teleport}:{choose:(mode:ArcadeMode)=>void;teleport:()=>void}){return <div className="sandbox-modes">
 <button onClick={()=>choose('race')}><Flag/><div><strong>Cabinet Grand Prix</strong><span>Auto throttle, forgiving steering, cabinet rivals. Jump, boost, and outsmart the pack.</span></div><b>RACE</b></button>
 <button onClick={()=>choose('flight')}><Rocket/><div><strong>Sky Rally</strong><span>One-stick flying above the White House. Twelve big gates, perfect passes, and boost.</span></div><b>FLY</b></button>
 <button onClick={()=>choose('blaster')}><Crosshair/><div><strong>The Big Beautiful Shootout</strong><span>Blast tax bills, red tape, inflation, and fictional regime bosses. Tap targets. Build a streak.</span></div><b>PLAY</b></button>
 <button onClick={()=>choose('off')}><Footprints/><div><strong>Free roam</strong><span>Return to the South Lawn and explore.</span></div></button>
 <button onClick={teleport}><MousePointer2/><div><strong>Click to teleport</strong><span>Tap a floor or path to jump there.</span></div><b>T</b></button>
 </div>;}

export function SandboxHUD({state,choose,race,loading,recover,toggleGuide,toggleAssist}:{state:ArcadeState;choose:(mode:ArcadeMode)=>void;race?:RaceState;loading?:boolean;recover:()=>void;toggleGuide:()=>void;toggleAssist:()=>void}){
 if(state.mode==='race')return <RaceHUD choose={choose} race={race} loading={loading} recover={recover} toggleAssist={toggleAssist}/>;
 const flight=state.mode==='flight',time=Math.ceil(state.seconds),accuracy=state.shots?Math.round(state.hits/state.shots*100):0;
 return <>
 <aside className="sandbox-hud arcade-hud" aria-label={flight?'Sky Rally':'Big Beautiful Shootout'}>
  <div className="sandbox-title"><strong>{flight?'SKY RALLY':'THE SHOOTOUT'}</strong><button onClick={()=>choose(state.mode)} aria-label="Restart challenge" title="Restart"><RotateCcw size={17}/></button><button onClick={()=>choose('off')} aria-label="Exit mode" title="Return to free roam"><X size={18}/></button></div>
  <div className="sandbox-score"><b>{state.score.toLocaleString()}<small> pts</small></b><span>{flight?`${state.cleared}/${state.totalRings} gates`:`${time}s`}</span></div>
  <div className="arcade-progress"><i style={{width:`${flight?state.rings/state.totalRings*100:state.seconds/60*100}%`}}/></div>
  <div className="arcade-stats"><span>{flight?`${time}s flying`:`ROUND ${state.wave}/3`}</span><span>{state.combo>1?`${state.combo} HIT STREAK`:flight?`${state.missed} missed`:`${accuracy}% accuracy`}</span></div>
  {flight&&<button className="mode-option" onClick={toggleGuide} aria-pressed={state.guided}>{state.guided?'Switch to free flight':'Return to sky course'} <small>{state.guided?'Manual controls':'Automatic forward flight'}</small></button>}
 </aside>
 {state.message&&!state.finished&&<div className={'arcade-feedback'+(state.hit?' success':'')} role="status">{state.message}</div>}
 {!state.started&&!state.finished&&<div className="arcade-start"><strong>{flight?'One stick. Open skies.':'Your least favorite things. Now targets.'}</strong><p>{flight?'Forward flight is automatic. Steer left/right and up/down through the mint gates. Release to recenter.':'Tap or click a target to shoot. Chain hits for up to 5× points.'}</p><small>{flight?'Move the stick or press W to launch · Shift boosts':'Or drag to aim, then hold Fire / X / controller RT'}</small></div>}
 {flight&&state.started&&state.countdown>0&&state.guided&&<div className="race-countdown">{state.countdown}<small>GET READY</small></div>}
 {flight&&state.next?.behind&&!state.finished&&!state.guided&&<div className="next-ring-marker" style={{left:'50%',top:'32%'}}><b>↶</b><span>Gate behind you<small>{state.nextDistance} m</small></span></div>}
 {!flight&&<div className={'blaster-reticle'+(state.hit?' hit':'')} aria-hidden="true"><i/><i/><i/><i/><b/></div>}
 {state.finished&&<div className="arcade-result"><small>{flight?'FLIGHT COMPLETE':'TIME’S UP'}</small><h2>{state.score.toLocaleString()} <span>points</span></h2><p>{flight?`${state.cleared} of ${state.totalRings} gates · ${time}s`:`${state.hits} hits · ${accuracy}% accuracy`}<br/>Best streak: {state.bestCombo}</p><button onClick={()=>choose(state.mode)}>Play again <RotateCcw size={18}/></button><button className="secondary" onClick={()=>choose('off')}>Back to the grounds</button></div>}
 </>;
}

function RaceHUD({choose,race,loading,recover,toggleAssist}:{choose:(mode:ArcadeMode)=>void;race?:RaceState;loading?:boolean;recover:()=>void;toggleAssist:()=>void}){
 const [expanded,setExpanded]=useState(false);
 const message=loading||!race?'Joining the grid…':race.finished?race.message:race.countdown?'Ready at the starting line':race.message?race.message:race.offRoad?'Off road · open options to recover':race.assisted?'Auto drive · steer to pass':'Auto throttle · you steer';
 return <>
  <aside className={'sandbox-hud race-hud'+(expanded?' expanded':'')} aria-label="Cabinet Grand Prix">
   <div className="sandbox-title"><strong>GRAND PRIX</strong>
    <button onClick={()=>setExpanded(v=>!v)} aria-label={expanded?'Hide race standings and options':'Show race standings and options'} aria-expanded={expanded} aria-controls="race-details" title="Standings and options"><ChevronDown size={18}/></button>
    <button onClick={()=>choose('off')} aria-label="Exit race" title="Exit race"><X size={18}/></button>
   </div>
   {race&&!loading&&<div className="race-summary"><b>{race.rank}<small> / 4</small></b><span>Lap {race.lap}/2</span><time>{Math.floor(race.seconds)}s</time></div>}
   <p className="race-hint" role="status">{message}</p>{race&&!loading&&<div className="race-boost-meter" role="progressbar" aria-label="Boost charge" aria-valuemin={0} aria-valuemax={100} aria-valuenow={race.boost}><i style={{width:race.boost+"%"}}/><span>{race.boosting?"BOOST":race.effect||"BOOST"} · {race.boost}%</span><small>{race.speed} km/h</small></div>}
   {race&&!loading&&!race.finished&&<div className="race-turn"><span>{Math.abs(race.turn)<.12?'↑':race.turn>0?'↱':'↰'}</span><div>{Math.abs(race.turn)<.12?'STRAIGHT AHEAD':Math.abs(race.turn)>.5?'TIGHT TURN':race.turn>0?'BEAR RIGHT':'BEAR LEFT'}<small>Steer · brake · boost</small></div></div>}
   <div id="race-details" className="race-details" hidden={!expanded}>
    {race&&!loading&&<ol className="race-standings">{race.standings.map(s=><li key={s.name} className={s.name==='Donald Trump'?'you':''}><i style={{background:'#'+s.color.toString(16).padStart(6,'0')}}/>{s.name}</li>)}</ol>}
    {race&&<button className="mode-option" onClick={toggleAssist} aria-pressed={race.assisted}>Steering assist {race.assisted?'ON':'OFF'}<small>Auto throttle stays on</small></button>}
    {race&&!loading&&!race.finished&&<button className="mode-option" onClick={()=>{recover();setExpanded(false);}}>Back on track <small>+3 seconds</small></button>}
    <button className="mode-option" disabled={loading} onClick={()=>{setExpanded(false);choose('race');}}><span>Restart race</span><RotateCcw size={16}/></button>
    <p className="race-help">Two laps · {race?.length??670} m each. Gold boxes give Gold Rush speed, Executive Shield protection, or Art of the Deal to slow nearby rivals. Ramps refill boost when you land.</p><small className="sandbox-keys">Auto throttle · A/D steer · S or Space brake · Shift boost · X item</small>
   </div>
  </aside>
  {race&&!loading&&!race.finished&&(race.countdown>0||race.seconds<.7)&&<div className="race-countdown" aria-live="polite">{race.countdown||'GO!'}</div>}
  {race?.finished&&<div className="arcade-result"><small>CABINET GRAND PRIX</small><h2>{race.rank===1?'You won!':`${race.rank} / 4`}</h2><p>Two laps · {race.seconds.toFixed(1)} seconds</p><button onClick={()=>choose('race')}>Race again <RotateCcw size={18}/></button><button className="secondary" onClick={()=>choose('off')}>Back to the grounds</button></div>}
 </>;
}

function Hold({code,label,onKey,disabled=false,title}:{code:string;label:string;onKey:(code:string,on:boolean)=>void;disabled?:boolean;title?:string}){
 const release=()=>onKey(code,false);return <button disabled={disabled} title={title} aria-label={`Hold to ${label.toLowerCase()}`} onPointerDown={(e:PointerEvent<HTMLButtonElement>)=>{e.preventDefault();e.currentTarget.setPointerCapture(e.pointerId);onKey(code,true);}} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();onKey(code,true);}}} onKeyUp={release} onBlur={release}>{label}</button>;
}
export function SandboxActions({mode,onKey,race,guided}:{mode:ArcadeMode;onKey:(code:string,on:boolean)=>void;race?:RaceState;guided?:boolean}){return <div className={'sandbox-actions'+(mode==='race'?' race-actions':'')}>{mode==='flight'?<>{!guided&&<><Hold code="KeyC" label="Down" onKey={onKey}/><Hold code="Space" label="Up" onKey={onKey}/></>}<Hold code="ShiftLeft" label="Boost" onKey={onKey}/></>:mode==='race'?<><Hold code="Space" label="Brake" onKey={onKey}/><Hold code="ShiftLeft" label="Boost" onKey={onKey} disabled={!race||race.finished||race.countdown>0}/><Hold code="KeyX" label={race?.itemName??'Item'} title={race?.itemDescription} disabled={!race?.item||race.finished||race.countdown>0} onKey={onKey}/></>:<Hold code="KeyX" label="Fire" onKey={onKey}/>}</div>;}
