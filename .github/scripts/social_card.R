##########################################################################################
# LINK-PREVIEW IMAGE OF THE HOME PAGE
##########################################################################################
# Draws social-card.png at the root of this repository: 1200 x 630 px, the size LinkedIn,
# Mastodon, Slack and X show in full when a link to https://sedzinfo.github.io/ is posted.
# index.html points to it with og:image and twitter:image. Same design as the cards of the
# tutorial sites (quarto/_shared/social_card.R in the vignettes repository).
# Re-run after changing the text below, from the repository root:
#   Rscript .github/scripts/social_card.R
##########################################################################################
library(grid)

label   <- "SEDZINFO"
title   <- "R packages, Shiny apps and tutorials"
tagline <- "Statistics and psychometrics in R: IRT, adaptive testing and data explorers"
url     <- "sedzinfo.github.io"

navy <- "#2C3E50"; teal <- "#18BC9C"; light <- "#ECF0F1"; muted <- "#AEB6BF"   # Flatly, the theme of the sites
fonts <- systemfonts::system_fonts()$family
font <- c("Lato", "Segoe UI", "Helvetica", "Arial")
font <- font[font %in% fonts][1]
if (is.na(font)) font <- "sans"

ragg::agg_png("social-card.png", width = 1200, height = 630, units = "px", res = 72, background = navy)
grid.newpage()
# background: item response curves, faint, on the right
theta <- seq(-4, 4, length.out = 200)
curves <- list(c(a = 1.0, b = -1.5, c = 0.00), c(a = 1.8, b = -0.3, c = 0.15),
               c(a = 0.7, b = 0.6, c = 0.00), c(a = 2.6, b = 1.4, c = 0.05))
pushViewport(viewport(x = 0.74, y = 0.5, width = 0.5, height = 0.78))
for (k in curves) {
  p <- k[["c"]] + (1 - k[["c"]]) / (1 + exp(-1.7 * k[["a"]] * (theta - k[["b"]])))
  grid.lines((theta + 4) / 8, p, gp = gpar(col = teal, alpha = 0.22, lwd = 7, lineend = "round"))
}
popViewport()
# accent bar, label, title, tagline, address
grid.rect(x = 0, width = 0.012, just = "left", gp = gpar(fill = teal, col = NA))
left <- unit(80, "points")
grid.text(label, x = left, y = unit(630 - 92, "points"), just = c("left", "center"),
          gp = gpar(fontfamily = font, fontface = "bold", fontsize = 26, col = teal))
title_lines <- strwrap(title, width = 22)
title_top <- 630 - 175
grid.text(paste(title_lines, collapse = "\n"), x = left, y = unit(title_top, "points"), just = c("left", "top"),
          gp = gpar(fontfamily = font, fontface = "bold", fontsize = 76, lineheight = 1.05, col = "white"))
tagline_top <- title_top - 1.05 * 76 * length(title_lines) - 34
grid.text(paste(strwrap(tagline, width = 46), collapse = "\n"), x = left, y = unit(tagline_top, "points"),
          just = c("left", "top"), gp = gpar(fontfamily = font, fontsize = 34, lineheight = 1.25, col = light))
grid.text(url, x = left, y = unit(64, "points"), just = c("left", "center"),
          gp = gpar(fontfamily = font, fontsize = 26, col = muted))
invisible(dev.off())
cat("social-card.png written; font:", font, "\n")
