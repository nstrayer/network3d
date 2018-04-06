const makeLinkNodeStrengths = require('./MakeLinkNodeStrengths.js');

// setup the 3d simulation code
module.exports = function setupSimulation(nodes, links, connection_counts, manybody_strength, link_strength, constant_links){

   const {link_strength_func, node_strength_func} = makeLinkNodeStrengths(manybody_strength, link_strength, constant_links, connection_counts);

   const sim = d3.forceSimulation()
    .numDimensions(3)
    .nodes(nodes)
    .force("link", link_strength_func(links))
    .force("charge", node_strength_func);

  sim.tick(); // kick off a single iteration to get data into correct form

  return sim;
};
