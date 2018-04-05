const setupRenderer = require('./SetupRenderer.js');
const makeTooltip = require('./MakeTooltip.js');

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
        raycast_res: 0.1,           // Thickness of invisible raycasting selection beam
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
        autoRotate:true,          // turn this guy to true for a spinning camera
        autoRotateSpeed:0.2,      // how fast should it spin
        mouseButtons: {           // Button controls for controlling.
          ORBIT: THREE.MOUSE.RIGHT,
          ZOOM: THREE.MOUSE.MIDDLE,
          PAN: THREE.MOUSE.LEFT
        },
      },
      misc: {                    // Other settings
        node_outline_black: true, // Outline the node circles in black? Default is white
        edge_opacity: 0.1,        // How transparent should our node connections be
        interactive: true,        // Turn off all interactivity with the network?
        tooltip_offset: 20,       // Tooltip that shows whatever's in the 'name' field should be offset by how much?
        select_all: false,        // do we show tooltip for every node or just the 'hub' nodes?
        max_iterations: 250,      // Number of iterations the layout simulation runs
        manybody_strength: -1,    // Attractive force between nodes irrespective of links
        link_strength: null,      // attractive force of links. Falsy values default to a function of number of connections.
      }
    };

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
    this.tooltip = makeTooltip(el);
  }

  // sets mouse location for the scene for interaction with raycaster
  onMouseOver(event){
    this.mouse.x =   (event.offsetX / this.width)  * 2 - 1;
    this.mouse.y = - (event.offsetY / this.height) * 2 + 1;
    this.mouseRaw.x = event.clientX;
    this.mouseRaw.y = event.clientY;
  }

  // brings projection into a -1,1 range for ease of viewing.
  normalize_projection(){
    this.x_scale.domain(d3.extent(this.nodes, d => d.x));
    this.y_scale.domain(d3.extent(this.nodes, d => d.y));
    this.z_scale.domain(d3.extent(this.nodes, d => d.z));

    this.nodes.forEach(node => {
      node.cx = this.x_scale(node.x);
      node.cy = this.y_scale(node.y);
      node.cz = this.z_scale(node.z);
    });
  }

  updatePositions(){
    // generate the new position attribute vector for point and line meshes
    this.node_mesh.geometry.attributes.position.array = generate_point_positions(this.nodes);
    this.link_mesh.geometry.attributes.position.array = generate_edge_positions(this.nodes, this.links);

    // recompute bounding sphere for camera centering.
    this.node_mesh.geometry.computeBoundingSphere();

    // let the scene know the meshes have updated positions.
    this.node_mesh.geometry.attributes.position.needsUpdate = true;
    this.link_mesh.geometry.attributes.position.needsUpdate = true;
  }

  resetNodeColorSize(){
    this.node_mesh.geometry.attributes.color.array = new Float32Array([...this.nodeColors]);
    this.node_mesh.geometry.attributes.size.array = new Float32Array([...this.nodeSizes]);

    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
  }

  // main render function. This gets called repeatedly
  render(){
    // request animation frame for continued running
    requestAnimationFrame(() => this.render());

    // Only iterate through the layout for a given number of steps.
    if(this.iteration < this.constants.misc.max_iterations){
      // run instances of our layout simulation
      this.simulation.tick();
      // normalize the data after layout step
      this.normalize_projection();
      // update mesh attributes.
      this.updatePositions();
      this.iteration += 1;
    }

    if(this.constants.misc.interactive){
        // update our raycaster with current mouse position
      this.raycaster.setFromCamera(this.mouse, this.camera);

      // figure out what points it intersects
      const intersects = this.raycaster.intersectObject(this.node_mesh);

      if(intersects.length > 0){
        // find all nodes intersected
        const intersectedNodes = intersects
          .map(d => Object.assign({},this.nodes[d.index], {node_index: d.index}))
          .filter(d => d.hub || this.constants.misc.select_all);

        if(intersectedNodes.length !== 0){
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

          // move tooltip over to node and change text to node title if on hub
          // expand selected node
          this.expandNode(this.currentlySelected.node_index);

          // update tooltip with name of node.
          this.tooltip
            .html(`<h3>${this.currentlySelected.name}</h3>`)
            .style('top',  `${this.mouseRaw.y + this.constants.misc.tooltip_offset}px`)
            .style('left', `${this.mouseRaw.x + this.constants.misc.tooltip_offset}px`)
            .style('display', 'block');

        } else {
          // if this is the first frame without something selected, reset the sizes
          if(this.currentlySelected){
            // reset tooltip
            resetTooltip(this.tooltip);
            // unselect nodes visually
            this.resetNodeColorSize();
            // undo selected internally
            this.currentlySelected = null;
          }
        }
      }
    }

    // Grab new position from controls (if user has dragged, etc)
    this.controls.update();

    // actually draw to the screen!
    this.renderer.render(this.scene, this.camera);
  }

  resetViz(){
    // cleanup the buffers and reset simulation count if new data is added
    this.node_mesh.geometry.dispose();
    this.link_mesh.geometry.dispose();
    // reset the iteration count so new data can be layout-ed
    this.iteration = 0;
  }


  // function called to kick off visualization with data.
  drawPlot({data, settings}){

    // check if we've already got a scene going
    if(this.node_mesh) this.resetViz();

    // extract node and link data
    this.nodes = data.vertices.map(d => ({
      id: d.index,
      name: d.name || null,
      hub: d.hub,
      subtype: d.subtype,
      color: d.color,
    }));
    this.links = data.edges.map(d => ({source: d.from, target: d.to}));

    // Overwrite default constants if R supplies new ones.
    for(let section in this.constants){
      Object.assign(this.constants[section], settings[section]);
    }

    // Initialize a color and size vectors once as they are (relatively) static.
    const {colors: nodeColors, sizes: nodeSizes} = generate_point_statics_attrs(this.nodes, this.constants);
    this.nodeColors = nodeColors;
    this.nodeSizes = nodeSizes;

    this.plot_colors = makePlotColors(this.constants.colors);

    // initialize our simulation object and perform one iteration to get link data in proper form
    this.simulation = setupSimulation(
      this.nodes, this.links,
      this.constants.misc.manybody_strength,
      this.constants.misc.link_strength
    );

    // Building the visualization
    // --------------------------------------------------------------
    // Set up edges between cases and hubs
    this.link_mesh = buildEdges(this.nodes, this.links, this.constants);
    // --------------------------------------------------------------
    // Set up points/nodes representing cases and hubs
    this.node_mesh = buildNodes(this.nodes, this.nodeColors, this.nodeSizes, this.constants);
    // --------------------------------------------------------------
    // Initialize the 'scene' and add our geometries we just made
    this.scene = setupScene(this.plot_colors, this.node_mesh, this.link_mesh);
    // --------------------------------------------------------------
    // Setup camera to actually see our scene. Point it at middle of network
    this.camera = setupCamera(this.constants.camera);
    // --------------------------------------------------------------
    // Raycaster for selecting points.
    this.raycaster = makeRaycaster(this.constants);
    // setup a mousemove event to keep track of mouse position for raycaster.
    this.canvas.addEventListener( 'mousemove', this.onMouseOver.bind(this), false );
    // --------------------------------------------------------------
    // Attach some controls to our camera and renderer
    this.controls = setupControls(this.camera, this.renderer, this.constants);
    // --------------------------------------------------------------
    // Run the renderer!
    this.render();
  }

  resize(width, height) {
    this.renderer.setSize(width, height);
    this.width = width;
    this.height = height;
  }

  // turns on and off the autorotating camera
  toggleAutoRotate(){
    this.controls.autoRotate = !this.controls.autoRotate;
  }

  // will highlight and expand a given node
  expandNode(index){
    const color_atts = this.node_mesh.geometry.attributes.color.array,
          size_attributes = this.node_mesh.geometry.attributes.size.array;

    const to255 = (proportion) => Math.round(proportion*255);
    const toProp = (full) => full/255;
    const brighter = d3.color(`rgb(${to255(this.nodeColors[index*3])}, ${to255(this.nodeColors[index*3 + 1])}, ${to255(this.nodeColors[index*3 + 2])})`)
    .darker();

    color_atts[index*3]     = toProp(brighter.r);
    color_atts[index*3 + 1] = toProp(brighter.g);
    color_atts[index*3 + 2] = toProp(brighter.b);
    size_attributes[index]  = this.nodeSizes[index]*this.constants.sizes.selection_size_mult;

    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
  }

};

module.exports = phewasNetwork;
