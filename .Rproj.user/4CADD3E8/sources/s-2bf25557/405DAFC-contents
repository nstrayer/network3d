const default_settings = {
  setup: {                   // Initializations
      fov: 65,                  // Field of view
      near: 0.1,                // object will get clipped if they are closer than 1 world unit
      far: 100,                 // and will fade away if they are further than 1000 units away
    },
    start_pos: { x: 1.2, y: 1.2, z: 2 }, // 3d position of camera on load
    center: { x: 0.5, y: 0.5, z: 0.5 }   // position around which the camera rotates.
};

// sets up camera with supplied constants.
module.exports = function setupCamera(user_settings, width, height){
  const camera = new THREE.PerspectiveCamera();

  // overwrite the default settings with whatever the user has provided in addition.
  const settings = Object.assign({}, default_settings, user_settings);

  // setup camera with constants
  for(let setting in settings.setup){
    camera[setting] = settings.setup[setting];
  }
  camera.aspect = width/height;

  // update projection matrix to apply changes in settings
  camera.updateProjectionMatrix();

  // position camera
  const sp = settings.start_pos;
  camera.position.set(sp.x,sp.y,sp.z);

  // point camera at center of the network
  const cnt = settings.center;
  camera.lookAt(new THREE.Vector3(cnt.x,cnt.y,cnt.z));

  return camera;
};
