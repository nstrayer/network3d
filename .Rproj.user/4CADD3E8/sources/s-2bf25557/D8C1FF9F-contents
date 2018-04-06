const default_settings = {
  enableDamping:true,       // For that slippery Feeling
  dampingFactor:0.12,       // Needs to call update on render loop
  rotateSpeed:0.08,         // Rotate speed
  panSpeed: 0.05,           // How fast panning happens
  autoRotate:false,          // turn this guy to true for a spinning camera
  autoRotateSpeed:0.2,      // how fast should it spin
  mouseButtons: {           // Button controls for controlling.
    ORBIT: THREE.MOUSE.RIGHT,
    ZOOM: THREE.MOUSE.MIDDLE,
    PAN: THREE.MOUSE.LEFT
  }
};

module.exports = function setupControls(camera, renderer, camera_settings){
  // overwrite the default settings with whatever the user has provided in addition.
  const settings = Object.assign({},default_settings, camera_settings);

  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // assign settings to controls
  for(let setting in settings){
    controls[setting] = settings[setting];
  }

  // target center of world for controls orbit point. (this gets updated with center of mesh later)
  controls.target.set( 0,0,0 );

  return controls;
};
