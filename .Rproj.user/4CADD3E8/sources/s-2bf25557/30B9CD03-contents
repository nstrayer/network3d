// build custom shader material for nodes to avoid using sprites.
function makeNodeMaterial(constants){
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

  const outline_fill = constants.node_outline_black ? 0.0: 1.0;
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
}

 // builds out renderer object and appends it to the correct place.
function makeRenderer({el, width, height}){
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);   // setup renderer for our viz size
  renderer.setPixelRatio(window.devicePixelRatio);   // retina ftw
  el.appendChild( renderer.domElement );
  return renderer;
}

// returns typed array for the buffer geometry position
function generate_edge_positions(nodes, links){
  const num_edges = links.length;
  const edge_locations = new Float32Array(num_edges*6);

  for(let i=0; i<num_edges; i++){
    // get vertex ids for start and end of edge
    const link = links[i];
    const source = link.source.index;
      const target = link.target.index;
      const {cx:xs,cy:ys,cz:zs} = nodes[source];
      const {cx:xe,cy:ye,cz:ze} = nodes[target];

      // fill in edge locations
      edge_locations[i*6]     = xs;
      edge_locations[i*6 + 1] = ys;
      edge_locations[i*6 + 2] = zs;

      edge_locations[i*6 + 3] = xe;
      edge_locations[i*6 + 4] = ye;
      edge_locations[i*6 + 5] = ze;

  }
  return edge_locations;
}

// same but for the nodes/points
function generate_point_attributes(nodes, plot_colors, constants){
  const num_points = nodes.length,
        color = new THREE.Color(),
        point_locations = new Float32Array(num_points*3),
        point_colors = new Float32Array(num_points*3),
        point_sizes = new Float32Array(num_points);
  let vertex;


  for (let i = 0; i < num_points; i ++ ) {
    vertex = nodes[i];
    point_locations[i*3]     = vertex.cx;
    point_locations[i*3 + 1] = vertex.cy;
    point_locations[i*3 + 2] = vertex.cz;

    // color the point
    const {r,g,b} = plot_colors[vertex.hub ? 'hub' : vertex.subtype ? 'subtype': 'point'];
    point_colors[i*3]     = r;
    point_colors[i*3 + 1] = g;
    point_colors[i*3 + 2] = b;

    // and sizes...
    point_sizes[i] = vertex.hub? constants.sizes.hub_size: constants.sizes.point_size;
  }
  return {locations: point_locations, colors: point_colors, sizes: point_sizes};
}

// construct mesh for the edges between nodes
function buildEdges(nodes, links, constants){
  const geometry = new THREE.BufferGeometry(),
        edge_locations = generate_edge_positions(nodes, links),
        material = new THREE.LineBasicMaterial( {
          color: constants.colors.edge,
          opacity: constants.misc.edge_opacity,
          transparent: true,
          linewidth: constants.sizes.edge_width,
        } );

  // send locations vector to the geometry buffer.
  geometry.addAttribute( 'position', new THREE.BufferAttribute( edge_locations, 3 ) );

  return new THREE.LineSegments( geometry, material);
}

// construct mesh for the nodes.
function buildNodes(nodes, plot_colors, constants){
  // fill in a blank geometry object with the vertices from our points
  const geometry = new THREE.BufferGeometry(),
        {locations, colors, sizes} = generate_point_attributes(nodes, plot_colors, constants);
        material = makeNodeMaterial(constants);

  geometry.addAttribute('position', new THREE.BufferAttribute( locations, 3 ) );
  geometry.addAttribute('color',    new THREE.BufferAttribute( colors,    3 ) );
  geometry.addAttribute('size',     new THREE.BufferAttribute( sizes,     1 ) );

  // need to run this so we get a center to aim our camera at.
  geometry.computeBoundingSphere();

  // wrap geometry in material and return along with center
  return new THREE.Points(geometry, material);
}

// sets up three scene with the nodes and edges
function setupScene(plot_colors, nodes, edges){
  const scene = new THREE.Scene();

  // color of the background of the visualization
  scene.background = plot_colors.background;

  // add components of the network to the scene
  scene.add(nodes);
  scene.add(edges);
  return scene;
}

// sets up camera with supplied constants.
function setupCamera(settings){
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
}

// controls
function setupControls(camera, renderer, constants){
  const controls = new THREE.OrbitControls(camera, renderer.domElement);

  // assign settings to controls
  for(let setting in constants.controls){
    controls[setting] = constants.controls[setting];
  }

  const cnt = constants.camera.center;
  controls.target.set( cnt.x,cnt.y,cnt.z );

  return controls;
}

// raycaster with given resolution
function makeRaycaster(constants){
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = constants.sizes.raycast_res;
  return raycaster;
}

// makes a three friendly plot colors object
function makePlotColors(colors){
  const plot_colors = {};
  for (let type in colors){
    plot_colors[type] = new THREE.Color(colors[type]);
  }
  return plot_colors;
}

// setup the 3d simulation code
function setupSimulation(nodes, links, manybody_strength, link_strength){
   const sim = d3.forceSimulation()
    .numDimensions(3)
    .nodes(nodes)
    .force("link",
      link_strength === null ?
        d3.forceLink(links).id(d => d.id):
        d3.forceLink(links).id(d => d.id).strength(link_strength)
    )
    .force("charge",
      d3.forceManyBody()
        .strength(manybody_strength)
    );

  sim.tick(); // kick off a single iteration to get data into correct form

  return sim;
}

function makeTooltip(el){
  return d3.select(el)
      .append('div')
      .html('')
      .style('background', 'white')
      .style('border-radius', '10px')
      .style('padding', '0px 15px')
      .style('box-shadow', '1px 1px 3px black')
      .style('position', 'fixed')
      .style('display', 'none');
}

function resetTooltip(tooltip){
  tooltip
    .style('display', 'none')
    .style('top', -1000)
    .style('left', -1000);
}

class phewasNetwork{
  constructor(el, width, height){
    this.width = width;
    this.height = height;

    this.constants = {
      colors: {                    // Colors of chart
        background: 'white',        // background of the chart
        point: 0x8da0cb,            // default points (no hub or subtype)
        selected_point:'red',       // selected subtype or hub
        hub: 0x66c2a5,              // the nodes with hub = true
        selected_hub:'green',       // hub nodes when selected
        subtype: 0xfc8d62,          // normal points when they are subtypes
        selected_subtype: 'purple', // subtype nodes when they are selected
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

    // keep track of iteration so we can stop simulation eventually
    this.iteration = 0;
    this.max_iterations = 1;

    // initialize the renderer since it doesn't need anything passed to it to start
    this.renderer = makeRenderer({el, width, height});
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

  updateMeshes(){
    // generate the new attribute vectors for the point and line meshes
    const {
      locations: p_l,
      colors: p_c,
      sizes: p_s,
    } = generate_point_attributes(this.nodes, this.plot_colors, this.constants);
    this.node_mesh.geometry.attributes.position.array = p_l;
    this.node_mesh.geometry.attributes.color.array = p_c;
    this.node_mesh.geometry.attributes.size.array = p_s;

    this.link_mesh.geometry.attributes.position.array = generate_edge_positions(this.nodes, this.links);

    // recompute bounding sphere for camera centering.
    this.node_mesh.geometry.computeBoundingSphere();

    // let the scene know the meshes need to be updated.
    this.node_mesh.geometry.attributes.position.needsUpdate = true;
    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
    this.link_mesh.geometry.attributes.position.needsUpdate = true;
  }

  colorSizeChooser({hub, subtype}, selected){
      const colors = this.plot_colors,
            sizes = this.constants.sizes;

      let color, size;

      if(hub){
        color = colors[`${selected?'selected_':''}hub`];
        size = sizes['hub_size'];
      } else {
        color = colors[`${selected?'selected_':''}${subtype?'subtype':'point'}`];
        size = sizes['point_size'];
      }
      if(selected){
        size *= sizes.selection_size_mult;
      }
      return [color, size];
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
      this.updateMeshes();
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
            this.updateMeshes();
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
            this.updateMeshes();
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
      subtype: d.subtype
    }));
    this.links = data.edges.map(d => ({source: d.from, target: d.to}));

    // Overwrite default constants if R supplies new ones.
    for(let section in this.constants){
      Object.assign(this.constants[section], settings[section]);
    }

    // Initialize a color object for later node coloring.
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
    this.node_mesh = buildNodes(this.nodes, this.plot_colors, this.constants);
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
    const color_attributes = this.node_mesh.geometry.attributes.color.array,
          size_attributes = this.node_mesh.geometry.attributes.size.array,
          [color, size] = this.colorSizeChooser(this.nodes[index], true);

    color_attributes[index*3]     = color.r;
    color_attributes[index*3 + 1] = color.g;
    color_attributes[index*3 + 2] = color.b;
    size_attributes[index] = size;

    this.node_mesh.geometry.attributes.color.needsUpdate = true;
    this.node_mesh.geometry.attributes.size.needsUpdate = true;
  }

}

HTMLWidgets.widget({

  name: 'bipartiteNetwork',

  type: 'output',

  factory: function(el, width, height) {

    const plot = new phewasNetwork(el, width, height);

    return {

      renderValue: function(x) {

        const data = {
          edges: HTMLWidgets.dataframeToD3(x.data.edges),
          vertices: HTMLWidgets.dataframeToD3(x.data.vertices),
        };

        plot.drawPlot({data, settings: x.settings});

      },

      resize: function(width, height) {
        plot.resize(width, height);
      }

    };
  }
});
