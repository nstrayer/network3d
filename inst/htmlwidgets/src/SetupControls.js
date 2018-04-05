module.exports = function setupControls(camera, renderer, camera_settings){
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // assign settings to controls
  for(let setting in camera_settings){
    controls[setting] = camera_settings[setting];
  }

  // target center of world for controls orbit point. (this gets updated with center of mesh later)
  controls.target.set( 0,0,0 );

  return controls;
};
