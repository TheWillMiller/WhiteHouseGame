// Game coordinates: north is -Z. The supplied aerial reference is rotated
// south-up. These are approximate relationships, not surveyed dimensions.
export const GARDENS = [
  {id:'rose',x:-43.5,z:-5.8,w:34,d:21,lawnW:28,lawnD:14.5},
  {id:'kennedy',x:41,z:-5,w:25,d:18,lawnW:18,lawnD:12},
] as const;
export const WEST_APPROACH = [[-114,-88],[-106,-67],[-92,-42],[-89,-30],[-70,-35],[-38,-56]] as const;
export const WEST_WALKS = [
  [[-84,-65],[-69,-65],[-54,-65],[-38,-63]],
  [[-89,-30],[-75,-32],[-55,-38],[-28,-47]],
  [[-46,5],[-46,11],[-28,13],[-19,14]],
] as const;
export const GARDEN_EXIT = [-56.5,-20.3] as const;
export const GARDEN_ENTRANCE = [-56.5,-20.3] as const;
