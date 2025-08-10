export type Point = {
  x: number;
  y: number;
}

export type Line = [Point, Point];

export type Mode = "text" | "line";

export interface Box extends Point {
  id: string
}

export type Dimension = {
  width: number
  height: number
}
