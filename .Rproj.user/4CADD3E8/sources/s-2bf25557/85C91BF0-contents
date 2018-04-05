#' <Add Title>
#'
#' <Add Description>
#'
#' @import htmlwidgets
#'
#' @export
bipartiteNetwork <- function(
  data,
  colors = list(),
  sizes = list(),
  camera = list(),
  controls = list(),
  misc = list(),
  max_iterations = 100,
  force_strength = -1,
  width = NULL, height = NULL, elementId = NULL) {

  # forward options using x
  x = list(
    data = data,
    settings = list(
      colors = colors,
      sizes = sizes,
      camera = camera,
      controls = controls,
      misc = misc,
      max_iterations = max_iterations,
      force_strength = force_strength
    )
  )

  # create widget
  htmlwidgets::createWidget(
    name = 'bipartiteNetwork',
    x,
    width = width,
    height = height,
    package = 'bipartiteNetwork',
    elementId = elementId
  )
}


#' Shiny bindings for bipartiteNetwork
#'
#' Output and render functions for using bipartiteNetwork within Shiny
#' applications and interactive Rmd documents.
#'
#' @param outputId output variable to read from
#' @param width,height Must be a valid CSS unit (like \code{'100\%'},
#'   \code{'400px'}, \code{'auto'}) or a number, which will be coerced to a
#'   string and have \code{'px'} appended.
#' @param expr An expression that generates a bipartiteNetwork
#' @param env The environment in which to evaluate \code{expr}.
#' @param quoted Is \code{expr} a quoted expression (with \code{quote()})? This
#'   is useful if you want to save an expression in a variable.
#'
#' @name bipartiteNetwork-shiny
#'
#' @export
bipartiteNetworkOutput <- function(outputId, width = '100%', height = '400px'){
  htmlwidgets::shinyWidgetOutput(outputId, 'bipartiteNetwork', width, height, package = 'bipartiteNetwork')
}

#' @rdname bipartiteNetwork-shiny
#' @export
renderBipartiteNetwork <- function(expr, env = parent.frame(), quoted = FALSE) {
  if (!quoted) { expr <- substitute(expr) } # force quoted
  htmlwidgets::shinyRenderWidget(expr, bipartiteNetworkOutput, env, quoted = TRUE)
}
