#' <Add Title>
#'
#' <Add Description>
#' @param node_outline_black Outline the node circles in black? Default (FALSE) is white.
#' @param background_color Color of background of plot. Any css valid color will work.
#' @param node_size How big should the nodes be? Relative to world size of 2x2x2. Note that this is overwritten if the vertices dataframe has a size column.
#' @param raycast_res Thickness of invisible raycasting selection beam. Bigger values will make it easier to select but will cause more misselections.
#' @param edge_color Color of lines conencting node/vertices.
#' @param edge_opacity Transparency of lines connecting node/vertices.
#' @param interactive Is the network interactive? I.e. does mousing over a node display what's in its 'name' column?
#' @param selection_size_mult How much do moused over nodes get expanded?
#' @param tooltip_offset Tooltip that shows whatever's in the 'name' field should be offset by how much? (this is in screen pixels) Too little and the tip obscures your nodes, too much and it can be hard to tell what you've selected.
#' @param select_all Do we show tooltip for every node or just nodes with TRUE in a column 'selectable' in the node values?
#' @param max_iterations Number of iterations the layout simulation runs.
#' @param manybody_strength Attractive force between nodes irrespective of links. See https://github.com/d3/d3-force#many-body for more details/
#' @param link_strength attractive force of links. Falsy values default to a function of number of connections. See https://github.com/d3/d3-force#links for more details.
#' @param show_simulation_progress Show small popup while layout is being calculated so user knows when it has finished?
#' @param manybody_strength How strong is the pull between nodes regardless of links? Positive means they are attracted to eachother, negative: repelled.
#' @param link_strength How strong are the links between the nodes?
#' @param static_length_strength If TRUE then all links have same strength, otherwise they are scaled by the number of connections each node has. (More connections = each link is less strong).
#'
#' @import htmlwidgets
#'
#' @export
network3d <- function(
  data,
  camera = list(),
  controls = list(),
  node_outline_black = TRUE,
  background_color = 'white',
  node_size = 0.1,
  raycast_res = 0.05,
  edge_color = 0xbababa,
  edge_opacity = 0.1,
  interactive = TRUE,
  selection_size_mult = 1.5,
  tooltip_offset = 15,
  select_all = TRUE,
  show_simulation_progress = TRUE,
  max_iterations = 100,
  manybody_strength = -1,
  link_strength = NULL,
  static_length_strength = FALSE,
  width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    user_camera_settings = camera,
    user_control_settings = controls,
    node_outline_black = node_outline_black,
    background_color = background_color,
    node_size = node_size,
    raycast_res = raycast_res,
    edge_color = edge_color,
    edge_opacity = edge_opacity,
    interactive = interactive,
    selection_size_mult = selection_size_mult,
    tooltip_offset = tooltip_offset,
    select_all = select_all,
    show_simulation_progress = show_simulation_progress,
    max_iterations = max_iterations,
    manybody_strength = manybody_strength,
    link_strength = link_strength,
    static_length_strength = static_length_strength
  )

  # node_outline_black: true, // Outline the node circles in black? Default is white
  # background_color: 'white',// Color of background
  # node_size: 0.1,           //
  #   raycast_res: 0.05,        // Thickness of invisible raycasting selection beam
  # edge_color: 0xbababa,     // edges between nodes
  # edge_opacity: 0.1,        // How transparent should our node connections be
  # interactive: true,        // Turn off all interactivity with the network?
  #   selection_size_mult: 1.5, // How much do we expand moused over nodes?
  #   tooltip_offset: 20,       // Tooltip that shows whatever's in the 'name' field should be offset by how much?
  # select_all: true,         // do we show tooltip for every node or just the 'hub' nodes?
  # max_iterations: 250,      // Number of iterations the layout simulation runs
  # manybody_strength: -1,    // Attractive force between nodes irrespective of links
  # link_strength: null,      // attractive force of links. Falsy values default to a function of number of connections.
  # show_simulation_progress: true, // show small popup while layout is being calculated?

  # create widget
  htmlwidgets::createWidget(
    name = 'network3d',
    x,
    width = width,
    height = height,
    package = 'network3d',
    elementId = elementId
  )
}

#' Shiny bindings for network3d
#'
#' Output and render functions for using network3d within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a network3d
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name network3d-shiny
#'
#' @export
network3dOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'network3d', width, height, package = 'network3d')
}

#' @rdname network3d-shiny
#' @export
renderNetwork3d <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, network3dOutput, env, quoted = TRUE)
}
