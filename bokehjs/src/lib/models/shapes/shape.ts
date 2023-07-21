import {Renderer, RendererView} from "../renderers/renderer"
import type {Coordinate} from "../coordinates/coordinate"
import {XY} from "../coordinates/xy"
import type {Scale} from "../scales/scale"
import type {Context2d} from "core/util/canvas"
import {abs, ceil} from "core/util/math"
import type * as p from "core/properties"
import {build_views} from "core/build_views"
import type {ViewStorage} from "core/build_views"
import type {IterViews} from "core/view"

export type XYScale = {x_scale: Scale, y_scale: Scale}

export type SXY = {sx: number, sy: number}

export abstract class ShapeView extends RendererView {
  declare model: Shape

  get sub_renderers(): Shape[] {
    return []
  }

  protected _sub_renderers: ViewStorage<Shape> = new Map()

  override *children(): IterViews {
    yield* super.children()
    yield* this._sub_renderers.values()
  }

  override async lazy_initialize(): Promise<void> {
    await super.lazy_initialize()
    await build_views(this._sub_renderers, this.sub_renderers, {parent: this})
  }

  get scales(): XYScale {
    return {
      x_scale: this.coordinates.x_scale,
      y_scale: this.coordinates.y_scale,
    }
  }

  compute_coord(coord: Coordinate): SXY {
    if (coord instanceof XY) {
      const {x, y} = coord
      const {x_scale, y_scale} = this.scales
      const sx = x_scale.compute(x)
      const sy = y_scale.compute(y)
      return {sx, sy}
    } else {
      return {sx: NaN, sy: NaN}
    }
  }

  override connect_signals(): void {
    super.connect_signals()
    /*
    this.model.change.connect(() => {
      this.parent.request_paint(this)
    })
    */
  }

  protected _render(): void {
    const {ctx} = this.layer
    this.paint(ctx)
  }

  abstract paint(ctx: Context2d): void

  protected sdist(scale: Scale, pt: number, span: number, loc: "center" | "edge" = "edge", dilate: boolean = false): number {
    const sd = (() => {
      const compute = scale.s_compute

      switch (loc) {
        case "center": {
          const halfspan = span/2
          const spt0 = compute(pt - halfspan)
          const spt1 = compute(pt + halfspan)
          return abs(spt1 - spt0)
        }
        case "edge": {
          const spt0 = compute(pt)
          const spt1 = compute(pt + span)
          return abs(spt1 - spt0)
        }
      }
    })()

    return dilate ? ceil(sd) : sd
  }
}

export namespace Shape {
  export type Attrs = p.AttrsOf<Props>
  export type Props = Renderer.Props
  export type Visuals = Renderer.Visuals
}

export interface Shape extends Shape.Attrs {}

export abstract class Shape extends Renderer {
  declare properties: Shape.Props
  declare __view_type__: ShapeView

  static override __module__ = "bokeh.models.shapes"

  constructor(attrs?: Partial<Shape.Attrs>) {
    super(attrs)
  }

  static {
    this.override<Shape.Props>({
      level: "overlay",
    })
  }
}
