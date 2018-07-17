const PhewasNetwork = require('./PhewasNetwork.js');
const dat = require('dat.gui');

HTMLWidgets.widget({

  name: 'network3d',

  type: 'output',

  factory: function(el, width, height) {

    const plot = new PhewasNetwork(el, width, height);
    console.log("the stuff is updating!")
    return {

      renderValue: function(x) {

        if(x.force_explorer){
          const gui_container = d3.select(el)
          .append('div')
          .attr('id', 'gui-container')
          .style('position', 'absolute')
          .style('top', '10px')
          .style('left', `${width - 255}px`);

          const gui = new dat.GUI({ autoPlace: false } );

          document.getElementById('gui-container').appendChild(gui.domElement);

          const node_strength  = gui.add(plot, 'manybody_strength', -10,10);
          const link_static    = gui.add(plot, 'static_length_strength');
          const link_strength  = gui.add(plot, 'link_strength', 0, 5);
          const num_iterations = gui.add(plot, 'max_iterations', 0, 1000).step(10);

          const updateSim = () => plot.updateSim();

          node_strength.onFinishChange(updateSim);
          link_strength.onFinishChange(updateSim);
          link_static.onFinishChange(updateSim);
          num_iterations.onFinishChange(updateSim);
        }

        x.data.edges = HTMLWidgets.dataframeToD3(x.data.edges);
        x.data.vertices = HTMLWidgets.dataframeToD3(x.data.vertices);

        plot.addData(x);
      },

      resize: function(width, height) {
        plot.resize(width, height);
      }

    };
  }
});
