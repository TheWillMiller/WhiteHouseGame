'use client';
import {useRef,useState,type PointerEvent} from 'react';
export function MovementStick({onMove,onStart,driving}:{onMove:(x:number,y:number)=>void;onStart:()=>void;driving:boolean}){
 const pointer=useRef<number|null>(null),[thumb,setThumb]=useState({x:0,y:0});
 const move=(e:PointerEvent<HTMLDivElement>)=>{if(pointer.current!==e.pointerId)return;const rect=e.currentTarget.getBoundingClientRect(),dx=e.clientX-rect.left-rect.width/2,dy=e.clientY-rect.top-rect.height/2,range=rect.width*.32,len=Math.hypot(dx,dy),scale=Math.min(1,range/Math.max(1,len)),x=dx*scale,y=dy*scale;setThumb({x,y});const magnitude=Math.min(1,len/range),strength=Math.max(0,(magnitude-.13)/.87);onMove(len?dx/len*strength:0,len?-dy/len*strength:0);};
 const release=(e:PointerEvent<HTMLDivElement>)=>{if(pointer.current!==e.pointerId)return;pointer.current=null;setThumb({x:0,y:0});onMove(0,0);};
 return <div className="movement-stick" role="group" aria-label={driving?'Golf cart: up accelerates, down reverses, left and right steer':'Movement joystick'} onPointerDown={e=>{if(pointer.current!==null)return;e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);onStart();move(e);}} onPointerMove={move} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}><span className="stick-axis vertical"/><span className="stick-axis horizontal"/><span className="stick-thumb" style={{transform:`translate(${thumb.x}px,${thumb.y}px)`}}/><small>{driving?'DRIVE':'MOVE'}</small></div>;
}
