module.exports = function generatePointStaticAttrs(nodes, constants){
  const num_points = nodes.length,
        color = new THREE.Color(),
        point_colors = new Float32Array(num_points*3),
        point_sizes = new Float32Array(num_points);
  let vertex;

  for (let i = 0; i < num_points; i ++ ) {
    vertex = nodes[i];
    // color the point
    const {r,g,b} = color.set(vertex.color);
    point_colors[i*3]     = r;
    point_colors[i*3 + 1] = g;
    point_colors[i*3 + 2] = b;

    // and sizes...
    point_sizes[i] = vertex.hub? constants.sizes.hub_size: constants.sizes.point_size;
  }
  return {colors: point_colors, sizes: point_sizes};
};
