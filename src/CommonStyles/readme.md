# Gmx CSS Framework

- `.gmx-icon` Adds special styles to vector icons
- `.gmx-link` Represents a text link
- `.gmx-link_icon` Applied to icon links
- `.gmx-input-text` Represents a text field
- `.gmx-input-text_readonly` Represents a readonly text field
- `.gmx-input-text_maxwidth` Stretches a text field to 100% width
- `.gmx-listNode` Represents a node of a list. e.g. layers, geometries. Use with `.ui-widget-content`.
- `.gmx-listNode_clickable` Adds `cusor: pointer` style.
- `.gmx-listNode_hoverable` Highlights an element on hover.
- `.gmx-table` Adds `display: table` to an element
- `.gmx-table-row` Adds `display: table-row` to an element
- `.gmx-table-cell` Adds `display: table-cell` to an element

# jQuery CSS Framework

## Layout helpers

- `.ui-helper-hidden` Hides content visually and from assistive technologies, such as screen readers.
- `.ui-helper-hidden-accessible` Hides content visually, but leaves it available to assistive technologies.
- `.ui-helper-reset` A basic style reset for DOM nodes. Resets padding, margins, text-decoration, list-style, etc.
- `.ui-helper-clearfix` Applies float wrapping properties to parent elements.
- `.ui-front` Applies z-index to manage the stacking of multiple widgets on the screen. See the page about stacking elements for more details.

## Widget containers

- `.ui-widget` Class to be applied to the outer container of all widgets. Applies font-family and font size to widgets.
- `.ui-widget-header` Class to be applied to header containers. Applies header container styles to an element and its child text, links, and icons.
- `.ui-widget-content` Class to be applied to content containers. Applies content container styles to an element and its child text, links, and icons. (can be applied to parent or sibling of header).

## Interaction States

- `.ui-state-default` Class to be applied to clickable button-like elements. Applies "clickable default" container styles to an element and its child text, links, and icons.
- `.ui-state-hover` Class to be applied on mouseover to clickable button-like elements. Applies "clickable hover" container styles to an element and its child text, links, and icons.
- `.ui-state-focus` Class to be applied on keyboard focus to clickable button-like elements. Applies "clickable focus" container styles to an element and its child text, links, and icons.
- `.ui-state-active` Class to be applied on mousedown to clickable button-like elements. Applies "clickable active" container styles to an element and its child text, links, and icons.

## Interaction Cues

- `.ui-state-highlight` Class to be applied to highlighted or selected elements. Applies "highlight" container styles to an element and its child text, links, and icons.
- `.ui-state-error` Class to be applied to error messaging container elements. Applies "error" container styles to an element and its child text, links, and icons.
- `.ui-state-error-text` An additional class that applies just the error text color without background. Can be used on form labels for instance. Also applies error icon color to child icons.
- `.ui-state-disabled` Applies a dimmed opacity to disabled UI elements. Meant to be added in addition to an already-styled element.
- `.ui-priority-primary` Class to be applied to a priority-1 button in situations where button hierarchy is needed.
- `.ui-priority-secondary` Class to be applied to a priority-2 button in situations where button hierarchy is needed.

## Icons

States and images

- `.ui-icon` Base class to be applied to an icon element. Sets dimensions to a 16px square block, hides inner text, and sets background image to the "content" state sprite image. Note: ui-icon class will be given a different sprite background image depending on its parent container. For example, a ui-icon element within a ui-state-default container will get colored according to the ui-state-default's icon color.
