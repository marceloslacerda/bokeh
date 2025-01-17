import {expect} from "assertions"

import type {DataOf} from "./_util"
import {create_glyph_view} from "./_util"
import {HSpan} from "@bokehjs/models/glyphs/hspan"
import type {Geometry} from "@bokehjs/core/geometry"
import {assert} from "@bokehjs/core/util/assert"

describe("HSpan", () => {

  it("should calculate bounds", async () => {
    const glyph = new HSpan()
    const data = {y: [0, 1, 2, 3]} satisfies DataOf<HSpan>
    const glyph_view = await create_glyph_view(glyph, data)
    const bounds = glyph_view.bounds()
    expect(bounds).to.be.equal({x0: NaN, x1: NaN, y0: 0, y1: 3})
  })

  it("should calculate log bounds", async () => {
    const glyph = new HSpan()
    const data = {y: [0, 1, 2, 3]} satisfies DataOf<HSpan>
    const glyph_view = await create_glyph_view(glyph, data)
    const log_bounds = glyph_view.log_bounds()
    expect(log_bounds).to.be.equal({x0: NaN, x1: NaN, y0: 1, y1: 3})
  })

  describe("_hit_point", () => {

    it("should return indices of the HSpan that was hit", async () => {
      const glyph = new HSpan()
      const data = {y: [0, 10, 50, 90]} satisfies DataOf<HSpan>
      const glyph_view = await create_glyph_view(glyph, data, {axis_type: "linear"})

      const {x_scale, y_scale} = glyph_view.parent.coordinates
      function compute(x: number, y: number) {
        return {sx: x_scale.compute(x), sy: y_scale.compute(y)}
      }

      const geometry0: Geometry = {type: "point", ...compute(50,  0)}
      const geometry1: Geometry = {type: "point", ...compute(50, 10)}
      const geometry2: Geometry = {type: "point", ...compute(50, 50)}
      const geometry3: Geometry = {type: "point", ...compute(50, 90)}
      const geometry4: Geometry = {type: "point", ...compute(50, 95)}

      const result0 = glyph_view.hit_test(geometry0)
      const result1 = glyph_view.hit_test(geometry1)
      const result2 = glyph_view.hit_test(geometry2)
      const result3 = glyph_view.hit_test(geometry3)
      const result4 = glyph_view.hit_test(geometry4)

      assert(result0 != null)
      assert(result1 != null)
      assert(result2 != null)
      assert(result3 != null)
      assert(result4 != null)

      expect(result0.indices).to.be.equal([0])
      expect(result1.indices).to.be.equal([1])
      expect(result2.indices).to.be.equal([2])
      expect(result3.indices).to.be.equal([3])
      expect(result4.indices).to.be.equal([])
    })
  })
})
