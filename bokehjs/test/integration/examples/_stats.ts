// This is based on https://github.com/jasondavies/science.js
import type {Arrayable} from "@bokehjs/core/types"
import {sort_by} from "@bokehjs/core/util/array"

const {PI, sqrt, exp, min, floor} = Math

function mean(vs: number[]): number {
  const n = vs.length
  if (n == 0)
    return NaN
  let m = 0
  for (let i = 0; i < n; i++) {
    m += (vs[i] - m)/(i + 1)
  }
  return m
}

function variance(vs: number[]): number {
  const n = vs.length
  if (n < 1)
    return NaN
  if (n == 1)
    return 0
  const m = mean(vs)
  let s = 0
  for (const v of vs) {
    s += (v - m)**2
  }
  return s/(n - 1)
}

function quantiles(d: number[], quantiles: number[]): number[] {
  d = sort_by(d, (v) => v)
  const n = d.length
  return quantiles.map((q) => {
    if (q == 0)
      return d[0]
    if (q == 1)
      return d[n - 1]

    const index = 1 + q*(n - 1)
    const lo = floor(index)
    const h = index - lo
    const a = d[lo - 1]

    return h == 0 ? a : a + h * (d[lo] - a)
  })
}

function iqr(vs: number[]): number {
  const [q0, q1] = quantiles(vs, [0.25, 0.75])
  return q1 - q0
}

function bandwidth(vs: number[]): number {
  const h = iqr(vs) / 1.34
  return 1.06*min(sqrt(variance(vs)), h)*vs.length**(-1/5)
}

function gaussian_kernel(u: number): number {
  return (1/sqrt(2*PI))*exp(-0.5*u**2)
}

export function gaussian_kde(xs: Arrayable<number>, vs: Arrayable<number>) {
  const N = vs.length
  const h = bandwidth([...vs])
  const ys = []
  for (const xi of xs) {
    let yi = 0
    for (const vj of vs) {
      yi += gaussian_kernel((xi - vj)/h)
    }
    ys.push(yi/(N*h))
  }
  return ys
}
