// Game coordinates: north is -Z. The supplied aerial reference is rotated
// south-up. These are approximate relationships, not surveyed dimensions.
export const GARDENS = [
  {id:'rose',x:-33.1,z:-13.7,w:16,d:18.6,lawnW:10.7,lawnD:13.2},
  {id:'kennedy',x:35,z:18,w:25,d:18,lawnW:18,lawnD:12},
] as const;
export const WEST_APPROACH = [[-86,-88],[-81,-71],[-70,-52],[-60,-44],[-48,-47],[-36,-61]] as const;
export const WEST_WALKS = [
  [[-84,-65],[-69,-65],[-54,-65],[-38,-63]],
  [[-60,-44],[-49,-43],[-39,-44],[-28,-47]],
  [[-33.1,-4.4],[-33.1,0],[-28,5],[-19,8]],
] as const;
export const GARDEN_EXIT = [-38,-23] as const;
export const GARDEN_ENTRANCE = [-39,-23] as const;
