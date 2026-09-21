import {WEST_TERRAIN} from './west-terrain-data';
import {RESIDENCE_TERRAIN} from './residence-terrain-data';
const fields=[...RESIDENCE_TERRAIN,...WEST_TERRAIN].map(({rle,...field})=>{const heights=new Int16Array(field.w*field.d);let at=0;for(let i=0;i<rle.length;i+=2){heights.fill(rle[i+1],at,at+rle[i]);at+=rle[i];}return {...field,heights};});
export const OUTDOOR_HUMAN_SCALE=1.9/3;
export const STEP_HEIGHT=.30;
export function residenceHeight(x:number,z:number){for(const f of fields){const col=Math.round((x-f.x)/f.step),row=Math.round((z-f.z)/f.step);if(col>=0&&col<f.w&&row>=0&&row<f.d)return f.heights[row*f.w+col]/100;}return 0;}
export function residenceStepBlocked(x:number,z:number,feet:number){return residenceHeight(x,z)>feet+STEP_HEIGHT;}
// Small height-aware boxes serve camera collision without the high-poly facade.
export function residenceStepCamera(){const boxes:{x:number;z:number;w:number;d:number;height:number;y:number}[]=[];for(const f of fields)for(let row=0;row<f.d;row+=5)for(let col=0;col<f.w;col+=5){const h=f.heights[row*f.w+col]/100;if(h>.1)boxes.push({x:f.x+col*f.step,z:f.z+row*f.step,w:.5,d:.5,height:h,y:0});}return boxes;}
