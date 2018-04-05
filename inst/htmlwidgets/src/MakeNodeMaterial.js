// build custom shader material for nodes to avoid using sprites.
module.exports = function makeNodeMaterial(blackOutline){
  // --------------------------------------------------------------
  // Set up custom shaders/materials
  // --------------------------------------------------------------
  const node_vertex_shader= `
attribute float size;
varying vec3 vColor;
void main() {
vColor = color;
vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
gl_PointSize = size * ( 300.0 / -mvPosition.z );
gl_Position = projectionMatrix * mvPosition;
}`;

  const outline_fill = blackOutline? 0.0: 1.0;
  const node_fragment_shader = `
varying vec3 vColor;
void main() {
float pct = distance(gl_PointCoord,vec2(0.5));
gl_FragColor = vec4(pct > 0.4 ? vec3(${outline_fill}): vColor, pct < 0.5 ? 1.0: 0.0);
}`;

  return  new THREE.ShaderMaterial( {
    vertexShader: node_vertex_shader,
    fragmentShader: node_fragment_shader,
    depthTest: false,
    transparent: true,
    vertexColors: true
  } );
};
