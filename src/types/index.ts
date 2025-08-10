export type Point = {
  x: number;
  y: number;
}

export type Line = [Point, Point];

export type Mode = "text" | "line";

export type Box = {
  id: string
  x: number
  y: number
}

export type Dimension = {
  width: number
  height: number
}
