module.exports = function(links){
  const connection_counts = {},
        num_links = links.length;

  for(let i = 0; i < num_links; i++){
    connection_counts[links[i].source] = (connection_counts[links[i].source] || 0) + 1;
    connection_counts[links[i].target] = (connection_counts[links[i].source] || 0) + 1;
  }

  return connection_counts;
}
