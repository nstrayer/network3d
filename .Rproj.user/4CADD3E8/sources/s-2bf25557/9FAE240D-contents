const generateEdgePositions = require('./GenerateEdgePositions.js');

// construct mesh for the edges between nodes
module.exports = function buildEdges({nodes, links, color, opacity, width}){
  const geometry = new THREE.BufferGeometry();

  const edge_locations = generateEdgePositions(nodes, links);

  const material = new THREE.LineBasicMaterial( {
          color,
          opacity,
          transparent: true,
          linewidth: width,
        } );

  // send locations vector to the geometry buffer.
  geometry.addAttribute( 'position', new THREE.BufferAttribute( edge_locations, 3 ) );

  return new THREE.LineSegments( geometry, material);
};
