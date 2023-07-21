import {Shape, ShapeView} from "./shape"
import {Line} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class BezierView extends ShapeView {
  declare model: Bezier
  declare visuals: Bezier.Visuals

  get geometry() {
    const {x0, y0, x1, y1, cx0, cy0, cx1, cy1} = this.model
    const {x_scale, y_scale} = this.scales

    return {
      sx0: x_scale.compute(x0),
      sy0: y_scale.compute(y0),
      sx1: x_scale.compute(x1),
      sy1: y_scale.compute(y1),
      scx0: x_scale.compute(cx0),
      scy0: y_scale.compute(cy0),
      scx1: cx1 != null ? x_scale.compute(cx1) : null,
      scy1: cy1 != null ? y_scale.compute(cy1) : null,
    }
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1, scx0, scy0, scx1, scy1} = this.geometry
    if (!isFinite(sx0 + sy0 + sx1 + sy1 + scx0 + scy0 + (scx1 ?? 0) + (scy1 ?? 0)))
      return

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)

    if (scx1 != null && scy1 != null)
      ctx.bezierCurveTo(scx0, scy0, scx1, scy1, sx1, sy1)
    else
      ctx.quadraticCurveTo(scx0, scy0, sx1, sy1)

    this.visuals.line.apply(ctx)
  }
}

export namespace Bezier {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x0: p.Property<number>
    y0: p.Property<number>
    x1: p.Property<number>
    y1: p.Property<number>
    cx0: p.Property<number>
    cy0: p.Property<number>
    cx1: p.Property<number | null>
    cy1: p.Property<number | null>
  } & Mixins

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {line: visuals.Line}
}

export interface Bezier extends Bezier.Attrs {}

export class Bezier extends Shape {
  declare properties: Bezier.Props
  declare __view_type__: BezierView

  constructor(attrs?: Partial<Bezier.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = BezierView

    this.mixins<Bezier.Mixins>(Line)

    this.define<Bezier.Props>(({Number, Nullable}) => ({
      x0:      [ Number ],
      y0:      [ Number ],
      x1:      [ Number ],
      y1:      [ Number ],
      cx0:     [ Number ],
      cy0:     [ Number ],
      cx1:     [ Nullable(Number), null ],
      cy1:     [ Nullable(Number), null ],
    }))
  }
}
