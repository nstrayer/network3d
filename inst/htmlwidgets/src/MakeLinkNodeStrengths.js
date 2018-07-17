const d3_force = require('d3-force-3d');

module.exports = function(manybody_strength, link_strength, constant_links, connection_counts){
  //const maxCount = Math.max(...Object.values(connection_counts));

  const link_strength_func = links => d3_force.forceLink(links)
    .id(d => d.id)
    .strength(
      link => constant_links ?
        link_strength:
        (1 / Math.min(connection_counts[link.source.id],connection_counts[link.target.id]))
    );

  const node_strength_func = d3_force.forceManyBody()
    .strength(manybody_strength);

  return {link_strength_func, node_strength_func};
};
