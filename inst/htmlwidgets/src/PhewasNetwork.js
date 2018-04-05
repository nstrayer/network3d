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

class phewasNetwork{
  constructor(el, width, height){
    this.width = width;
    this.height = height;

    this.constants = {
      colors: {                    // Colors of chart
        background: 'white',        // background of the chart
        edge: 0xbababa,             // edges between nodes
      },
      sizes: {                     // Sizes of chart components (graph spans cube from -1 to 1)
        point_size: 0.1,            // Normal node diameter
        hub_size: 0.3,              // Hub diameter
        selection_size_mult: 1.5,   // How much nodes grow when selected
        edge_width: 0.008,          // Thickness of lines connecting nodes
      },
      camera: {                   // Camera settings
        setup: {                   // Initializations
          fov: 65,                  // Field of view
          aspect: width/height,     // Aspect ratio of view
          near: 0.1,                // object will get clipped if they are closer than 1 world unit
          far: 100,                 // and will fade away if they are further than 1000 units away
        },
        start_pos: { x: 1.2, y: 1.2, z: 2 }, // 3d position of camera on load
        center: { x: 0.5, y: 0.5, z: 0.5 }   // position around which the camera rotates.
      },
      controls: {                // Controls
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
        },
      },
      misc: {                    // Other settings
        node_outline_black: true, // Outline the node circles in black? Default is white
        background_color: 'white',// Color of background
        raycast_res: 0.05,         // Thickness of invisible raycasting selection beam
        edge_color: 0xbababa,     // edges between nodes
        edge_opacity: 0.1,        // How transparent should our node connections be
        interactive: true,        // Turn off all interactivity with the network?
        tooltip_offset: 20,       // Tooltip that shows whatever's in the 'name' field should be offset by how much?
        select_all: true,        // do we show tooltip for every node or just the 'hub' nodes?
        max_iterations: 250,      // Number of iterations the layout simulation runs
        manybody_strength: -1,    // Attractive force between nodes irrespective of links
        link_strength: null,      // attractive force of links. Falsy values default to a function of number of connections.
        show_simulation_progress: true, // show small popup while layout is being calculated?
      }
    };
    this.manybody_strength = -1;
    this.static_length_strength = true;
    this.link_strength = 1;

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
  updateSim(manybody, link){

    const manybody_strength = this.manybody_strength;
    const link_strength = this.link_strength;
    const static_links = this.static_length_strength;

    this.simulation
      .force("link",
        static_links ?
          d3.forceLink(this.links).id(d => d.id).strength(link_strength):
          d3.forceLink(this.links).id(d => d.id)
      )
      .force("charge",
        d3.forceManyBody()
          .strength(manybody_strength)
      )
      .alpha(1);

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
    size_attributes[index]  = this.nodeSizes[index]*this.constants.sizes.selection_size_mult;

    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
  }

  // function called to kick off visualization with data.
  addData({data, settings}){

    // check if we've already got a scene going
    if(this.node_mesh) this.resetViz();

    // extract node and link data
    this.nodes = data.vertices.map(d => ({
      id: d.id,
      name: d.name || null,
      color: d.color,
    }));

    this.links = data.edges;

    // Overwrite default constants if R supplies new ones.
    for(let section in this.constants){
      Object.assign(this.constants[section], settings[section]);
    }

    this.max_iterations = this.constants.misc.max_iterations;

    // Setup tooltip offset
    this.tooltip.setOffset(this.constants.misc.tooltip_offset);

    // Initialize a color and size vectors once as they are (relatively) static.
    const {colors: nodeColors, sizes: nodeSizes} = generatePointStaticAttrs(this.nodes, this.constants);
    this.nodeColors = nodeColors;
    this.nodeSizes = nodeSizes;

    // initialize our simulation object and perform one iteration to get link data in proper form
    this.simulation = setupSimulation(
      this.nodes, this.links,
      this.constants.misc.manybody_strength,
      this.constants.misc.link_strength
    );

    // Building the visualization
    // --------------------------------------------------------------
    // Set up edges between cases and hubs
    this.link_mesh = buildEdges({
      nodes: this.nodes,
      links: this.links,
      color: this.constants.misc.edge_color,
      opacity: this.constants.misc.edge_opacity,
      width: this.constants.misc.edge_width,
    });

    // --------------------------------------------------------------
    // Set up points/nodes representing cases and hubs
    this.node_mesh = buildNodes({
      nodes: this.nodes,
      nodeColors: this.nodeColors,
      nodeSizes: this.nodeSizes,
      blackOutline: this.constants.misc.node_outline_black
    });

    // --------------------------------------------------------------
    // Initialize the 'scene' and add our geometries we just made
    this.scene = setupScene(this.node_mesh, this.link_mesh, this.color.set(this.constants.misc.background_color));

    // --------------------------------------------------------------
    // Setup camera to actually see our scene. Point it at middle of network
    this.camera = setupCamera(this.constants.camera);

    // --------------------------------------------------------------
    // Raycaster for selecting points.
    this.raycaster = setupRaycaster(this.constants.misc.raycast_res);

    // setup a mousemove event to keep track of mouse position for raycaster.
    this.canvas.addEventListener( 'mousemove', this.onMouseOver.bind(this), false );

    // --------------------------------------------------------------
    // Attach some controls to our camera and renderer
    this.controls = setupControls(this.camera, this.renderer, this.constants.controls);

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
      if(this.constants.misc.show_simulation_progress){
        // if this is our last iteration we should hide the progress
        if(this.iteration === this.max_iterations){
         this.simulation_progress.hide();
        } else {
          // otherwise let's increment it.
          this.simulation_progress.update(this.iteration);
        }
      }
    }

    if(this.constants.misc.interactive){
        // update our raycaster with current mouse position
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // figure out what points it intersects
      const intersects = this.raycaster.intersectObject(this.node_mesh);
      const anyPointsSelected = intersects.length > 0;

      if(anyPointsSelected){
        // find all nodes intersected that the user want's selected
        const intersectedNodes = intersects
          .map(d => Object.assign({},this.nodes[d.index], {node_index: d.index}))
          .filter(d => d.selectable || this.constants.misc.select_all);

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
