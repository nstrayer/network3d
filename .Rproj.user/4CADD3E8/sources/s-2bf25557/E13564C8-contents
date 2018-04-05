// returns typed array for the buffer geometry position
module.exports = function generateEdgePositions(nodes, links){
  const num_edges = links.length;
  const edge_locations = new Float32Array(num_edges*6);

  for(let i=0; i<num_edges; i++){
    // get vertex ids for start and end of edge
    const link = links[i];
    const source = link.source.index;
      const target = link.target.index;
      const {cx:xs,cy:ys,cz:zs} = nodes[source];
      const {cx:xe,cy:ye,cz:ze} = nodes[target];

      // fill in edge locations
      edge_locations[i*6]     = xs;
      edge_locations[i*6 + 1] = ys;
      edge_locations[i*6 + 2] = zs;

      edge_locations[i*6 + 3] = xe;
      edge_locations[i*6 + 4] = ye;
      edge_locations[i*6 + 5] = ze;

  }

  return edge_locations;
};
