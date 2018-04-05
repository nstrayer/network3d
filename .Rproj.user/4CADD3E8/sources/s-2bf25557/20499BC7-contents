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
