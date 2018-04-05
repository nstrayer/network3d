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
