const PhewasNetwork = require('./PhewasNetwork.js');
const dat = require('dat.gui');

HTMLWidgets.widget({

  name: 'network3d',

  type: 'output',

  factory: function(el, width, height) {

    const plot = new PhewasNetwork(el, width, height);

    return {

      renderValue: function(x) {

        const gui = new dat.GUI();
        const node_strength = gui.add(plot, 'manybody_strength', -10,10);
        const link_strength = gui.add(plot, 'link_strength');
        const link_static = gui.add(plot, 'static_length_strength');
        const num_iterations = gui.add(plot, 'max_iterations', 0, 1000).step(10);

        const updateSim = () => plot.updateSim();

        node_strength.onFinishChange(updateSim);
        link_strength.onFinishChange(updateSim);
        link_static.onFinishChange(updateSim);
        num_iterations.onFinishChange(updateSim);

        x.data.edges = HTMLWidgets.dataframeToD3(x.data.edges);
        x.data.vertices = HTMLWidgets.dataframeToD3(x.data.vertices);

        //const data = {
        //  edges: HTMLWidgets.dataframeToD3(x.data.edges),
        //  vertices: HTMLWidgets.dataframeToD3(x.data.vertices),
        //};

        //const {settings, user_camera_settings, user_control_settings} = x;
        //
        //const {
        //  data,
        //  user_camera_settings,
        //  user_control_settings,
        //  node_outline_black,
        //  background_color,
        //  node_size,
        //  raycast_res,
        //  edge_color,
        //  edge_opacity,
        //  interactive,
        //  selection_size_mult,
        //  select_all,
        //  show_simulation_progress,
        //  max_iterations,
        //  force_strength } = x

        //plot.addData({data, settings, user_camera_settings, user_control_settings});
        plot.addData(x);
        console.log('rendering!');

      },

      resize: function(width, height) {
        plot.resize(width, height);
      }

    };
  }
});
