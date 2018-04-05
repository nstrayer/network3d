 // builds out renderer object and appends it to the correct place.
module.exports = function setupRenderer({el, width, height}){
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);   // setup renderer for our viz size
  renderer.setPixelRatio(window.devicePixelRatio);   // retina ftw
  el.appendChild( renderer.domElement );
  return renderer;
};
