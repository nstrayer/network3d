const setupRenderer = require('./SetupRenderer.js');

const Tooltip = require('./Tooltip.js');
const ProgressMessage = require('./ProgressMessage.js');

const generatePointPositions = require('./GeneratePointPositions.js');
const generateEdgePositions = require('./GenerateEdgePositions.js');
const generatePointStaticAttrs = require('./GeneratePointStaticAttrs.js');

const buildEdges = require('./BuildEdges.js');
const buildNodes = require('./BuildNodes.js');

const setupSimulation = require('./SetupSimulation.js');
const setupScene = require('./SetupScene.js');
const setupCamera = require('./SetupCamera.js');
const setupRaycaster = require('./SetupRaycaster.js');
const setupControls = require('./SetupControls.js');

const calcConnectionCounts = require('./CalcConnectionCounts.js');
const makeLinkNodeStrengths = require('./MakeLinkNodeStrengths.js');

class phewasNetwork{
  constructor(el, width, height){
    this.width = width;
    this.height = height;

    this.manybody_strength = -1;
    this.link_strength = 0;
    this.static_length_strength = false;

    // setup vector for holding mouse position for raycaster
    this.mouse = new THREE.Vector2(100, 100);

    // also keep track of the raw positition for placing tooltip.
    this.mouseRaw = {x:0, y:0};
    this.currentlySelected = null; // Keep track of what node is selected.

    // scales to normalize projections to avoid messing with camera.
    this.x_scale = d3.scaleLinear().range([-1,1]);
    this.y_scale = d3.scaleLinear().range([-1,1]);
    this.z_scale = d3.scaleLinear().range([-1,1]);

    // node and link data holders
    this.nodes = [];
    this.links = [];
    this.node_mesh = null;
    this.link_mesh = null;

    // node geometry color and size defaults so we only calc once
    this.nodeColors = null;
    this.nodeSizes = null;

    // keep track of iteration so we can stop simulation eventually
    this.iteration = 0;
    this.max_iterations = 1;

    // initialize the renderer since it doesn't need anything passed to it to start
    this.renderer = setupRenderer({el, width, height});

    // selection of the canvas we're rendering for accurate raycasting
    this.canvas = el.querySelector("canvas");

    // append a small div to act as our tooltip
    this.tooltip = new Tooltip(el);

    this.simulation_progress = new ProgressMessage(el);

    // three color object for generating color vectors
    this.color = new THREE.Color();
  }

  // sets mouse location for the scene for interaction with raycaster
  onMouseOver(event){
    this.mouse.x =   (event.offsetX / this.width)  * 2 - 1;
    this.mouse.y = - (event.offsetY / this.height) * 2 + 1;
    this.mouseRaw.x = event.clientX;
    this.mouseRaw.y = event.clientY;
  }

  // brings projection into a -1,1 range for ease of viewing.
  normalizeProjection(){
    this.x_scale.domain(d3.extent(this.nodes, d => d.x));
    this.y_scale.domain(d3.extent(this.nodes, d => d.y));
    this.z_scale.domain(d3.extent(this.nodes, d => d.z));

    this.nodes.forEach(node => {
      node.cx = this.x_scale(node.x);
      node.cy = this.y_scale(node.y);
      node.cz = this.z_scale(node.z);
    });
  }

  // generate the new position attribute vector for point and line meshes
  updatePositions(){
    // normalize the data after layout step
    this.normalizeProjection();

    this.node_mesh.geometry.attributes.position.array = generatePointPositions(this.nodes);
    this.link_mesh.geometry.attributes.position.array = generateEdgePositions(this.nodes, this.links);

    // recompute bounding sphere for camera centering.
    this.node_mesh.geometry.computeBoundingSphere();

    // let the scene know the meshes have updated positions.
    this.node_mesh.geometry.attributes.position.needsUpdate = true;
    this.link_mesh.geometry.attributes.position.needsUpdate = true;
  }

  // Re-assigns the default color and size values to the nodes
  resetNodeColorSize(){
    this.node_mesh.geometry.attributes.color.array = new Float32Array([...this.nodeColors]);
    this.node_mesh.geometry.attributes.size.array = new Float32Array([...this.nodeSizes]);

    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
  }

  // cleanup the buffers and reset simulation count when new data is added
  resetViz(){
    this.node_mesh.geometry.dispose();
    this.link_mesh.geometry.dispose();
    // reset the iteration count so new data can be layout-ed
    this.iteration = 0;
  }

  // update simulation constants
  updateSim(){


    const {
      link_strength_func,
      node_strength_func,
    } = makeLinkNodeStrengths(
      this.manybody_strength,
      this.link_strength,
      this.static_length_strength,
      this.connection_counts
    );

    this.simulation
      .force("link", link_strength_func(this.links))
      .force("charge", node_strength_func)
      .alpha(1); // this reset the simulation heat to it goes again.

    this.iteration = 0;
  }

  resize(width, height) {
    this.renderer.setSize(width, height);
    this.width = width;
    this.height = height;
  }

  // highlight and expand a given node
  expandNode(index){
    const color_attributes = this.node_mesh.geometry.attributes.color.array,
          size_attributes = this.node_mesh.geometry.attributes.size.array;

    const to255 = (proportion) => Math.round(proportion*255);
    const toProp = (full) => full/255;
    const brighter = d3.color(`rgb(${to255(this.nodeColors[index*3])}, ${to255(this.nodeColors[index*3 + 1])}, ${to255(this.nodeColors[index*3 + 2])})`)
    .darker();

    color_attributes[index*3]     = toProp(brighter.r);
    color_attributes[index*3 + 1] = toProp(brighter.g);
    color_attributes[index*3 + 2] = toProp(brighter.b);
    size_attributes[index]  = this.nodeSizes[index]*this.selection_size_mult;

    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
  }

  // function called to kick off visualization with data.
  //addData({data, settings, user_camera_settings, user_control_settings}){
  addData(x){

    // check if we've already got a scene going
    if(this.node_mesh) this.resetViz();

    // extract node and link data
    this.nodes = x.data.vertices;
    this.links = x.data.edges;
    // build connection count object
    this.connection_counts = calcConnectionCounts(this.links);

    // Assign some helpful constants for other methods to use.
    this.interactive = x.interactive;
    this.select_all = x.select_all;
    this.selection_size_mult = x.selection_size_mult;
    this.show_simulation_progress = x.show_simulation_progress;
    this.max_iterations = x.max_iterations;

    this.manybody_strength = x.manybody_strength;
    this.link_strength = x.link_strength;
    this.static_length_strength = x.static_length_strength;


    // Setup tooltip offset
    this.tooltip.setOffset(x.tooltip_offset);

    // Initialize a color and size vectors once as they are (relatively) static.
    const {colors: nodeColors, sizes: nodeSizes} = generatePointStaticAttrs(this.nodes, x.node_size);
    this.nodeColors = nodeColors;
    this.nodeSizes = nodeSizes;

    // initialize our simulation object and perform one iteration to get link data in proper form
    this.simulation = setupSimulation(
      this.nodes, this.links,
      this.connection_counts,
      this.manybody_strength,
      this.link_strength,
      this.static_length_strength
    );

    // Building the visualization
    // --------------------------------------------------------------
    // Set up edges between cases and hubs
    this.link_mesh = buildEdges({
      nodes: this.nodes,
      links: this.links,
      color: x.edge_color,
      opacity: x.edge_opacity,
      width: x.edge_width,
    });

    // --------------------------------------------------------------
    // Set up points/nodes representing cases and hubs
    this.node_mesh = buildNodes({
      nodes: this.nodes,
      nodeColors: this.nodeColors,
      nodeSizes: this.nodeSizes,
      blackOutline: x.node_outline_black
    });

    // --------------------------------------------------------------
    // Initialize the 'scene' and add our geometries we just made
    this.scene = setupScene(this.node_mesh, this.link_mesh, this.color.set(x.background_color));

    // --------------------------------------------------------------
    // Setup camera to actually see our scene. Point it at middle of network
    this.camera = setupCamera(x.user_camera_settings, this.width, this.height);

    // --------------------------------------------------------------
    // Raycaster for selecting points.
    this.raycaster = setupRaycaster(x.raycast_res);

    // setup a mousemove event to keep track of mouse position for raycaster.
    this.canvas.addEventListener( 'mousemove', this.onMouseOver.bind(this), false );

    // --------------------------------------------------------------
    // Attach some controls to our camera and renderer
    this.controls = setupControls(this.camera, this.renderer, x.user_control_settings);

    // --------------------------------------------------------------
    // Run the renderer!
    this.render();
  }

  // Reset interaction
  hideTooltipSelection(){
    // reset tooltip
    this.tooltip.hide();

    // unselect nodes visually
    this.resetNodeColorSize();

    // undo selected internally
    this.currentlySelected = null;
  }


  // main render function. This gets called repeatedly
  render(){
    // request animation frame for continued running
    requestAnimationFrame(() => this.render());

    // Only iterate through the layout for a given number of steps.
    if(this.iteration < this.max_iterations){
      // run instances of our layout simulation
      this.simulation.tick();

      // update mesh attributes.
      this.updatePositions();
      this.iteration += 1;

      // does the user want a progress message
      if(this.show_simulation_progress){
        // if this is our last iteration we should hide the progress
        if(this.iteration === this.max_iterations){
         this.simulation_progress.hide();
        } else {
          // otherwise let's increment it.
          this.simulation_progress.update(this.iteration);
        }
      }
    }


    if(this.interactive){
        // update our raycaster with current mouse position
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // figure out what points it intersects
      const intersects = this.raycaster.intersectObject(this.node_mesh);
      const anyPointsSelected = intersects.length > 0;

      if(anyPointsSelected){
        // find all nodes intersected that the user want's selected
        const intersectedNodes = intersects
          .map(d => Object.assign({},this.nodes[d.index], {node_index: d.index}))
          .filter(d => d.selectable || this.select_all);

        const applicablePointsSelected = intersectedNodes.length !== 0;

        if(applicablePointsSelected){
          const newSelection = intersectedNodes[0];
          const noPreviousSelection = this.currentlySelected === null;
          const differentFromLastSelection = noPreviousSelection || (newSelection.name !== this.currentlySelected.name);

          if(differentFromLastSelection){
            // reset the sizes of the other nodes
            this.resetNodeColorSize();
          }

          if(noPreviousSelection || differentFromLastSelection){
            // set our selection with the new one
            this.currentlySelected = newSelection;
          }

          // expand selected node
          this.expandNode(this.currentlySelected.node_index);

          // update tooltip with name of node.
          this.tooltip.update(this.currentlySelected.name, this.mouseRaw);

        } else {
          // if this is the first frame without something selected, reset the sizes
          if(this.currentlySelected){
            this.hideTooltipSelection();
          }
        }
      } else {
         this.hideTooltipSelection();
      }
    }

    // Grab new position from controls (if user has dragged, etc)
    this.controls.update();

    // actually draw to the screen!
    this.renderer.render(this.scene, this.camera);
  }
}

module.exports = phewasNetwork;
