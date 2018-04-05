// sets up three scene with the nodes and edges
module.exports = function setupScene(nodes, edges, backgroundColor){
  const scene = new THREE.Scene();

  // color of the background of the visualization
  scene.background = backgroundColor;

  // add components of the network to the scene
  scene.add(nodes);
  scene.add(edges);
  return scene;
};
