import { Dimension, Box, Mode } from "@/types";

interface Props extends Dimension, Omit<Box, 'id'> {
  tool: Mode | null
}

export default function LineGroupBox({ x, y, width, height, tool }: Props) {
  const spacing = 8;
  const style = {
    left: `${x - spacing}px`,
    top: `${y - spacing}px`,
    width: `${width + spacing * 2}px`,
    height: `${height + spacing * 2}px`,
  }
  return <div 
    className={`movable-object absolute z-10 border-1 border-dashed p-2 border-black ${tool !== null ? 'pointer-events-none' : 'cursor-move'}`} 
    style={style}>
  </div>
}