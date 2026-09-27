// Game coordinates: north is -Z. Public plans and the supplied wider aerials
// establish these approximate relationships, not surveyed dimensions.
export const GARDENS = [
  {id:'rose',x:-43.5,z:-5.8,w:34,d:21,lawnW:28,lawnD:14.5},
  {id:'kennedy',x:41,z:-5,w:25,d:18,lawnW:18,lawnD:12},
] as const;
export const WEST_APPROACH = [[-125,-88],[-114,-88],[-106,-67],[-92,-42],[-89,-30],[-70,-35],[-38,-63]] as const;
export const WEST_WALKS = [
  [[-106,-67],[-85,-65],[-60,-65],[-38,-63]],
  [[-89,-30],[-89,-27]],
  [[-92,-42],[-105,-29],[-110,-12],[-110,15],[-102,28],[-94.4,29]],
  [[-46,4],[-44,9],[-40,13]],
  [[-46,8],[-59,18],[-73,23],[-81.6,29]],
  [[-94.4,43],[-91,60],[-77,73],[-64.3,73.4]],
] as const;
export const SOUTH_DRIVE = [[0.4,2.4],[22.6,4.5],[38.1,13.2],[45.5,26.8],[47.2,43.9],[47.7,56.2],[52.3,67.7],[62.1,78.1],[65.1,86.2],[59.1,96.6],[49.1,104.1],[28.3,108.1],[0.2,107.9],[-26.6,107.3],[-44.5,103.7],[-54,96.8],[-60,85.8],[-64.3,73.4],[-64.7,63.7],[-61.7,52.4],[-57.4,38.5],[-50.6,25.1],[-42.1,14.5],[-28.9,7.1],[-14,3]] as const;
export const DRIVE_BRANCHES = [
 [[-125,103.9],[-106.8,103.9],[-94,100.7],[-81.5,91.7],[-71.5,80.5],[-64.7,68.5]],
 [[-106.8,103.9],[-82.1,103.9],[-60,106.8],[-26.6,107.3]],
 [[62.1,78.1],[70,86.6],[80.4,95.4],[91.9,103.2],[107,106.8],[125,106.8]],
] as const;
export const SOUTH_FOUNTAIN={x:0,z:136,radius:7};
export const ESTATE_BOUNDS={minX:-123,maxX:123,minZ:-130,maxZ:222};
export const ESTATE_BENCHES=[{x:-59.4,z:-5.8,yaw:-Math.PI/2},{x:-27.6,z:-5.8,yaw:Math.PI/2},{x:34,z:-5,yaw:-Math.PI/2},{x:48,z:-5,yaw:Math.PI/2}];
export const GARDEN_EXIT = [-56.5,-20.3] as const;
export const GARDEN_ENTRANCE = [-56.5,-20.3] as const;
export const WEST_PORTICO={x:-89,z:-23.5,w:10.6,d:8.2,height:.18};
// Photo-based placements within the game's existing approximate estate scale.
// Beyond the South Drive, with lawn between the residence and landing circle.
export const HELIPAD={x:0,z:50,radius:15.24}; // Reported 100 ft diameter.
export const SOUTH_FLAG={x:18,z:19,height:26.8224}; // East of the approach, beside the drive.
// Pebble Beach follows the west side of the North Drive, perpendicular to the facade.
export const PRESS_TENTS=[[-117,-43],[-117,-49],[-117,-55],[-117,-61]] as const;
export const PRESS_TENT_YAW=Math.PI/2; // Open fronts face east toward the residence.

export const NORTH_DRIVE=[[-70,-134],[-70,-120],[-64,-91],[-50,-70],[-28,-57],[0,-52],[28,-57],[50,-70],[64,-91],[70,-120],[70,-134]] as const;
export const NORTH_FOUNTAIN={x:0,z:-92,radius:5};
export function insideEstate(x:number,z:number){return x>=ESTATE_BOUNDS.minX&&x<=ESTATE_BOUNDS.maxX&&z>=ESTATE_BOUNDS.minZ&&z<=ESTATE_BOUNDS.maxZ&&(z<=107||(x/123)**2+((z-107)/115)**2<=1);}
