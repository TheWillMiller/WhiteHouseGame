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
  speed=0;steer=0;heading=0;maxForwardSpeed=8;
  reset(){this.speed=0;this.steer=0;}
  step(throttle:number,steering:number,brake:boolean,dt:number){
    // A soft center gives thumbs room to correct, with fast release to straight.
    const input=Math.max(-1,Math.min(1,steering));
    const shaped=Math.sign(input)*Math.pow(Math.abs(input),1.35);
    this.steer+=(shaped-this.steer)*(1-Math.exp(-dt*(Math.abs(input)<.05?16:10)));
    const opposite=throttle*this.speed<-.05;
    const target=brake?0:throttle*(throttle<0?3.2:this.maxForwardSpeed);
    const acceleration=brake?19:opposite?10:throttle===0?3:5.5;
    this.speed+=Math.sign(target-this.speed)*Math.min(Math.abs(target-this.speed),acceleration*dt);
    // Reduce steering lock at speed; never rotate a stationary vehicle in place.
    const yawLimit=1.35/(1+Math.max(0,Math.abs(this.speed)-10)*.025);
    const turn=Math.sign(this.speed)*this.steer*yawLimit*Math.min(1,Math.abs(this.speed)/3)*dt;
    const mid=this.heading+turn*.5;this.heading+=turn;
    return {x:Math.sin(mid)*this.speed*dt,z:-Math.cos(mid)*this.speed*dt};
  }
}
