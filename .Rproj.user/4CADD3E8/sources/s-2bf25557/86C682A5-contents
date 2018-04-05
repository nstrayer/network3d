// sets up camera with supplied constants.
module.exports = function setupCamera(settings){
  const camera = new THREE.PerspectiveCamera();

  // setup camera with constants
  for(let setting in settings.setup){
    camera[setting] = settings.setup[setting];
  }
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
