#' network3d
#'
#' Render a 3d network visualization in an htmlwidget. Calculates the layout simulation within javascript and is fast and lightweight.
#' @param vertices Dataframe with at least one column: id, optionally a 'color' column with css valid colors of nodes, 'size' column with sizes of each vertice, 'tooltip' column for text/html of mouseover tooltip, and 'selectable' boolean column for if the node can be interacted with or not.
#' @param edges Dataframe with two columns: 'source' or the id of the node edge is coming from, and 'target' or id of node edge is going to.
#' @param node_outline_black Outline the node circles in black? Default (FALSE) is white.
#' @param background_color Color of background of plot. Any css valid color will work.
#' @param node_size How big should the nodes be? Relative to world size of 2x2x2. Note that this is overwritten if the vertices dataframe has a size column.
#' @param raycast_res Thickness of invisible raycasting selection beam. Bigger values will make it easier to select but will cause more misselections.
#' @param edge_color Color of lines conencting node/vertices.
#' @param edge_opacity Transparency of lines connecting node/vertices.
#' @param interactive Is the network interactive? I.e. does mousing over a node display what's in its 'name' column? When this is enabled (default) the standard behavior is to show names for every node. If only a subset of nodes is desired adding the logical column \code{selectable} to the vertices dataframe with \code{TRUE} for the vertices you want selected and \code{FALSE} for the nodes you don't want selected will allow finer-grain precision of interaction.
#' @param html_tooltip Are the values in the \code{tooltip} column of the vertices html? If \code{FALSE}(default) then all text within the column will be wrapped in the html tags \code{<h3>} in order to make it larger. Set to \code{TRUE} to allow arbitrary html strings to be used for custom appearance. All html will be appended inside of a \code{div} tag with the class of \code{.tooltip} so if needed custom css can be placed elsewhere in your page targeting the tooltip. E.g. \code{.tooltip p\{\}} would style all \code{p} elements within your tooltip.
#' @param selection_size_mult How much do moused over nodes get expanded?
#' @param tooltip_offset Tooltip that shows whatever's in the 'name' field should be offset by how much? (this is in screen pixels) Too little and the tip obscures your nodes, too much and it can be hard to tell what you've selected.
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
#' @examples
#'
#' # Basic use with a custom number of simulation iterations
#' network3d::network3d(data, max_iterations = 75)
#'
#' # Spins up explorer to fiddle with simulation parameters
#' network3d::network3d(data, max_iterations = 75, manybody_strength = 1, force_explorer = TRUE)
#'
#' # Custom force parameters
#' network3d::network3d(data, max_iterations = 75, manybody_strength = 1)
#'
#' # Custom camera settings: sets camera way far away from graph.
#' network3d::network3d(
#'   data,
#'   camera = list(
#'     start_pos = list(x=1.2, y=1.2, z=20)
#'   ),
#'   max_iterations = 75
#' )
#'
#' @export
network3d <- function(
  vertices,
  edges,
  camera = list(),
  controls = list(),
  node_outline_black = TRUE,
  background_color = 'white',
  node_size = 0.1,
  raycast_res = 0.05,
  edge_color = 0xbababa,
  edge_opacity = 0.1,
  interactive = TRUE,
  html_tooltip = FALSE,
  selection_size_mult = 1.5,
  tooltip_offset = 15,
  select_all = TRUE,
  show_simulation_progress = TRUE,
  max_iterations = 100,
  manybody_strength = -1,
  link_strength = NULL,
  static_length_strength = FALSE,
  force_explorer = FALSE,
  width = NULL, height = NULL, elementId = NULL) {

  # reformat the tooltip column with h2s if needed.
  if(!html_tooltip){
    vertices$tooltip = paste0('<h3>', vertices$tooltip, '</h3>')
  }

  # forward options using x
  x = list(
    data = list(vertices = vertices, edges = edges),
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
    static_length_strength = static_length_strength,
    force_explorer = force_explorer
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
