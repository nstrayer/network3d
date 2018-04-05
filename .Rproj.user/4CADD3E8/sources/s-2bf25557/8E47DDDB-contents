library(tidyverse)

#https://snap.stanford.edu/data/ca-GrQc.html
collabs <- read_tsv('data/ca-GrQc.txt', skip = 4, col_names = c('source', 'target'))

makeNetworkData <- function(size = 500){

  vertices <- data_frame(id = unique(collabs$source)) %>%
    mutate(index = 1:n(), color = 'steelblue', name = as.character(index)) %>%
    head(size)

  edges <- collabs %>%
    filter((source %in% vertices$id) & (target %in% vertices$id))

  list(
    edges = edges,
    vertices = vertices
  )
}


data <- makeNetworkData(2000)


devtools::install()
network3d::network3d(data, max_iterations = 75)

