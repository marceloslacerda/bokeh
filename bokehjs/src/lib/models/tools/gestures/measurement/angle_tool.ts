import {GestureTool, GestureToolView} from "../gesture_tool"
import {AngleUnits, Direction} from "core/enums"
import type {PanEvent} from "core/ui_events"
import type * as p from "core/properties"
import {tool_icon_geometry} from "styles/icons.css"
import {assert} from "core/util/assert"
import {atan2, invert_angle} from "core/util/math"
import {Arc} from "models/shapes/arc"
import {Marker} from "models/shapes/marker"
import {Segment} from "models/shapes/segment"
import {Label} from "models/shapes/label"
import {XY} from "models/coordinates/xy"
import {VeeHead} from "models/shapes/arrow_heads"

const {min, sqrt, sin, cos} = Math

export class AngleToolView extends GestureToolView {
  declare model: AngleTool

  protected state: {sx: number, sy: number, dx: number, dy: number} | null = null

  protected _arc = new Arc({coordinates: "screen", x: NaN, y: NaN, radius: NaN, start_angle: NaN, end_angle: NaN, decorations: [{marker: new VeeHead({size: 10}), node: "end"}]})
  protected _hypotenuse = new Segment({coordinates: "screen", x0: NaN, y0: NaN, x1: NaN, y1: NaN})
  protected _adjacent = new Segment({coordinates: "screen", x0: NaN, y0: NaN, x1: NaN, y1: NaN})
  protected _start = new Marker({coordinates: "screen", at: new XY({x: NaN, y: NaN}), marker: "circle", size: 10, fill_color: "white"})
  protected _end = new Marker({coordinates: "screen", at: new XY({x: NaN, y: NaN}), marker: "circle", size: 10, fill_color: "white"})
  protected _angle = new Label({coordinates: "screen", x: NaN, y: NaN, text: "", fill_color: "white", padding: 5})
  protected _length = new Label({coordinates: "screen", x: NaN, y: NaN, text: "", fill_color: "white", padding: 5})

  override get overlays() {
    const {_arc, _hypotenuse, _adjacent, _start, _end, _angle, _length} = this
    return [...super.overlays, _arc, _hypotenuse, _adjacent, _start, _end, _angle, _length]
  }

  protected _update_geometry(): void {
    assert(this.state != null)
    const {sx: x0, sy: y0, dx, dy} = this.state
    const x1 = x0 + dx
    const y1 = y0 + dy

    const {left, right, top, bottom} = this.plot_view.frame.bbox
    const length = sqrt(dx**2 + dy**2)
    const radius = min(length, x0 - left, right - x0, y0 - top, bottom - y0)

    const angle = (() => {
      const {direction} = this.model
      const sign = direction == "anticlock" ? 1 : -1
      const angle = -sign*atan2([x0, y0], [x1, y1])
      if (angle < 0) {
        return angle + 2*Math.PI
      } else {
        return angle
      }
    })()

    this._arc.x = x0
    this._arc.y = y0
    this._arc.radius = radius
    this._arc.start_angle = 0
    this._arc.end_angle = angle

    this._start.at = new XY({x: x0, y: y0})
    this._end.at = new XY({x: x1, y: y1})

    this._hypotenuse.x0 = x0
    this._hypotenuse.y0 = y0
    this._hypotenuse.x1 = x1
    this._hypotenuse.y1 = y1

    this._adjacent.x0 = x0
    this._adjacent.y0 = y0
    this._adjacent.x1 = x0 + radius
    this._adjacent.y1 = y0

    function to_cartesian(r: number, angle: number): [number, number] {
      const x = r*cos(-angle)
      const y = r*sin(-angle)
      return [x, y]
    }

    const {precision, angle_units} = this.model

    const [ax, ay] = to_cartesian(radius, angle/2)
    this._angle.x = x0 + ax
    this._angle.y = y0 + ay
    this._angle.text = `${invert_angle(-angle, angle_units).toFixed(precision)}\u00b0`
    this._angle.anchor = "center"

    this._length.x = x1 + 10
    this._length.y = y1
    this._length.text = `${length.toFixed(precision)}`
    this._length.anchor = "center_left"

    this.parent.request_paint("everything") // TODO not everything
  }

  override _pan_start(ev: PanEvent): void {
    assert(this.state == null)
    const {sx, sy} = ev
    const {bbox} = this.plot_view.frame
    if (!bbox.contains(sx, sy)) {
      return
    }
    this.state = {sx, sy, dx: 0, dy: 0}
    this._update_geometry()
  }

  override _pan(ev: PanEvent): void {
    assert(this.state != null)
    const {sx, sy} = this.state
    const {dx, dy} = ev
    this.state = {sx, sy, dx, dy}
    this._update_geometry()
  }

  override _pan_end(_e: PanEvent): void {
    assert(this.state != null)
    this.state = null
  }
}

export namespace AngleTool {
  export type Attrs = p.AttrsOf<Props>

  export type Props = GestureTool.Props & {
    angle_offset: p.Property<number>
    angle_units: p.Property<AngleUnits>
    direction: p.Property<Direction>
    precision: p.Property<number>
    // granularity
    distance: p.Property<boolean>
    persistent: p.Property<boolean>
  }
}

export interface AngleTool extends AngleTool.Attrs {}

export class AngleTool extends GestureTool {
  declare properties: AngleTool.Props
  declare __view_type__: AngleToolView

  constructor(attrs?: Partial<AngleTool.Attrs>) {
    super(attrs)
  }

  static {
    this.prototype.default_view = AngleToolView

    this.define<AngleTool.Props>(({Boolean, Int, NonNegative, Angle}) => ({
      angle_offset: [ Angle, 0 ],
      angle_units: [ AngleUnits, "deg" ],
      direction: [ Direction, "anticlock" ],
      precision: [ NonNegative(Int), 2 ],
      distance: [ Boolean, true ],
      persistent: [ Boolean, false ],
    }))

    this.register_alias("angle", () => new AngleTool())
  }

  override tool_name = "Angle Measurement"
  override tool_icon = tool_icon_geometry
  override event_type = "pan" as "pan"
  override default_order = 11
}
