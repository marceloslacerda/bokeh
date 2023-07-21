import {Shape, ShapeView} from "./shape"
import {Fill, Hatch, Line} from "core/property_mixins"
import {AngleUnits, Direction, RadiusDimension} from "core/enums"
import type * as visuals from "core/visuals"
import type * as p from "core/properties"
import type {Context2d} from "core/util/canvas"
import {min, max, compute_angle} from "core/util/math"

export class AnnularWedgeView extends ShapeView {
  declare model: AnnularWedge
  declare visuals: AnnularWedge.Visuals

  sradius(radius: number): number {
    const {x, y} = this.model
    const {x_scale, y_scale} = this.scales

    const srx = this.sdist(x_scale, x, radius)
    const sry = this.sdist(y_scale, y, radius)

    const sradius = (() => {
      switch (this.model.radius_dimension) {
        case "x":   return srx
        case "y":   return sry
        case "min": return min(srx, sry)
        case "max": return max(srx, sry)
      }
    })()

    return sradius
  }

  get start_angle(): number {
    return compute_angle(this.model.start_angle, this.model.angle_units)
  }

  get end_angle(): number {
    return compute_angle(this.model.end_angle, this.model.angle_units)
  }

  get anticlock(): boolean {
    return this.model.direction == "anticlock"
  }

  get geometry() {
    const {x, y, inner_radius, outer_radius} = this.model
    const {x_scale, y_scale} = this.scales
    return {
      sx: x_scale.compute(x),
      sy: y_scale.compute(y),
      sinner_radius: this.sradius(inner_radius),
      souter_radius: this.sradius(outer_radius),
      start_angle: this.start_angle,
      end_angle: this.end_angle,
      anticlock: this.anticlock,
    }
  }

  paint(ctx: Context2d): void {
    const {sx, sy, start_angle, end_angle, sinner_radius, souter_radius, anticlock} = this.geometry
    if (!isFinite(sx + sy + sinner_radius + souter_radius + start_angle + end_angle))
      return

    const angle = end_angle - start_angle

    ctx.translate(sx, sy)
    ctx.rotate(start_angle)

    ctx.beginPath()
    ctx.moveTo(souter_radius, 0)
    ctx.arc(0, 0, souter_radius, 0, angle, anticlock)
    ctx.rotate(angle)
    ctx.lineTo(sinner_radius, 0)
    ctx.arc(0, 0, sinner_radius, 0, -angle, !anticlock)
    ctx.closePath()

    ctx.rotate(-angle - start_angle)
    ctx.translate(-sx, -sy)

    this.visuals.fill.apply(ctx)
    this.visuals.hatch.apply(ctx)
    this.visuals.line.apply(ctx)
  }
}

export namespace AnnularWedge {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Shape.Props & {
    x: p.Property<number>
    y: p.Property<number>
    inner_radius: p.Property<number>
    outer_radius: p.Property<number>
    radius_dimension: p.Property<RadiusDimension>
    start_angle: p.Property<number>
    end_angle: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
  } & Mixins

  export type Mixins = Fill & Hatch & Line

  export type Visuals = Shape.Visuals & {
    fill: visuals.Fill
    hatch: visuals.Hatch
    line: visuals.Line
  }
}

export interface AnnularWedge extends AnnularWedge.Attrs {}

export class AnnularWedge extends Shape {
  declare properties: AnnularWedge.Props
  declare __view_type__: AnnularWedgeView

  constructor(attrs?: Partial<AnnularWedge.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AnnularWedgeView

    this.mixins<AnnularWedge.Mixins>([Fill, Hatch, Line])

    this.define<AnnularWedge.Props>(({Number, NonNegative}) => ({
      x:                [ Number ],
      y:                [ Number ],
      inner_radius:     [ NonNegative(Number) ],
      outer_radius:     [ NonNegative(Number) ],
      radius_dimension: [ RadiusDimension, "x" ],
      start_angle:      [ Number ],
      end_angle:        [ Number ],
      angle_units:      [ AngleUnits, "rad" ],
      direction:        [ Direction, "anticlock" ],
    }))
  }
}
