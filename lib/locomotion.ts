/** Frame-rate independent acceleration, with jump buffering and ledge grace. */
export class LocomotionMotor {
  x=0;z=0;private jumpBuffer=0;private groundedGrace=0;
  reset(){this.x=0;this.z=0;this.jumpBuffer=0;this.groundedGrace=0;}
  requestJump(){this.jumpBuffer=.16;}
  horizontal(x:number,z:number,dt:number,airborne=false){
    // Keep momentum when the stick is released in mid-air; allow deliberate
    // steering while jumping without the old heavy ground-like braking.
    if(airborne&&Math.hypot(x,z)<.01)return {x:this.x*dt,z:this.z*dt};
    const response=airborne?14:Math.hypot(x,z)>0?22:28;
    const a=1-Math.exp(-response*dt);this.x+=(x-this.x)*a;this.z+=(z-this.z)*a;
    if(Math.hypot(this.x,this.z)<.015){this.x=0;this.z=0;}
    return {x:this.x*dt,z:this.z*dt};
  }
  jump(grounded:boolean,dt:number){
    this.groundedGrace=grounded?.10:Math.max(0,this.groundedGrace-dt);
    const launch=this.jumpBuffer>0&&this.groundedGrace>0;
    this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
    if(launch){this.jumpBuffer=0;this.groundedGrace=0;}
    return launch;
  }
}

/** Bicycle steering: independent throttle and steering, including reverse. */
export class CartMotor {
  speed=0;steer=0;heading=0;
  reset(){this.speed=0;this.steer=0;}
  step(throttle:number,steering:number,brake:boolean,dt:number){
    this.steer+=(steering-this.steer)*(1-Math.exp(-dt*9));
    const opposite=throttle*this.speed<-.05;
    const target=brake?0:throttle*(throttle<0?3.2:8);
    const acceleration=brake?12:opposite?8:throttle===0?2.2:3.8;
    this.speed+=Math.sign(target-this.speed)*Math.min(Math.abs(target-this.speed),acceleration*dt);
    // Reduce steering lock at speed; never rotate a stationary vehicle in place.
    const angle=this.steer*(.58-.20*Math.min(1,Math.abs(this.speed)/8));
    const turn=this.speed/1.65*Math.tan(angle)*dt;
    const mid=this.heading+turn*.5;this.heading+=turn;
    return {x:Math.sin(mid)*this.speed*dt,z:-Math.cos(mid)*this.speed*dt};
  }
}
