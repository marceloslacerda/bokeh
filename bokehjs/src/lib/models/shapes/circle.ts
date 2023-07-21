import {Shape, ShapeView} from "./shape"
import {Fill, Hatch, Line} from "core/property_mixins"
import {RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {min, max} from "core/util/math"

export class CircleView extends ShapeView {
  declare model: Circle
  declare visuals: Circle.Visuals

  get sradius(): number {
    const {x, y, radius} = this.model
    const {x_scale, y_scale} = this.scales

    const srx = this.sdist(x_scale, x, radius)
    const sry = this.sdist(y_scale, y, radius)

    switch (this.model.radius_dimension) {
      case "x":   return srx
      case "y":   return sry
      case "min": return min(srx, sry)
      case "max": return max(srx, sry)
    }
  }

  get geometry() {
    const {x, y} = this.model
    const {x_scale, y_scale} = this.scales
    const sx = x_scale.compute(x)
    const sy = y_scale.compute(y)
    const {sradius} = this
    return {sx, sy, sradius}
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sradius} = this.geometry
    if (!isFinite(sx + sy + sradius))
      return

    ctx.beginPath()
    ctx.arc(sx, sy, sradius, 0, 2*Math.PI, false)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Circle {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x: p.Property<number>
    y: p.Property<number>
    radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Circle extends Circle.Attrs {}

export class Circle extends Shape {
  declare properties: Circle.Props
  declare __view_type__: CircleView

  constructor(attrs?: Partial<Circle.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = CircleView

    this.mixins<Circle.Mixins>([Fill, Hatch, Line])

    this.define<Circle.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      radius:           [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
