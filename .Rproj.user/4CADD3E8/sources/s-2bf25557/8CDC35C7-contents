// same but for the nodes/points
module.exports = function generatePointPositions(nodes){
  const num_points = nodes.length,
        point_locations = new Float32Array(num_points*3);

  let vertex;

  for (let i = 0; i < num_points; i ++ ) {
    vertex = nodes[i];
    point_locations[i*3]     = vertex.cx || 0;
    point_locations[i*3 + 1] = vertex.cy || 0;
    point_locations[i*3 + 2] = vertex.cz || 0;
  }

  return point_locations;
};
