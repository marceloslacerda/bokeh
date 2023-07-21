import {Shape, ShapeView} from "./shape"
import {Line} from "core/property_mixins"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"

export class SegmentView extends ShapeView {
  declare model: Segment
  declare visuals: Segment.Visuals

  get geometry() {
    const {x0, y0, x1, y1} = this.model
    const {x_scale, y_scale} = this.scales
    const sx0 = x_scale.compute(x0)
    const sy0 = y_scale.compute(y0)
    const sx1 = x_scale.compute(x1)
    const sy1 = y_scale.compute(y1)
    return {sx0, sy0, sx1, sy1}
  }

  paint(ctx: Context2d): void {
    const {sx0, sy0, sx1, sy1} = this.geometry
    if (!isFinite(sx0 + sy0 + sx1 + sy1))
      return

    ctx.beginPath()
    ctx.moveTo(sx0, sy0)
    ctx.lineTo(sx1, sy1)

    this.visuals.line.apply(ctx)
  }
}

export namespace Segment {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x0: p.Property<number>
    y0: p.Property<number>
    x1: p.Property<number>
    y1: p.Property<number>
  } & Mixins

  export type Mixins = Line

  export type Visuals = Shape.Visuals & {
    line: visuals.Line
  }
}

export interface Segment extends Segment.Attrs {}

export class Segment extends Shape {
  declare properties: Segment.Props
  declare __view_type__: SegmentView

  constructor(attrs?: Partial<Segment.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = SegmentView

    this.mixins<Segment.Mixins>(Line)

    this.define<Segment.Props>(({Number}) => ({
      x0: [ Number ],
      y0: [ Number ],
      x1: [ Number ],
      y1: [ Number ],
    }))
  }
}
