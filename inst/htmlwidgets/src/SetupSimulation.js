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
