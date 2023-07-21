import {Coordinate} from "./coordinate"
import type * as p from "core/properties"

export namespace Node {
  export type Attrs = p.AttrsOf<Props>

  export type Props = Coordinate.Props & {
    term: p.Property<string>
  }
}

export interface Node extends Node.Attrs {}

export class Node extends Coordinate {
  declare properties: Node.Props

  constructor(attrs?: Partial<Node.Attrs>) {
    super(attrs)
  }

  static {
    this.define<Node.Props>(({String}) => ({
      term: [ String ],
    }))
  }
}
