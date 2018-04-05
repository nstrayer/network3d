// raycaster with given resolution
module.exports = function setupRaycaster(raycast_res){
  console.log('res', raycast_res);
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = raycast_res;
  return raycaster;
};
