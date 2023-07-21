import {Shape, ShapeView} from "./shape"
import {Fill, Hatch, Line} from "core/property_mixins"
import {RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {min, max} from "core/util/math"

export class AnnulusView extends ShapeView {
  declare model: Annulus
  declare visuals: Annulus.Visuals

  sradius(radius: number): number {
    const {x, y} = this.model
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
    const {x, y, inner_radius, outer_radius} = this.model
    const {x_scale, y_scale} = this.scales
    return {
      sx: x_scale.compute(x),
      sy: y_scale.compute(y),
      sinner_radius: this.sradius(inner_radius),
      souter_radius: this.sradius(outer_radius),
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, sinner_radius, souter_radius} = this.geometry
    if (!isFinite(sx + sy + sinner_radius + souter_radius))
      return

    ctx.beginPath()
    ctx.arc(sx, sy, sinner_radius, 0, 2*Math.PI, true)
    ctx.moveTo(sx + souter_radius, sy)
    ctx.arc(sx, sy, souter_radius, 2*Math.PI, 0, false)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace Annulus {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x: p.Property<number>
    y: p.Property<number>
    inner_radius: p.Property<number>
    outer_radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface Annulus extends Annulus.Attrs {}

export class Annulus extends Shape {
  declare properties: Annulus.Props
  declare __view_type__: AnnulusView

  constructor(attrs?: Partial<Annulus.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnulusView

    this.mixins<Annulus.Mixins>([Fill, Hatch, Line])

    this.define<Annulus.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      inner_radius:     [ NonNegative(Number) ],
      outer_radius:     [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
    }))
  }
}
