// Run after world.test.cjs has transpiled the game modules into .qa.
import assert from 'node:assert/strict';
import * as T from 'three';
import {CameraObstacles,RenderBudget} from '../.qa/render-budget.mjs';
import {FollowCamera} from '../.qa/follow-camera.mjs';
const obstacles=new CameraObstacles([{x:0,z:0,w:20,d:.22},{x:100,z:100,w:20,d:20}],false);
assert.equal(obstacles.nearby(0,3).length,1,'distant obstacles are excluded');
const camera=new FollowCamera();const target=new T.Vector3(0,2.15,3),desired=new T.Vector3(0,4,-4);
const result=camera.solve(target,desired,obstacles.nearby(0,3),.016);
assert(result.position.z>.11,'camera retracts in front of the wall');
const budget=new RenderBudget(1.5);
for(let i=0;i<600;i++)budget.sample(1/25);
assert(budget.ratio<1.5&&budget.ratio>=.65,'sustained slow frames lower resolution');
const low=budget.ratio;for(let i=0;i<3000;i++)budget.sample(1/60);
assert(budget.ratio>low&&budget.ratio<=1.5,'sustained fast frames recover quality');
const stable=new RenderBudget(1);stable.sample(2);for(let i=0;i<150;i++)stable.sample(1/60);
assert.equal(stable.ratio,1,'isolated load stall does not lower resolution');
obstacles.dispose();console.log('PASS: nearby-only camera proxies, wall clearance, adaptive resolution and loading-stall hysteresis.');
