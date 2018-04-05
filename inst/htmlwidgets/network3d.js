(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
const generateEdgePositions = require('./GenerateEdgePositions.js');

// construct mesh for the edges between nodes
module.exports = function buildEdges({nodes, links, color, opacity, width}){
  const geometry = new THREE.BufferGeometry();

  const edge_locations = generateEdgePositions(nodes, links);

  const material = new THREE.LineBasicMaterial( {
          color,
          opacity,
          transparent: true,
          linewidth: width,
        } );

  // send locations vector to the geometry buffer.
  geometry.addAttribute( 'position', new THREE.BufferAttribute( edge_locations, 3 ) );

  return new THREE.LineSegments( geometry, material);
};

},{"./GenerateEdgePositions.js":3}],2:[function(require,module,exports){
const generatePointPositions = require('./GeneratePointPositions.js');
const makeNodeMaterial = require('./MakeNodeMaterial.js');

// construct mesh for the nodes.
module.exports = function buildNodes({nodes, nodeColors, nodeSizes, blackOutline}){
  // fill in a blank geometry object with the vertices from our points
  const geometry = new THREE.BufferGeometry(),
        locations = generatePointPositions(nodes),
        material = makeNodeMaterial(blackOutline),
        colorsCopy = new Float32Array([...nodeColors]), // need immutable copies of these guys to not overwrite static defaults
        sizesCopy = new Float32Array([...nodeSizes]);

  geometry.addAttribute('position', new THREE.BufferAttribute( locations, 3 ) );
  geometry.addAttribute('color',    new THREE.BufferAttribute( colorsCopy, 3 ) );
  geometry.addAttribute('size',     new THREE.BufferAttribute( sizesCopy, 1 ) );

  // need to run this so we get a center to aim our camera at.
  geometry.computeBoundingSphere();

  // wrap geometry in material and return along with center
  return new THREE.Points(geometry, material);
};

},{"./GeneratePointPositions.js":4,"./MakeNodeMaterial.js":6}],3:[function(require,module,exports){
// returns typed array for the buffer geometry position
module.exports = function generateEdgePositions(nodes, links){
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
};

},{}],4:[function(require,module,exports){
// same but for the nodes/points
module.exports = function generatePointPositions(nodes){
  const num_points = nodes.length,
        point_locations = new Float32Array(num_points*3);

  let vertex;

  for (let i = 0; i < num_points; i ++ ) {
    vertex = nodes[i];
    point_locations[i*3]     = vertex.cx || 0;
    point_locations[i*3 + 1] = vertex.cy || 0;
    point_locations[i*3 + 2] = vertex.cz || 0;
  }

  return point_locations;
};

},{}],5:[function(require,module,exports){
module.exports = function generatePointStaticAttrs(nodes, constants){
  const num_points = nodes.length,
        color = new THREE.Color(),
        point_colors = new Float32Array(num_points*3),
        point_sizes = new Float32Array(num_points);
  let vertex;

  for (let i = 0; i < num_points; i ++ ) {
    vertex = nodes[i];
    // color the point
    const {r,g,b} = color.set(vertex.color);
    point_colors[i*3]     = r;
    point_colors[i*3 + 1] = g;
    point_colors[i*3 + 2] = b;

    // and sizes...
    point_sizes[i] = vertex.hub? constants.sizes.hub_size: constants.sizes.point_size;
  }
  return {colors: point_colors, sizes: point_sizes};
};

},{}],6:[function(require,module,exports){
// build custom shader material for nodes to avoid using sprites.
module.exports = function makeNodeMaterial(blackOutline){
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

  const outline_fill = blackOutline? 0.0: 1.0;
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
};

},{}],7:[function(require,module,exports){
const setupRenderer = require('./SetupRenderer.js');

//const makeTooltip = require('./MakeTooltip.js');
//const resetTooltip = require('./ResetTooltip.js');
const Tooltip = require('./Tooltip.js');

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
    this.tooltip = new Tooltip(el);

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
    if(this.iteration < this.constants.misc.max_iterations){
      // run instances of our layout simulation
      this.simulation.tick();

      // update mesh attributes.
      this.updatePositions();
      this.iteration += 1;
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

},{"./BuildEdges.js":1,"./BuildNodes.js":2,"./GenerateEdgePositions.js":3,"./GeneratePointPositions.js":4,"./GeneratePointStaticAttrs.js":5,"./SetupCamera.js":8,"./SetupControls.js":9,"./SetupRaycaster.js":10,"./SetupRenderer.js":11,"./SetupScene.js":12,"./SetupSimulation.js":13,"./Tooltip.js":14}],8:[function(require,module,exports){
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

},{}],9:[function(require,module,exports){
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

},{}],10:[function(require,module,exports){
// raycaster with given resolution
module.exports = function setupRaycaster(raycast_res){
  console.log('res', raycast_res);
  const raycaster = new THREE.Raycaster();
  raycaster.params.Points.threshold = raycast_res;
  return raycaster;
};

},{}],11:[function(require,module,exports){
 // builds out renderer object and appends it to the correct place.
module.exports = function setupRenderer({el, width, height}){
  const renderer = new THREE.WebGLRenderer({antialias: true});
  renderer.setSize(width, height);   // setup renderer for our viz size
  renderer.setPixelRatio(window.devicePixelRatio);   // retina ftw
  el.appendChild( renderer.domElement );
  return renderer;
};

},{}],12:[function(require,module,exports){
// sets up three scene with the nodes and edges
module.exports = function setupScene(nodes, edges, backgroundColor){
  const scene = new THREE.Scene();

  // color of the background of the visualization
  scene.background = backgroundColor;

  // add components of the network to the scene
  scene.add(nodes);
  scene.add(edges);
  return scene;
};

},{}],13:[function(require,module,exports){
// setup the 3d simulation code
module.exports = function setupSimulation(nodes, links, manybody_strength, link_strength){
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
};

},{}],14:[function(require,module,exports){
class tooltip {
  constructor(el){
    this.offset = 15;

    this.tip = d3.select(el)
      .append('div')
      .html('')
      .style('background', 'white')
      .style('border-radius', '10px')
      .style('padding', '0px 15px')
      .style('box-shadow', '1px 1px 3px black')
      .style('position', 'fixed')
      .style('display', 'none');
  }

  setOffset(offset){
    this.offset = offset;
  }

  hide(){
    this.tip
    .style('display', 'none')
    .style('top', -1000)
    .style('left', -1000);
  }

  update(body, mousePos){
    this.tip
      .html(`<h3>${body}</h3>`)
      .style('top',  `${mousePos.y + this.offset}px`)
      .style('left', `${mousePos.x + this.offset}px`)
      .style('display', 'block');
  }
}


module.exports = tooltip;

},{}],15:[function(require,module,exports){
const PhewasNetwork = require('./PhewasNetwork.js');

HTMLWidgets.widget({

  name: 'network3d',

  type: 'output',

  factory: function(el, width, height) {

    const plot = new PhewasNetwork(el, width, height);

    return {

      renderValue: function(x) {

        const data = {
          edges: HTMLWidgets.dataframeToD3(x.data.edges),
          vertices: HTMLWidgets.dataframeToD3(x.data.vertices),
        };

        plot.addData({data, settings:x.settings});

        console.log('rendering!');

      },

      resize: function(width, height) {
        plot.resize(width, height);
      }

    };
  }
});

},{"./PhewasNetwork.js":7}]},{},[15]);
